/**
 * Autorização de acesso interno a projetos (rota privada /projects/:id).
 *
 * Visibilidade pública (shared/public) NÃO concede acesso à rota interna.
 * Acesso público permanece em /share, /embed e /u/:slug.
 *
 * Beta: apenas o proprietário (project.userId === userId).
 * Membership explícita fica reservada para colaboração futura.
 */

const AUTHORIZED_MEMBER_ROLES = new Set([
  "owner",
  "admin",
  "editor",
  "viewer",
]);

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
function isAuthorizedMemberRole(role) {
  return typeof role === "string" && AUTHORIZED_MEMBER_ROLES.has(role);
}

/**
 * Indica se o usuário autenticado pode abrir o projeto no contexto interno.
 *
 * @param {{
 *   userId: string | null | undefined,
 *   project: { userId?: string, workspaceId?: string } | null | undefined,
 *   membership?: {
 *     userId?: string,
 *     workspaceId?: string,
 *     role?: string,
 *   } | null,
 *   activeWorkspaceId?: string | null,
 * }} params
 * @returns {boolean}
 */
export function canUserAccessProjectInternally({
  userId,
  project,
  membership = null,
  activeWorkspaceId = null,
}) {
  if (!userId || !project?.userId) {
    return false;
  }

  if (project.userId === userId) {
    return true;
  }

  // Colaboração futura: membership explícita no workspace do projeto.
  // activeWorkspaceId sozinho NÃO concede acesso.
  if (
    membership &&
    membership.userId === userId &&
    project.workspaceId &&
    membership.workspaceId === project.workspaceId &&
    isAuthorizedMemberRole(membership.role)
  ) {
    if (
      activeWorkspaceId != null &&
      activeWorkspaceId !== "" &&
      activeWorkspaceId !== project.workspaceId
    ) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Log de desenvolvimento sem dados sensíveis do projeto.
 *
 * @param {string} projectId
 * @param {string} reason
 * @returns {void}
 */
export function logInternalProjectAccessDenied(projectId, reason) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[ProjectAccess] internal access denied", {
    projectId: projectId || null,
    reason,
  });
}
