/**
 * Utilitários de workspace — fundação multiusuário (Sprint Multiuser Foundation 1).
 *
 * Workspace pessoal inicial: workspaceId === uid.
 */

/**
 * ID do workspace pessoal padrão para um usuário.
 *
 * @param {string} userId
 * @returns {string}
 */
export function getPersonalWorkspaceId(userId) {
  return userId;
}

/**
 * Resolve o workspace ativo a partir dos dados do usuário.
 * Fallback para workspace pessoal (uid) quando ainda não persistido.
 *
 * @param {import("firebase/firestore").DocumentData | null | undefined} userData
 * @param {string} userId
 * @returns {string}
 */
export function resolveWorkspaceId(userData, userId) {
  return userData?.activeWorkspaceId || userId;
}

/**
 * Nome padrão do workspace pessoal.
 *
 * @param {string} [displayName]
 * @returns {string}
 */
export function getPersonalWorkspaceName(displayName = "") {
  const trimmed = displayName?.trim();
  return trimmed || "Meu workspace";
}
