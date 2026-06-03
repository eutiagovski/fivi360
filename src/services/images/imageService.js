/**
 * Serviço de imagens 360°.
 *
 * Responsabilidade:
 * - CRUD de imagens no Firestore (coleção `images`)
 * - Upload de arquivos no Firebase Storage
 * - Conversão WEBP antes do upload
 * - Atualização automática de coverImage na primeira imagem
 *
 * Storage path: users/{userId}/projects/{projectId}/images/{imageId}.webp
 *
 * @see docs/architecture.md
 */

import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/config/firebase";
import { convertToWebp } from "@/utils/imageConversion";
import {
  getProjectById,
  updateProject,
} from "@/services/projects/projectService";
import {
  assertCanReplaceImageStorage,
  assertCanUploadImage,
  assertPublicVisibilityEnabled,
} from "@/services/plans/planService";
import { deleteImageFile } from "@/services/storage/storageService";

/**
 * @typedef {Object} Image
 * @property {string} id
 * @property {string} userId
 * @property {string | null} projectId
 * @property {string} title
 * @property {string} originalUrl
 * @property {string} previewUrl
 * @property {string} storagePath
 * @property {number} sizeBytes
 * @property {number} width
 * @property {number} height
 * @property {string} originalFileType
 * @property {string} optimizedFileType
 * @property {'private' | 'shared' | 'public'} visibility
 * @property {import("firebase/firestore").Timestamp | null} [createdAt]
 * @property {import("firebase/firestore").Timestamp | null} [updatedAt]
 */

/**
 * @typedef {Object} UploadImageOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {string} [originalFileType]
 * @property {(step: string) => void} [onProgress]
 */

/**
 * @typedef {Object} ReplaceImageFileOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {string} [originalFileType]
 * @property {string} [title]
 * @property {(step: string) => void} [onProgress]
 */

/**
 * @param {string} imageId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {Image}
 */
function normalizeProjectId(projectId) {
  if (projectId === undefined || projectId === null || projectId === "") {
    return null;
  }

  return projectId;
}

/**
 * @param {string} userId
 * @param {string | null} projectId
 * @param {string} imageId
 * @returns {string}
 */
function getImageStoragePath(userId, projectId, imageId) {
  if (projectId) {
    return `users/${userId}/projects/${projectId}/images/${imageId}.webp`;
  }

  return `users/${userId}/images/${imageId}.webp`;
}

function mapImageDoc(imageId, data) {
  return {
    id: imageId,
    userId: data.userId ?? "",
    projectId: normalizeProjectId(data.projectId),
    title: data.title ?? "",
    originalUrl: data.originalUrl ?? "",
    previewUrl: data.previewUrl ?? "",
    storagePath: data.storagePath ?? "",
    sizeBytes: data.sizeBytes ?? 0,
    width: data.width ?? 0,
    height: data.height ?? 0,
    originalFileType: data.originalFileType ?? "",
    optimizedFileType: data.optimizedFileType ?? "image/webp",
    visibility: data.visibility ?? "private",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {Image[]} images
 * @returns {Image[]}
 */
function sortImagesByCreatedAtAsc(images) {
  return [...images].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
}

/**
 * @param {Image[]} images
 * @returns {Image[]}
 */
function sortImagesByCreatedAtDesc(images) {
  return [...images].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function formatImageResolution(width, height) {
  if (!width || !height) {
    return "—";
  }

  return `${width} × ${height}`;
}

/**
 * Lista imagens de um projeto (requer userId para regras Firestore).
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<Image[]>}
 */
export async function getImagesByProjectId(projectId, userId) {
  const imagesQuery = query(
    collection(db, "images"),
    where("userId", "==", userId),
    where("projectId", "==", projectId),
  );
  const snapshot = await getDocs(imagesQuery);

  const images = snapshot.docs.map((docSnap) =>
    mapImageDoc(docSnap.id, docSnap.data()),
  );

  return sortImagesByCreatedAtAsc(images);
}

/**
 * Lista imagens de um projeto para páginas públicas (query só por projectId).
 *
 * @param {string} projectId
 * @returns {Promise<Image[]>}
 */
export async function getImagesByProjectIdPublic(projectId) {
  const imagesQuery = query(
    collection(db, "images"),
    where("projectId", "==", projectId),
  );
  const snapshot = await getDocs(imagesQuery);

  const images = snapshot.docs.map((docSnap) =>
    mapImageDoc(docSnap.id, docSnap.data()),
  );

  return sortImagesByCreatedAtAsc(images);
}

/**
 * Lista imagens soltas do usuário (projectId == null), mais recentes primeiro.
 *
 * @param {string} userId
 * @returns {Promise<Image[]>}
 */
export async function getLooseImagesByUserId(userId) {
  const imagesQuery = query(
    collection(db, "images"),
    where("userId", "==", userId),
    where("projectId", "==", null),
  );
  const snapshot = await getDocs(imagesQuery);

  const images = snapshot.docs.map((docSnap) =>
    mapImageDoc(docSnap.id, docSnap.data()),
  );

  return sortImagesByCreatedAtDesc(images);
}

/**
 * Lista as imagens mais recentes do usuário (com ou sem projeto).
 *
 * @param {string} userId
 * @param {number} [limit]
 * @returns {Promise<Image[]>}
 */
export async function getRecentImagesByUserId(userId, limit = 3) {
  const imagesQuery = query(
    collection(db, "images"),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(imagesQuery);

  const images = snapshot.docs.map((docSnap) =>
    mapImageDoc(docSnap.id, docSnap.data()),
  );

  return sortImagesByCreatedAtDesc(images).slice(0, limit);
}

/**
 * Busca uma imagem pelo ID (Firestore `images/{imageId}`).
 *
 * @param {string} imageId
 * @returns {Promise<Image | null>}
 */
export async function getImageById(imageId) {
  const snapshot = await getDoc(doc(db, "images", imageId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapImageDoc(snapshot.id, snapshot.data());
}

/**
 * Atualiza o título de uma imagem (somente o dono).
 *
 * @param {string} imageId
 * @param {string} userId
 * @param {string} title
 * @returns {Promise<void>}
 */
export async function updateImageTitle(imageId, userId, title) {
  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const data = snapshot.data();
  if (data.userId !== userId) {
    throw new Error("Sem permissão para editar esta imagem.");
  }

  await updateDoc(imageRef, {
    title: title.trim(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Atualiza a visibilidade de uma imagem (somente o dono).
 *
 * @param {string} imageId
 * @param {string} userId
 * @param {'private' | 'shared' | 'public'} visibility
 * @returns {Promise<void>}
 */
export async function updateImageVisibility(imageId, userId, visibility) {
  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const data = snapshot.data();
  if (data.userId !== userId) {
    throw new Error("Sem permissão para editar esta imagem.");
  }

  if (visibility === "public") {
    await assertPublicVisibilityEnabled(userId);
  }

  await updateDoc(imageRef, {
    visibility,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Exclui imagem do Storage e Firestore. Se era capa, promove a mais antiga restante.
 *
 * @param {string} userId
 * @param {string | null} projectId
 * @param {string} imageId
 * @param {string} [projectCoverImage]
 * @returns {Promise<{ coverImage: string | null }>}
 */
export async function deleteImage(
  userId,
  projectId,
  imageId,
  projectCoverImage = "",
) {
  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const image = mapImageDoc(imageId, snapshot.data());

  if (image.userId !== userId) {
    throw new Error("Sem permissão para excluir esta imagem.");
  }

  console.log("[deleteImage] storagePath:", image.storagePath || "(ausente)");

  const storageResult = await deleteImageFile(image.storagePath);

  if (storageResult.success) {
    console.log("[deleteImage] Storage excluído com sucesso (ou arquivo inexistente).");
  } else {
    console.error("[deleteImage] Falha na exclusão do Storage — abortando exclusão do Firestore.");
    throw storageResult.error ?? new Error("Não foi possível excluir o arquivo da imagem.");
  }

  try {
    await deleteDoc(imageRef);
    console.log("[deleteImage] Firestore excluído com sucesso:", imageId);
  } catch (error) {
    console.error("[deleteImage] Falha ao excluir documento do Firestore:", imageId, error);
    throw error;
  }

  const imageUrl = image.previewUrl || image.originalUrl;
  const wasCover = Boolean(
    projectId && projectCoverImage && projectCoverImage === imageUrl,
  );

  if (!wasCover || !projectId) {
    return { coverImage: null };
  }

  const remaining = await getImagesByProjectId(projectId, userId);
  const newCover =
    remaining.length > 0
      ? remaining[0].previewUrl || remaining[0].originalUrl
      : "";

  await updateProject(projectId, { coverImage: newCover });

  return { coverImage: newCover };
}

/**
 * Faz upload de uma imagem: converte para WEBP, envia ao Storage e cria doc Firestore.
 * Se for a primeira imagem do projeto, atualiza project.coverImage.
 *
 * @param {string} userId
 * @param {string | null} projectId
 * @param {File} file
 * @param {string} title
 * @param {UploadImageOptions} [options]
 * @returns {Promise<Image>}
 */
export async function uploadImage(userId, projectId, file, title, options = {}) {
  const { width = 0, height = 0, originalFileType = "", onProgress } = options;
  const normalizedProjectId = normalizeProjectId(projectId);

  onProgress?.("Preparando imagem...");

  onProgress?.("Convertendo imagem...");
  const webpBlob = await convertToWebp(file);

  await assertCanUploadImage(userId, webpBlob.size);

  const imageRef = doc(collection(db, "images"));
  const imageId = imageRef.id;
  const storagePath = getImageStoragePath(userId, normalizedProjectId, imageId);
  const storageRef = ref(storage, storagePath);

  onProgress?.("Enviando para o servidor...");
  await uploadBytes(storageRef, webpBlob, { contentType: "image/webp" });
  const downloadUrl = await getDownloadURL(storageRef);

  onProgress?.("Salvando informações...");

  const existingImages = normalizedProjectId
    ? await getImagesByProjectId(normalizedProjectId, userId)
    : await getLooseImagesByUserId(userId);
  const isFirstImage = normalizedProjectId ? existingImages.length === 0 : false;

  const imageData = {
    userId,
    projectId: normalizedProjectId,
    title: title.trim(),
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
    storagePath,
    sizeBytes: webpBlob.size,
    width,
    height,
    originalFileType,
    optimizedFileType: "image/webp",
    visibility: "private",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(imageRef, imageData);

  if (isFirstImage && normalizedProjectId) {
    await updateProject(normalizedProjectId, { coverImage: downloadUrl });
  }

  return mapImageDoc(imageId, imageData);
}

/**
 * Substitui o arquivo de uma imagem existente, preservando metadados (title, visibility, etc.).
 * Converte para WEBP, envia ao Storage, remove arquivo antigo quando o path mudou,
 * atualiza Firestore e coverImage do projeto quando a imagem era a capa.
 *
 * @param {string} userId
 * @param {string | null} projectId
 * @param {string} imageId
 * @param {File} file
 * @param {string} [projectCoverImage]
 * @param {ReplaceImageFileOptions} [options]
 * @returns {Promise<{ image: Image, coverImage: string | null }>}
 */
export async function replaceImageFile(
  userId,
  projectId,
  imageId,
  file,
  projectCoverImage = "",
  options = {},
) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const {
    width = 0,
    height = 0,
    originalFileType = "",
    title: newTitle,
    onProgress,
  } = options;

  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const existingImage = mapImageDoc(imageId, snapshot.data());

  if (existingImage.userId !== userId) {
    throw new Error("Sem permissão para substituir esta imagem.");
  }

  if (existingImage.projectId !== normalizedProjectId) {
    throw new Error("Imagem não pertence a este contexto.");
  }

  onProgress?.("Preparando imagem...");

  onProgress?.("Convertendo imagem...");
  const webpBlob = await convertToWebp(file);

  await assertCanReplaceImageStorage(
    userId,
    webpBlob.size,
    existingImage.sizeBytes,
  );

  const storagePath = getImageStoragePath(
    userId,
    normalizedProjectId,
    imageId,
  );
  const oldStoragePath = existingImage.storagePath;
  const storageRef = ref(storage, storagePath);

  onProgress?.("Enviando para o servidor...");
  await uploadBytes(storageRef, webpBlob, { contentType: "image/webp" });
  const downloadUrl = await getDownloadURL(storageRef);

  if (oldStoragePath && oldStoragePath !== storagePath) {
    onProgress?.("Removendo arquivo antigo...");
    const deleteResult = await deleteImageFile(oldStoragePath);
    if (!deleteResult.success) {
      console.error(
        "[replaceImageFile] Falha ao remover arquivo antigo — edição mantida:",
        oldStoragePath,
        deleteResult.error,
      );
    }
  }

  onProgress?.("Salvando informações...");

  const firestoreUpdates = {
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
    storagePath,
    sizeBytes: webpBlob.size,
    width,
    height,
    originalFileType,
    optimizedFileType: "image/webp",
    updatedAt: serverTimestamp(),
  };

  if (typeof newTitle === "string" && newTitle.trim()) {
    firestoreUpdates.title = newTitle.trim();
  }

  await updateDoc(imageRef, firestoreUpdates);

  const updatedImage = mapImageDoc(imageId, {
    ...existingImage,
    ...firestoreUpdates,
  });

  const previousUrl =
    existingImage.previewUrl || existingImage.originalUrl;
  const wasCover = Boolean(
    normalizedProjectId &&
      projectCoverImage &&
      projectCoverImage === previousUrl,
  );

  if (!wasCover || !normalizedProjectId) {
    return { image: updatedImage, coverImage: null };
  }

  await updateProject(normalizedProjectId, { coverImage: downloadUrl });

  return { image: updatedImage, coverImage: downloadUrl };
}

/**
 * Move uma imagem solta para um projeto (somente Firestore — Storage inalterado).
 * Se o projeto não tiver capa, define coverImage com previewUrl da imagem.
 *
 * @param {string} userId
 * @param {string} imageId
 * @param {string} targetProjectId
 * @returns {Promise<{ image: Image, coverImage: string | null }>}
 */
export async function moveImageToProject(userId, imageId, targetProjectId) {
  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const image = mapImageDoc(imageId, snapshot.data());

  if (image.userId !== userId) {
    throw new Error("Sem permissão para mover esta imagem.");
  }

  if (image.projectId !== null) {
    throw new Error("Esta imagem já pertence a um projeto.");
  }

  const project = await getProjectById(targetProjectId);

  if (!project) {
    throw new Error("Projeto não encontrado.");
  }

  if (project.userId !== userId) {
    throw new Error("Sem permissão para mover para este projeto.");
  }

  if (image.projectId === targetProjectId) {
    throw new Error("A imagem já pertence a este projeto.");
  }

  await updateDoc(imageRef, {
    projectId: targetProjectId,
    updatedAt: serverTimestamp(),
  });

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: targetProjectId,
  });

  const previewUrl = image.previewUrl || image.originalUrl;
  const projectHasCover = Boolean(project.coverImage?.trim());

  if (projectHasCover) {
    return { image: updatedImage, coverImage: null };
  }

  await updateProject(targetProjectId, { coverImage: previewUrl });

  return { image: updatedImage, coverImage: previewUrl };
}

/**
 * Remove uma imagem de um projeto e envia para imagens soltas (somente Firestore).
 * Se era capa do projeto, promove a imagem mais antiga restante ou limpa a capa.
 *
 * @param {string} userId
 * @param {string} imageId
 * @param {string} [projectCoverImage]
 * @returns {Promise<{ image: Image, coverImage: string | null }>}
 */
export async function moveImageToUnassigned(
  userId,
  imageId,
  projectCoverImage = "",
) {
  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const image = mapImageDoc(imageId, snapshot.data());

  if (image.userId !== userId) {
    throw new Error("Sem permissão para mover esta imagem.");
  }

  const sourceProjectId = image.projectId;

  if (!sourceProjectId) {
    throw new Error("Esta imagem já está nas imagens soltas.");
  }

  await updateDoc(imageRef, {
    projectId: null,
    updatedAt: serverTimestamp(),
  });

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: null,
  });

  const imageUrl = image.previewUrl || image.originalUrl;
  const wasCover = Boolean(
    projectCoverImage && projectCoverImage === imageUrl,
  );

  if (!wasCover) {
    return { image: updatedImage, coverImage: null };
  }

  const remaining = await getImagesByProjectId(sourceProjectId, userId);
  const newCover =
    remaining.length > 0
      ? remaining[0].previewUrl || remaining[0].originalUrl
      : "";

  await updateProject(sourceProjectId, { coverImage: newCover });

  return { image: updatedImage, coverImage: newCover };
}

/**
 * Adapta uma imagem Firestore para o formato do ImageCard.
 *
 * @param {Image} image
 * @returns {{ id: string, name: string, url: string }}
 */
export function mapImageToCard(image) {
  return {
    id: image.id,
    name: image.title || "Sem título",
    url: image.previewUrl || image.originalUrl,
  };
}
