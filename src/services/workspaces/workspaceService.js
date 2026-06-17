/**
 * Serviço de workspaces — fundação multiusuário (Sprint Multiuser Foundation 1).
 *
 * Coleções:
 * - workspaces/{workspaceId}
 * - workspaces/{workspaceId}/members/{uid}
 *
 * Nesta sprint apenas workspace pessoal (workspaceId === uid).
 */

import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  getPersonalWorkspaceId,
  getPersonalWorkspaceName,
  resolveWorkspaceId,
} from "@/utils/workspace";

export { getPersonalWorkspaceId, resolveWorkspaceId };

/**
 * Payload do documento workspaces/{workspaceId} para workspace pessoal.
 *
 * @param {string} userId
 * @param {string} displayName
 * @returns {Record<string, unknown>}
 */
export function buildPersonalWorkspacePayload(userId, displayName) {
  return {
    ownerId: userId,
    name: getPersonalWorkspaceName(displayName),
    type: "personal",
    planId: "starter",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Payload do documento workspaces/{workspaceId}/members/{uid}.
 *
 * @param {string} userId
 * @returns {Record<string, unknown>}
 */
export function buildPersonalWorkspaceMemberPayload(userId) {
  return {
    userId,
    role: "owner",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Carrega o workspaceId ativo do usuário (activeWorkspaceId || uid).
 *
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function getActiveWorkspaceIdForUser(userId) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return getPersonalWorkspaceId(userId);
  }

  return resolveWorkspaceId(snapshot.data(), userId);
}

/**
 * Referências Firestore do workspace pessoal e do membro owner.
 *
 * @param {string} userId
 */
export function getPersonalWorkspaceRefs(userId) {
  const workspaceId = getPersonalWorkspaceId(userId);

  return {
    workspaceId,
    workspaceRef: doc(db, "workspaces", workspaceId),
    memberRef: doc(db, "workspaces", workspaceId, "members", userId),
  };
}
