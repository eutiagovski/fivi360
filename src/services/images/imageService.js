/**
 * Serviço de imagens 360°.
 *
 * Responsabilidade:
 * - CRUD de imagens no Firestore (coleção `images`)
 * - Upload de arquivos no Firebase Storage
 * - Conversão WEBP antes do upload
 * - Atualização automática de coverImage na primeira imagem
 *
 * Storage path: users/{userId}/images/{imageId}.webp (soltas)
 * ou users/{userId}/projects/{projectId}/images/{imageId}.webp (projeto)
 *
 * @see docs/architecture.md
 */

import {
  collection,
  deleteField,
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
} from "@/services/plans/planService";
import {
  deleteImageFile,
  relocateImageFile,
} from "@/services/storage/storageService";
import { sortImagesByRecency, toMillis } from "@/utils/imageRecencySort";

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
 * @property {'private' | 'shared' | 'public' | null} [projectVisibility]
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
    projectVisibility: normalizeProjectId(data.projectId)
      ? (data.projectVisibility ?? "private")
      : null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Ordem cronológica de criação (mais antiga primeiro). Usado só para capa do projeto.
 *
 * @param {Image[]} images
 * @returns {Image[]}
 */
function sortImagesByCreatedAtAsc(images) {
  return [...images].sort((a, b) => {
    return toMillis(a.createdAt) - toMillis(b.createdAt);
  });
}

/**
 * @param {Image[]} images
 * @returns {Image | null}
 */
function pickOldestImageForCover(images) {
  const sorted = sortImagesByCreatedAtAsc(images);
  return sorted[0] ?? null;
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

  return sortImagesByRecency(images);
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

  return sortImagesByRecency(images);
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

  return sortImagesByRecency(images).slice(0, limit);
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
 * @param {'private' | 'shared'} visibility
 * @returns {Promise<void>}
 */
export async function updateImageVisibility(imageId, userId, visibility) {
  if (visibility !== "private" && visibility !== "shared") {
    throw new Error("Visibilidade inválida para imagens.");
  }

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

  if (projectId) {
    if (!wasCover) {
      await updateProject(projectId, {});
      return { coverImage: null };
    }
  } else {
    return { coverImage: null };
  }

  const remaining = await getImagesByProjectId(projectId, userId);
  const oldestRemaining = pickOldestImageForCover(remaining);
  const newCover = oldestRemaining
    ? oldestRemaining.previewUrl || oldestRemaining.originalUrl
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

  const projectVisibility = normalizedProjectId
    ? (await getProjectById(normalizedProjectId))?.visibility ?? "private"
    : null;

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
    ...(normalizedProjectId ? { projectVisibility } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(imageRef, imageData);

  if (normalizedProjectId) {
    if (isFirstImage) {
      await updateProject(normalizedProjectId, { coverImage: downloadUrl });
    } else {
      await updateProject(normalizedProjectId, {});
    }
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

  if (normalizedProjectId) {
    if (wasCover) {
      await updateProject(normalizedProjectId, { coverImage: downloadUrl });
      return { image: updatedImage, coverImage: downloadUrl };
    }

    await updateProject(normalizedProjectId, {});
  }

  return { image: updatedImage, coverImage: null };
}

/**
 * Move uma imagem solta para um projeto, realocando o arquivo no Storage.
 * Se o projeto não tiver capa, define coverImage com a nova URL da imagem.
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

  const sourceUrl = image.originalUrl || image.previewUrl;

  if (!sourceUrl) {
    throw new Error("URL da imagem ausente.");
  }

  const oldStoragePath = image.storagePath;
  const newStoragePath = getImageStoragePath(userId, targetProjectId, imageId);
  const { downloadUrl } =
    oldStoragePath === newStoragePath
      ? { downloadUrl: sourceUrl }
      : await relocateImageFile(sourceUrl, newStoragePath, oldStoragePath);

  await updateDoc(imageRef, {
    projectId: targetProjectId,
    projectVisibility: project.visibility,
    storagePath: newStoragePath,
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: targetProjectId,
    projectVisibility: project.visibility,
    storagePath: newStoragePath,
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
  });

  const projectHasCover = Boolean(project.coverImage?.trim());

  if (!projectHasCover) {
    await updateProject(targetProjectId, { coverImage: downloadUrl });
    return { image: updatedImage, coverImage: downloadUrl };
  }

  await updateProject(targetProjectId, {});
  return { image: updatedImage, coverImage: null };
}

/**
 * Remove uma imagem de um projeto e envia para imagens soltas, realocando o arquivo no Storage.
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

  const sourceUrl = image.originalUrl || image.previewUrl;

  if (!sourceUrl) {
    throw new Error("URL da imagem ausente.");
  }

  const imageUrl = sourceUrl;
  const oldStoragePath = image.storagePath;
  const newStoragePath = getImageStoragePath(userId, null, imageId);
  const { downloadUrl } =
    oldStoragePath === newStoragePath
      ? { downloadUrl: sourceUrl }
      : await relocateImageFile(sourceUrl, newStoragePath, oldStoragePath);

  await updateDoc(imageRef, {
    projectId: null,
    projectVisibility: deleteField(),
    storagePath: newStoragePath,
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: null,
    projectVisibility: null,
    storagePath: newStoragePath,
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
  });

  const wasCover = Boolean(
    projectCoverImage && projectCoverImage === imageUrl,
  );

  if (!wasCover) {
    await updateProject(sourceProjectId, {});
    return { image: updatedImage, coverImage: null };
  }

  const remaining = await getImagesByProjectId(sourceProjectId, userId);
  const oldestRemaining = pickOldestImageForCover(remaining);
  const newCover = oldestRemaining
    ? oldestRemaining.previewUrl || oldestRemaining.originalUrl
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
