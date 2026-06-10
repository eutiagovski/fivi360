/**
 * Serviço de projetos.
 *
 * Responsabilidade:
 * - CRUD de projetos no Firestore (coleção `projects`)
 * - Listagem por usuário (dashboard, página de projetos)
 * - Atualização de visibilidade (private | shared | public)
 * - Projetos públicos do portfólio (/u/:slug)
 *
 * Modelo de referência: Project em docs/architecture.md
 * (id, userId, title, description, clientName, visibility, coverImage, createdAt, updatedAt)
 *
 * @see docs/firebase-foundation.md
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { getImagesByProjectId } from "@/services/images/imageService";
import { deleteAllHotspotsForImage } from "@/services/hotspots/hotspotService";
import {
  assertCanCreateProject,
  assertPublicVisibilityEnabled,
} from "@/services/plans/planService";
import {
  collectImageStoragePaths,
  deleteImageFilesTolerant,
} from "@/services/storage/storageService";
import { sortByRecency } from "@/utils/recencySort";
import { visibilityToLabel } from "@/utils/visibility";

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} description
 * @property {string} clientName
 * @property {'private' | 'shared' | 'public'} visibility
 * @property {string} coverImage
 * @property {import("firebase/firestore").Timestamp | null} [createdAt]
 * @property {import("firebase/firestore").Timestamp | null} [updatedAt]
 */

/**
 * @param {string} projectId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {Project}
 */
function mapProjectDoc(projectId, data) {
  return {
    id: projectId,
    userId: data.userId ?? "",
    title: data.title ?? "",
    description: data.description ?? "",
    clientName: data.clientName ?? "",
    visibility: data.visibility ?? "private",
    coverImage: data.coverImage ?? "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Lista todos os projetos de um usuário (dashboard, /projects).
 *
 * @param {string} userId
 * @returns {Promise<Project[]>}
 */
export async function getProjectsByUserId(userId) {
  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(projectsQuery);

  return sortByRecency(
    snapshot.docs.map((docSnap) => mapProjectDoc(docSnap.id, docSnap.data())),
  );
}

/**
 * Carrega um projeto pelo ID.
 *
 * @param {string} projectId
 * @returns {Promise<Project | null>}
 */
export async function getProjectById(projectId) {
  const snapshot = await getDoc(doc(db, "projects", projectId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapProjectDoc(snapshot.id, snapshot.data());
}

/**
 * Cria um novo projeto.
 * coverImage inicia vazio; na Sprint 3.2 será preenchido pela primeira imagem.
 *
 * @param {string} userId
 * @param {{
 *   title: string,
 *   description?: string,
 *   clientName?: string,
 *   visibility?: Project['visibility'],
 *   coverImage?: string,
 * }} data
 * @returns {Promise<string>} ID do projeto criado
 */
export async function createProject(userId, data) {
  await assertCanCreateProject(userId);

  if (data.visibility === "public") {
    await assertPublicVisibilityEnabled(userId);
  }

  const docRef = await addDoc(collection(db, "projects"), {
    userId,
    title: data.title.trim(),
    description: data.description?.trim() ?? "",
    clientName: data.clientName?.trim() ?? "",
    visibility: data.visibility ?? "private",
    coverImage: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Atualiza campos de um projeto existente.
 *
 * @param {string} projectId
 * @param {Partial<Pick<Project, 'title' | 'description' | 'clientName' | 'visibility' | 'coverImage'>>} data
 */
export async function updateProject(projectId, data) {
  if (data.visibility === "public") {
    const project = await getProjectById(projectId);

    if (project?.userId) {
      await assertPublicVisibilityEnabled(project.userId);
    }
  }

  const updates = { updatedAt: serverTimestamp() };

  if (data.title !== undefined) {
    updates.title = data.title.trim();
  }
  if (data.description !== undefined) {
    updates.description = data.description.trim();
  }
  if (data.clientName !== undefined) {
    updates.clientName = data.clientName.trim();
  }
  if (data.visibility !== undefined) {
    updates.visibility = data.visibility;
  }
  if (data.coverImage !== undefined) {
    updates.coverImage = data.coverImage.trim();
  }

  await updateDoc(doc(db, "projects", projectId), updates);
}

/**
 * @typedef {Object} DeleteProjectCascadeResult
 * @property {number} deletedImageCount
 * @property {number} deletedStorageBytes
 * @property {number} deletedHotspotCount
 * @property {string[]} imageIds
 */

/**
 * Exclui projeto e todo o conteúdo vinculado: imagens, hotspots e arquivos no Storage.
 *
 * Ordem: imagens (hotspots → storage → doc) → documento do projeto.
 * Falhas no Storage não interrompem o fluxo; falhas no Firestore propagam erro.
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<DeleteProjectCascadeResult>}
 */
export async function deleteProjectCascade(projectId, userId) {
  if (!projectId || !userId) {
    throw new Error("Dados incompletos para excluir o projeto.");
  }

  const project = await getProjectById(projectId);

  if (!project) {
    throw new Error("Projeto não encontrado.");
  }

  if (project.userId !== userId) {
    throw new Error("Sem permissão para excluir este projeto.");
  }

  const images = await getImagesByProjectId(projectId, userId);

  let deletedImageCount = 0;
  let deletedStorageBytes = 0;
  let deletedHotspotCount = 0;

  for (const image of images) {
    deletedHotspotCount += await deleteAllHotspotsForImage(image.id);

    const storagePaths = collectImageStoragePaths(image);
    await deleteImageFilesTolerant(storagePaths);

    try {
      await deleteDoc(doc(db, "images", image.id));
      deletedImageCount += 1;
      deletedStorageBytes += image.sizeBytes ?? 0;
    } catch (error) {
      console.error(
        "[deleteProjectCascade] Falha ao excluir imagem do Firestore:",
        image.id,
        error,
      );
      throw new Error(
        "Não foi possível excluir as imagens do projeto. Tente novamente.",
      );
    }
  }

  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (error) {
    console.error(
      "[deleteProjectCascade] Falha ao excluir projeto do Firestore:",
      projectId,
      error,
    );
    throw new Error("Não foi possível excluir o projeto. Tente novamente.");
  }

  return {
    deletedImageCount,
    deletedStorageBytes,
    deletedHotspotCount,
    imageIds: images.map((image) => image.id),
  };
}

/**
 * @deprecated Use {@link deleteProjectCascade} com `userId` para exclusão completa.
 * @param {string} projectId
 */
export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "projects", projectId));
}

/**
 * Lista projetos públicos de um usuário (portfólio /u/:slug).
 *
 * @param {string} userId
 * @returns {Promise<Project[]>}
 */
export async function getPublicProjectsByUserId(userId) {
  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("visibility", "==", "public"),
  );
  const snapshot = await getDocs(projectsQuery);

  return sortByRecency(
    snapshot.docs.map((docSnap) => mapProjectDoc(docSnap.id, docSnap.data())),
  );
}

/**
 * Adapta um projeto Firestore para o formato do ProjectCard.
 *
 * @param {Project} project
 * @returns {{ id: string, name: string, cover: string, images: number, status: string }}
 */
export function mapProjectToCard(project) {
  return {
    id: project.id,
    name: project.title || "Sem título",
    cover: project.coverImage ?? "",
    images: 0,
    status: visibilityToLabel(project.visibility),
  };
}
