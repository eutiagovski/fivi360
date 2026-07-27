import { getPersonalWorkspaceId } from "@/utils/workspace";

/**
 * @typedef {{
 *   needsUser: boolean,
 *   needsPublicProfile: boolean,
 *   needsWorkspace: boolean,
 *   needsMember: boolean,
 *   needsDefaultWorkspaceId: boolean,
 *   needsActiveWorkspaceId: boolean,
 *   needsServerWorkspaceIdRepair: boolean,
 * }} UserStructureGaps
 */

/**
 * Analisa lacunas na estrutura obrigatória do usuário (puro / testável).
 *
 * Não promove portfolioAvailable, não altera plan/billing/legalConsent/slug.
 *
 * @param {{
 *   userId: string,
 *   userExists: boolean,
 *   userData?: Record<string, unknown> | null,
 *   publicProfileExists: boolean,
 *   workspaceExists: boolean,
 *   memberExists: boolean,
 * }} input
 * @returns {UserStructureGaps}
 */
export function analyzeUserStructureGaps({
  userId,
  userExists,
  userData = null,
  publicProfileExists,
  workspaceExists,
  memberExists,
}) {
  const defaultWorkspaceId =
    typeof userData?.defaultWorkspaceId === "string"
      ? userData.defaultWorkspaceId.trim()
      : "";
  const activeWorkspaceId =
    typeof userData?.activeWorkspaceId === "string"
      ? userData.activeWorkspaceId.trim()
      : "";

  const needsDefaultWorkspaceId = userExists && !defaultWorkspaceId;
  const needsActiveWorkspaceId = userExists && !activeWorkspaceId;

  return {
    needsUser: !userExists,
    needsPublicProfile: !publicProfileExists,
    needsWorkspace: !workspaceExists,
    needsMember: !memberExists,
    needsDefaultWorkspaceId,
    needsActiveWorkspaceId,
    // default/activeWorkspaceId não estão na allowlist de update do cliente (RC-P0.5).
    needsServerWorkspaceIdRepair: needsDefaultWorkspaceId || needsActiveWorkspaceId,
  };
}

/**
 * Patch server-only para reparar IDs de workspace ausentes sem tocar em plan/billing.
 *
 * @param {Record<string, unknown> | null | undefined} userData
 * @param {string} userId
 * @returns {Record<string, string> | null} campos a atualizar, ou null se nada a fazer
 */
export function buildWorkspaceIdRepairPatch(userData, userId) {
  const personalWorkspaceId = getPersonalWorkspaceId(userId);
  const patch = {};

  const defaultWorkspaceId =
    typeof userData?.defaultWorkspaceId === "string"
      ? userData.defaultWorkspaceId.trim()
      : "";
  const activeWorkspaceId =
    typeof userData?.activeWorkspaceId === "string"
      ? userData.activeWorkspaceId.trim()
      : "";

  if (!defaultWorkspaceId) {
    patch.defaultWorkspaceId = personalWorkspaceId;
  }

  if (!activeWorkspaceId) {
    patch.activeWorkspaceId = defaultWorkspaceId || personalWorkspaceId;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Campos que o reparo nunca deve incluir (proteção de regressão nos testes).
 */
export const ENSURE_USER_STRUCTURE_FORBIDDEN_FIELDS = Object.freeze([
  "plan",
  "billing",
  "portfolioAvailable",
  "legalConsent",
  "slug",
  "companyName",
  "companyLogo",
  "bio",
  "socialLinks",
]);
