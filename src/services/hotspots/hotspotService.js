/**
 * Serviço de hotspots no viewer 360° (informativos e navegação entre cenas).
 *
 * Firestore: images/{imageId}/hotspots/{hotspotId}
 *
 * @see docs/architecture.md — Hotspot
 */

import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { getImageById } from "@/services/images/imageService";
import { assertHotspotsEnabled } from "@/services/plans/planService";

export const HOTSPOT_TYPE_INFO = "info";
export const HOTSPOT_TYPE_SCENE = "scene";

export const SCENE_HOTSPOT_REQUIRES_PROJECT_MSG =
  "Hotspots de navegação só estão disponíveis para imagens em um projeto.";

/**
 * @typedef {Object} HotspotBase
 * @property {string} id
 * @property {string} imageId
 * @property {string} userId
 * @property {string} projectId
 * @property {number} pitch
 * @property {number} yaw
 * @property {import("firebase/firestore").Timestamp | null} [createdAt]
 * @property {import("firebase/firestore").Timestamp | null} [updatedAt]
 */

/**
 * @typedef {HotspotBase & { type: 'info', title: string, description: string }} InfoHotspot
 */

/**
 * @typedef {HotspotBase & { type: 'scene', targetImageId: string }} SceneHotspot
 */

/** @typedef {InfoHotspot | SceneHotspot} Hotspot */

/**
 * @param {string} hotspotId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {Hotspot}
 */
function mapHotspotDoc(hotspotId, data) {
  const base = {
    id: hotspotId,
    imageId: data.imageId ?? "",
    userId: data.userId ?? "",
    projectId: data.projectId ?? "",
    pitch: Number(data.pitch) || 0,
    yaw: Number(data.yaw) || 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };

  if (data.type === HOTSPOT_TYPE_SCENE) {
    return {
      ...base,
      type: HOTSPOT_TYPE_SCENE,
      targetImageId: data.targetImageId ?? "",
    };
  }

  return {
    ...base,
    type: HOTSPOT_TYPE_INFO,
    title: data.title ?? "",
    description: data.description ?? "",
  };
}

/**
 * @param {string} imageId
 * @param {string} userId
 * @returns {Promise<import("@/services/images/imageService").Image>}
 */
async function assertImageOwnership(imageId, userId) {
  const image = await getImageById(imageId);

  if (!image) {
    throw new Error("Imagem não encontrada.");
  }

  if (image.userId !== userId) {
    throw new Error("Sem permissão para gerenciar hotspots desta imagem.");
  }

  return image;
}

/**
 * @param {import("@/services/images/imageService").Image} image
 * @returns {void}
 */
function assertSceneHotspotsAllowed(image) {
  const projectId = image?.projectId;
  if (projectId === undefined || projectId === null || projectId === "") {
    throw new Error(SCENE_HOTSPOT_REQUIRES_PROJECT_MSG);
  }
}

/**
 * @param {string} sourceImageId
 * @param {string} targetImageId
 * @param {string} userId
 * @param {string} projectId
 * @returns {Promise<void>}
 */
async function assertValidSceneTarget(
  sourceImageId,
  targetImageId,
  userId,
  projectId,
) {
  if (!targetImageId) {
    throw new Error("Selecione a imagem de destino.");
  }

  if (targetImageId === sourceImageId) {
    throw new Error("A imagem de destino deve ser diferente da imagem atual.");
  }

  const targetImage = await getImageById(targetImageId);

  if (!targetImage) {
    throw new Error("Imagem de destino não encontrada.");
  }

  if (targetImage.userId !== userId) {
    throw new Error("Sem permissão para usar esta imagem como destino.");
  }

  const normalizedProjectId =
    projectId === undefined || projectId === null || projectId === ""
      ? null
      : projectId;
  const targetProjectId =
    targetImage.projectId === undefined ||
    targetImage.projectId === null ||
    targetImage.projectId === ""
      ? null
      : targetImage.projectId;

  if (targetProjectId !== normalizedProjectId) {
    throw new Error(
      normalizedProjectId
        ? "A imagem de destino deve pertencer ao mesmo projeto."
        : "A imagem de destino deve ser uma imagem solta.",
    );
  }
}

/**
 * @param {string} imageId
 * @returns {import("firebase/firestore").CollectionReference}
 */
function hotspotsCollection(imageId) {
  return collection(db, "images", imageId, "hotspots");
}

/**
 * Lista hotspots de uma imagem.
 *
 * @param {string} imageId
 * @returns {Promise<Hotspot[]>}
 */
export async function getHotspotsByImage(imageId) {
  const snapshot = await getDocs(hotspotsCollection(imageId));

  return snapshot.docs
    .map((docSnap) => mapHotspotDoc(docSnap.id, docSnap.data()))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return aTime - bTime;
    });
}

/**
 * @typedef {Object} CreateInfoHotspotData
 * @property {string} imageId
 * @property {string} userId
 * @property {string} projectId
 * @property {number} pitch
 * @property {number} yaw
 * @property {string} title
 * @property {string} [description]
 */

/**
 * Cria hotspot informativo (type `info`).
 *
 * @param {CreateInfoHotspotData} data
 * @returns {Promise<InfoHotspot>}
 */
export async function createHotspot(data) {
  const { imageId, userId, projectId, pitch, yaw, title, description } = data;

  if (!imageId || !userId) {
    throw new Error("Dados incompletos para criar hotspot.");
  }

  await assertImageOwnership(imageId, userId);
  await assertHotspotsEnabled(userId);

  const trimmedTitle = title?.trim() ?? "";
  if (!trimmedTitle) {
    throw new Error("Informe um título para o hotspot.");
  }

  const hotspotRef = doc(hotspotsCollection(imageId));
  const hotspotId = hotspotRef.id;

  const hotspotData = {
    imageId,
    userId,
    projectId: projectId ?? "",
    type: HOTSPOT_TYPE_INFO,
    pitch: Number(pitch) || 0,
    yaw: Number(yaw) || 0,
    title: trimmedTitle,
    description: description?.trim() ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(hotspotRef, hotspotData);

  return mapHotspotDoc(hotspotId, hotspotData);
}

/**
 * @typedef {Object} CreateSceneHotspotData
 * @property {string} imageId
 * @property {string} userId
 * @property {string} projectId
 * @property {number} pitch
 * @property {number} yaw
 * @property {string} targetImageId
 */

/**
 * Cria hotspot de navegação (type `scene`).
 *
 * @param {CreateSceneHotspotData} data
 * @returns {Promise<SceneHotspot>}
 */
export async function createSceneHotspot(data) {
  const { imageId, userId, projectId, pitch, yaw, targetImageId } = data;

  if (!imageId || !userId) {
    throw new Error("Dados incompletos para criar hotspot.");
  }

  const sourceImage = await assertImageOwnership(imageId, userId);
  await assertHotspotsEnabled(userId);
  assertSceneHotspotsAllowed(sourceImage);
  const resolvedProjectId = projectId ?? sourceImage.projectId ?? "";

  await assertValidSceneTarget(
    imageId,
    targetImageId,
    userId,
    resolvedProjectId,
  );

  const hotspotRef = doc(hotspotsCollection(imageId));
  const hotspotId = hotspotRef.id;

  const hotspotData = {
    imageId,
    userId,
    projectId: resolvedProjectId,
    type: HOTSPOT_TYPE_SCENE,
    pitch: Number(pitch) || 0,
    yaw: Number(yaw) || 0,
    targetImageId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(hotspotRef, hotspotData);

  return mapHotspotDoc(hotspotId, hotspotData);
}

/**
 * @typedef {Object} UpdateInfoHotspotData
 * @property {string} imageId
 * @property {string} userId
 * @property {string} [title]
 * @property {string} [description]
 */

/**
 * Atualiza título e/ou descrição de um hotspot informativo.
 *
 * @param {string} hotspotId
 * @param {UpdateInfoHotspotData} data
 * @returns {Promise<InfoHotspot>}
 */
export async function updateHotspot(hotspotId, data) {
  const { imageId, userId, title, description } = data;

  if (!imageId || !userId || !hotspotId) {
    throw new Error("Dados incompletos para atualizar hotspot.");
  }

  await assertImageOwnership(imageId, userId);

  const hotspotRef = doc(db, "images", imageId, "hotspots", hotspotId);
  const snapshot = await getDoc(hotspotRef);

  if (!snapshot.exists()) {
    throw new Error("Hotspot não encontrado.");
  }

  const existing = mapHotspotDoc(snapshot.id, snapshot.data());

  if (existing.userId !== userId) {
    throw new Error("Sem permissão para editar este hotspot.");
  }

  if (existing.type !== HOTSPOT_TYPE_INFO) {
    throw new Error("Este hotspot não é do tipo informativo.");
  }

  const updates = { updatedAt: serverTimestamp() };

  if (typeof title === "string") {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error("Informe um título para o hotspot.");
    }
    updates.title = trimmedTitle;
  }

  if (typeof description === "string") {
    updates.description = description.trim();
  }

  await updateDoc(hotspotRef, updates);

  const updatedSnapshot = await getDoc(hotspotRef);
  return mapHotspotDoc(hotspotId, updatedSnapshot.data());
}

/**
 * @typedef {Object} UpdateSceneHotspotData
 * @property {string} imageId
 * @property {string} userId
 * @property {string} projectId
 * @property {string} targetImageId
 */

/**
 * Atualiza a imagem de destino de um hotspot de navegação.
 *
 * @param {string} hotspotId
 * @param {UpdateSceneHotspotData} data
 * @returns {Promise<SceneHotspot>}
 */
export async function updateSceneHotspot(hotspotId, data) {
  const { imageId, userId, projectId, targetImageId } = data;

  if (!imageId || !userId || !hotspotId) {
    throw new Error("Dados incompletos para atualizar hotspot.");
  }

  const sourceImage = await assertImageOwnership(imageId, userId);
  assertSceneHotspotsAllowed(sourceImage);
  const resolvedProjectId = projectId ?? sourceImage.projectId ?? "";

  const hotspotRef = doc(db, "images", imageId, "hotspots", hotspotId);
  const snapshot = await getDoc(hotspotRef);

  if (!snapshot.exists()) {
    throw new Error("Hotspot não encontrado.");
  }

  const existing = mapHotspotDoc(snapshot.id, snapshot.data());

  if (existing.userId !== userId) {
    throw new Error("Sem permissão para editar este hotspot.");
  }

  if (existing.type !== HOTSPOT_TYPE_SCENE) {
    throw new Error("Este hotspot não é do tipo navegação.");
  }

  await assertValidSceneTarget(
    imageId,
    targetImageId,
    userId,
    resolvedProjectId,
  );

  await updateDoc(hotspotRef, {
    targetImageId,
    updatedAt: serverTimestamp(),
  });

  const updatedSnapshot = await getDoc(hotspotRef);
  return mapHotspotDoc(hotspotId, updatedSnapshot.data());
}

/**
 * Exclui um hotspot (info ou scene).
 *
 * @param {string} hotspotId
 * @param {string} imageId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function deleteHotspot(hotspotId, imageId, userId) {
  if (!hotspotId || !imageId || !userId) {
    throw new Error("Dados incompletos para excluir hotspot.");
  }

  await assertImageOwnership(imageId, userId);

  const hotspotRef = doc(db, "images", imageId, "hotspots", hotspotId);
  const snapshot = await getDoc(hotspotRef);

  if (!snapshot.exists()) {
    throw new Error("Hotspot não encontrado.");
  }

  const existing = mapHotspotDoc(snapshot.id, snapshot.data());

  if (existing.userId !== userId) {
    throw new Error("Sem permissão para excluir este hotspot.");
  }

  await deleteDoc(hotspotRef);
}
