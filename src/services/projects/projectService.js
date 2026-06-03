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
import {
  assertCanCreateProject,
  assertPublicVisibilityEnabled,
} from "@/services/plans/planService";
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
 * @param {Project[]} projects
 * @returns {Project[]}
 */
function sortProjectsByRecency(projects) {
  return [...projects].sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
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

  return sortProjectsByRecency(
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
 * Remove um projeto.
 *
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

  return sortProjectsByRecency(
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
