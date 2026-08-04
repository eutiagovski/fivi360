/**
 * Serviço de imagens 360°.
 *
 * Responsabilidade:
 * - CRUD de imagens no Firestore (coleção `images`)
 * - Upload de arquivos no Firebase Storage
 * - Conversão WEBP antes do upload
 * - Atualização automática de coverImage na primeira imagem
 *
 * Storage path (novos uploads): users/{userId}/images/{imageId}.webp
 * Organização por projeto é controlada apenas pelo Firestore (`projectId`).
 *
 * @see docs/storage-architecture.md
 */

import {
  collection,
  deleteField,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/config/firebase";
import { convertToWebp } from "@/utils/imageConversion";
import {
  getProjectById,
  adjustProjectImageCount,
  updateProject,
} from "@/services/projects/projectService";
import {
  assertCanReplaceImageStorage,
  assertCanUploadImage,
} from "@/services/plans/planService";
import {
  collectImageStoragePaths,
  deleteImageFile,
  deleteImageFilesTolerant,
} from "@/services/storage/storageService";
import { getActiveWorkspaceIdForUser } from "@/services/workspaces/workspaceService";
import { sortImagesByRecency, toMillis } from "@/utils/imageRecencySort";
import {
  collectImageDeleteHotspotRefs,
  collectSceneHotspotDeletionRefs,
} from "@/services/hotspots/hotspotService";
import {
  buildPaginationCursor,
  isPaginationCursor,
  toAppDate,
} from "@/services/firebase/dates";
import {
  getQuotaSizeBytes,
  getStoredSizeBytes,
} from "@/utils/storageQuota";

/** Limite de operações por `writeBatch` do Firestore. */
const FIRESTORE_BATCH_LIMIT = 500;

/**
 * @typedef {Object} Image
 * @property {string} id
 * @property {string} userId
 * @property {string | null} projectId
 * @property {string} title
 * @property {string} originalUrl
 * @property {string} previewUrl
 * @property {string} storagePath
 * @property {number} sizeBytes — tamanho físico (legado; espelha storedSizeBytes)
 * @property {number | null} originalSizeBytes — File.size original (quota comercial)
 * @property {number} storedSizeBytes — tamanho físico no Storage
 * @property {number} width
 * @property {number} height
 * @property {string} originalFileType
 * @property {string} optimizedFileType
 * @property {'private' | 'shared' | 'public'} visibility
 * @property {'private' | 'shared' | 'public' | null} [projectVisibility]
 * @property {Date | null} [createdAt]
 * @property {Date | null} [updatedAt]
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
 * Path padrão para novos uploads. Ignora projectId — vínculo ao projeto fica no Firestore.
 *
 * @param {string} userId
 * @param {string} imageId
 * @returns {string}
 */
function getImageStoragePath(userId, imageId) {
  return `users/${userId}/images/${imageId}.webp`;
}

function mapImageDoc(imageId, data) {
  const storedSizeBytes = getStoredSizeBytes(data);
  const hasOriginal =
    typeof data.originalSizeBytes === "number" &&
    Number.isFinite(data.originalSizeBytes);

  return {
    id: imageId,
    userId: data.userId ?? "",
    projectId: normalizeProjectId(data.projectId),
    title: data.title ?? "",
    originalUrl: data.originalUrl ?? "",
    previewUrl: data.previewUrl ?? "",
    storagePath: data.storagePath ?? "",
    sizeBytes: storedSizeBytes,
    originalSizeBytes: hasOriginal ? data.originalSizeBytes : null,
    storedSizeBytes,
    width: data.width ?? 0,
    height: data.height ?? 0,
    originalFileType: data.originalFileType ?? "",
    optimizedFileType: data.optimizedFileType ?? "image/webp",
    visibility: data.visibility ?? "private",
    projectVisibility: normalizeProjectId(data.projectId)
      ? (data.projectVisibility ?? "private")
      : null,
    createdAt: toAppDate(data.createdAt),
    updatedAt: toAppDate(data.updatedAt),
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
 * @typedef {Object} LooseImagesPageResult
 * @property {Image[]} items
 * @property {import("@/services/firebase/dates").PaginationCursor | null} cursor
 * @property {boolean} hasMore
 */

/**
 * Lista imagens soltas paginadas por updatedAt DESC (fallback createdAt na ordenação local).
 * Requer índice composto: images — userId ASC, projectId ASC, updatedAt DESC.
 *
 * @param {string} userId
 * @param {{ limitCount: number, cursor?: import("@/services/firebase/dates").PaginationCursor | null }} options
 * @returns {Promise<LooseImagesPageResult>}
 */
export async function getLooseImagesPageByUserId(
  userId,
  { limitCount, cursor = null },
) {
  const constraints = [
    where("userId", "==", userId),
    where("projectId", "==", null),
    orderBy("updatedAt", "desc"),
  ];

  if (isPaginationCursor(cursor)) {
    const cursorSnap = await getDoc(doc(db, "images", cursor.id));
    if (cursorSnap.exists()) {
      constraints.push(startAfter(cursorSnap));
    } else if (cursor.sortValue != null) {
      constraints.push(startAfter(Timestamp.fromMillis(cursor.sortValue)));
    }
  }

  constraints.push(limit(limitCount + 1));

  const imagesQuery = query(collection(db, "images"), ...constraints);

  try {
    const snapshot = await getDocs(imagesQuery);
    const docs = snapshot.docs;
    const hasMore = docs.length > limitCount;
    const pageDocs = hasMore ? docs.slice(0, limitCount) : docs;

    const items = sortImagesByRecency(
      pageDocs.map((docSnap) => mapImageDoc(docSnap.id, docSnap.data())),
    );

    const last = pageDocs.at(-1);

    return {
      items,
      cursor: last
        ? buildPaginationCursor(last.id, last.data().updatedAt)
        : null,
      hasMore,
    };
  } catch (error) {
    if (error?.code === "failed-precondition") {
      console.error(
        "[getLooseImagesPageByUserId] Índice Firestore necessário: collection(images) where userId ==, projectId == null, orderBy updatedAt desc",
        error,
      );
    }

    throw error;
  }
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
 * Executa exclusões/atualizações em um ou mais writeBatches (limite 500 ops).
 *
 * @param {Array<{
 *   type: 'delete' | 'update',
 *   ref: import("firebase/firestore").DocumentReference,
 *   data?: Record<string, unknown>,
 * }>} operations
 * @returns {Promise<void>}
 */
async function commitFirestoreOperationsInChunks(operations) {
  for (let offset = 0; offset < operations.length; offset += FIRESTORE_BATCH_LIMIT) {
    const chunk = operations.slice(offset, offset + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);

    for (const operation of chunk) {
      if (operation.type === "delete") {
        batch.delete(operation.ref);
      } else {
        batch.update(operation.ref, operation.data ?? {});
      }
    }

    await batch.commit();
  }
}

/**
 * Remove o documento de stats diretamente associado à imagem, se existir.
 * Falhas (incl. rules ainda sem delete) não restauram o cascade já commitado.
 *
 * @param {string} userId
 * @param {string} imageId
 * @returns {Promise<boolean>}
 */
async function deleteImageStatsDocTolerant(userId, imageId) {
  if (!userId || !imageId) {
    return false;
  }

  try {
    await deleteDoc(doc(db, "stats", userId, "images", imageId));
    return true;
  } catch (error) {
    console.warn(
      "[deleteImage] Falha ao remover stats da imagem — cleanup pendente:",
      imageId,
      error,
    );
    return false;
  }
}

/**
 * @typedef {Object} DeleteImageResult
 * @property {string | null} coverImage — nova capa quando a excluída era capa; `null` se não mudou
 * @property {number} deletedOwnHotspotCount
 * @property {number} deletedIncomingSceneHotspotCount
 * @property {number} deletedStoragePathCount
 * @property {number} sizeBytes — bytes de quota liberados (originalSizeBytes com fallback)
 * @property {number} originalSizeBytes
 * @property {number} storedSizeBytes
 * @property {boolean} deletedImageStats
 */

/**
 * Exclui imagem com cascade completo: hotspots próprios, scene de entrada,
 * documento Firestore, referências de projeto/capa/count, stats da imagem e Storage.
 *
 * Ordem: coletar refs → commit Firestore (hotspots + imagem + projeto) →
 * stats tolerante → Storage tolerante. Falhas de Storage/stats não restauram docs.
 *
 * @param {string} userId
 * @param {string | null} projectId — contexto da UI; o `projectId` da imagem prevalece
 * @param {string} imageId
 * @param {string} [projectCoverImage]
 * @returns {Promise<DeleteImageResult>}
 */
export async function deleteImage(
  userId,
  projectId,
  imageId,
  projectCoverImage = "",
) {
  if (!userId || !imageId) {
    throw new Error("Dados incompletos para excluir a imagem.");
  }

  const imageRef = doc(db, "images", imageId);
  const snapshot = await getDoc(imageRef);

  if (!snapshot.exists()) {
    throw new Error("Imagem não encontrada.");
  }

  const rawData = snapshot.data();
  const image = mapImageDoc(imageId, rawData);

  if (image.userId !== userId) {
    throw new Error("Sem permissão para excluir esta imagem.");
  }

  const effectiveProjectId = image.projectId ?? normalizeProjectId(projectId);
  const storagePaths = collectImageStoragePaths(rawData);
  const { ownRefs, incomingRefs, allRefs } = await collectImageDeleteHotspotRefs(
    userId,
    imageId,
    effectiveProjectId,
  );

  const imageUrl = image.previewUrl || image.originalUrl;
  /** @type {string | null} */
  let coverImageResult = null;
  /** @type {Record<string, unknown> | null} */
  let projectUpdate = null;

  if (effectiveProjectId) {
    const project = await getProjectById(effectiveProjectId);

    if (project) {
      const coverToCheck =
        (projectCoverImage && String(projectCoverImage).trim()) ||
        project.coverImage ||
        "";
      const wasCover = Boolean(coverToCheck && coverToCheck === imageUrl);
      const nextImageCount = Math.max(0, (project.imageCount ?? 0) - 1);

      projectUpdate = {
        imageCount: nextImageCount,
        updatedAt: serverTimestamp(),
      };

      if (wasCover) {
        const remaining = (
          await getImagesByProjectId(effectiveProjectId, userId)
        ).filter((item) => item.id !== imageId);
        const oldestRemaining = pickOldestImageForCover(remaining);
        const newCover = oldestRemaining
          ? oldestRemaining.previewUrl || oldestRemaining.originalUrl
          : "";

        projectUpdate.coverImage = newCover;
        coverImageResult = newCover;
      }
    }
  }

  /** @type {Array<{ type: 'delete' | 'update', ref: import("firebase/firestore").DocumentReference, data?: Record<string, unknown> }>} */
  const operations = [
    ...allRefs.map((hotspotRef) => ({ type: /** @type {'delete'} */ ("delete"), ref: hotspotRef })),
    { type: /** @type {'delete'} */ ("delete"), ref: imageRef },
  ];

  if (effectiveProjectId && projectUpdate) {
    operations.push({
      type: "update",
      ref: doc(db, "projects", effectiveProjectId),
      data: projectUpdate,
    });
  }

  try {
    await commitFirestoreOperationsInChunks(operations);
    console.log(
      "[deleteImage] Firestore cascade concluído:",
      imageId,
      {
        ownHotspots: ownRefs.length,
        incomingSceneHotspots: incomingRefs.length,
        projectId: effectiveProjectId,
      },
    );
  } catch (error) {
    console.error("[deleteImage] Falha no cascade Firestore:", imageId, error);
    throw error;
  }

  const deletedImageStats = await deleteImageStatsDocTolerant(userId, imageId);

  await deleteImageFilesTolerant(storagePaths);

  const quotaBytes = getQuotaSizeBytes(image);
  const storedBytes = getStoredSizeBytes(image);

  return {
    coverImage: coverImageResult,
    deletedOwnHotspotCount: ownRefs.length,
    deletedIncomingSceneHotspotCount: incomingRefs.length,
    deletedStoragePathCount: storagePaths.length,
    sizeBytes: quotaBytes,
    originalSizeBytes: quotaBytes,
    storedSizeBytes: storedBytes,
    deletedImageStats,
  };
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
  const originalSizeBytes = file?.size ?? 0;

  onProgress?.("Preparando imagem...");

  await assertCanUploadImage(userId, originalSizeBytes);

  onProgress?.("Convertendo imagem...");
  const webpBlob = await convertToWebp(file);
  const storedSizeBytes = webpBlob.size;

  const imageRef = doc(collection(db, "images"));
  const imageId = imageRef.id;
  const storagePath = getImageStoragePath(userId, imageId);
  const storageRef = ref(storage, storagePath);

  onProgress?.("Enviando para o servidor...");
  await uploadBytes(storageRef, webpBlob, { contentType: "image/webp" });
  const downloadUrl = await getDownloadURL(storageRef);

  onProgress?.("Salvando informações...");

  const workspaceId = await getActiveWorkspaceIdForUser(userId);

  const existingImages = normalizedProjectId
    ? await getImagesByProjectId(normalizedProjectId, userId)
    : await getLooseImagesByUserId(userId);
  const isFirstImage = normalizedProjectId ? existingImages.length === 0 : false;

  const projectVisibility = normalizedProjectId
    ? (await getProjectById(normalizedProjectId))?.visibility ?? "private"
    : null;

  const imageData = {
    userId,
    workspaceId,
    projectId: normalizedProjectId,
    title: title.trim(),
    originalUrl: downloadUrl,
    previewUrl: downloadUrl,
    storagePath,
    originalSizeBytes,
    storedSizeBytes,
    // Legado: sizeBytes permanece como tamanho físico armazenado.
    sizeBytes: storedSizeBytes,
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
      await adjustProjectImageCount(normalizedProjectId, 1, {
        coverImage: downloadUrl,
      });
    } else {
      await adjustProjectImageCount(normalizedProjectId, 1);
    }
  }

  const now = new Date();
  return mapImageDoc(imageId, {
    ...imageData,
    createdAt: now,
    updatedAt: now,
  });
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

  const originalSizeBytes = file?.size ?? 0;
  const previousQuotaBytes = getQuotaSizeBytes(existingImage);

  await assertCanReplaceImageStorage(
    userId,
    originalSizeBytes,
    previousQuotaBytes,
  );

  onProgress?.("Convertendo imagem...");
  const webpBlob = await convertToWebp(file);
  const storedSizeBytes = webpBlob.size;

  const storagePath = getImageStoragePath(userId, imageId);
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
    originalSizeBytes,
    storedSizeBytes,
    sizeBytes: storedSizeBytes,
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
    updatedAt: new Date(),
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
 * Move uma imagem solta para um projeto (somente Firestore).
 * Se o projeto não tiver capa, define coverImage com a URL da imagem.
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

  await updateDoc(imageRef, {
    projectId: targetProjectId,
    projectVisibility: project.visibility,
    updatedAt: serverTimestamp(),
  });

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: targetProjectId,
    projectVisibility: project.visibility,
    updatedAt: new Date(),
  });

  const projectHasCover = Boolean(project.coverImage?.trim());

  if (!projectHasCover) {
    await adjustProjectImageCount(targetProjectId, 1, { coverImage: sourceUrl });
    return { image: updatedImage, coverImage: sourceUrl };
  }

  await adjustProjectImageCount(targetProjectId, 1);
  return { image: updatedImage, coverImage: null };
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

  const sourceUrl = image.originalUrl || image.previewUrl;

  if (!sourceUrl) {
    throw new Error("URL da imagem ausente.");
  }

  const imageUrl = sourceUrl;

  const sceneHotspotRefs = await collectSceneHotspotDeletionRefs(
    userId,
    imageId,
    sourceProjectId,
  );

  const batch = writeBatch(db);

  for (const hotspotRef of sceneHotspotRefs) {
    batch.delete(hotspotRef);
  }

  batch.update(imageRef, {
    projectId: null,
    projectVisibility: deleteField(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  const updatedImage = mapImageDoc(imageId, {
    ...image,
    projectId: null,
    projectVisibility: null,
    updatedAt: new Date(),
  });

  const wasCover = Boolean(
    projectCoverImage && projectCoverImage === imageUrl,
  );

  if (!wasCover) {
    await adjustProjectImageCount(sourceProjectId, -1);
    return { image: updatedImage, coverImage: null };
  }

  const remaining = await getImagesByProjectId(sourceProjectId, userId);
  const oldestRemaining = pickOldestImageForCover(remaining);
  const newCover = oldestRemaining
    ? oldestRemaining.previewUrl || oldestRemaining.originalUrl
    : "";

  await adjustProjectImageCount(sourceProjectId, -1, { coverImage: newCover });

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
