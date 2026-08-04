/**
 * Serviço de planos: uso, limites e validações antes de mutações.
 */

import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizeBilling } from "@/config/billing";
import { db } from "@/config/firebase";
import {
  formatStorageBytes,
  getPlanLimits,
  isUnlimited,
  normalizePlanId,
  usagePercentage,
} from "@/config/planLimits";
import { getProjectsByUserId } from "@/services/projects/projectService";
import { getUser } from "@/services/users/userService";
import { getQuotaSizeBytes } from "@/utils/storageQuota";

export const PLAN_LIMIT_CODES = {
  PROJECT_LIMIT: "PROJECT_LIMIT",
  IMAGE_LIMIT: "IMAGE_LIMIT",
  STORAGE_LIMIT: "STORAGE_LIMIT",
  HOTSPOTS_DISABLED: "HOTSPOTS_DISABLED",
  PORTFOLIO_DISABLED: "PORTFOLIO_DISABLED",
  PUBLIC_VISIBILITY_DISABLED: "PUBLIC_VISIBILITY_DISABLED",
  PROJECT_EMBED_DISABLED: "PROJECT_EMBED_DISABLED",
};

const FRIENDLY_MESSAGES = {
  [PLAN_LIMIT_CODES.PROJECT_LIMIT]:
    "Você atingiu o limite de projetos do seu plano. Faça upgrade para criar mais projetos.",
  [PLAN_LIMIT_CODES.IMAGE_LIMIT]:
    "Você atingiu o limite de imagens do seu plano. Faça upgrade para enviar mais imagens.",
  [PLAN_LIMIT_CODES.STORAGE_LIMIT]:
    "Este upload ultrapassa o limite de armazenamento disponível no seu plano. Libere espaço excluindo imagens ou faça upgrade para continuar.",
  [PLAN_LIMIT_CODES.HOTSPOTS_DISABLED]:
    "Hotspots estão disponíveis a partir do plano Professional. Faça upgrade para usar marcadores no panorama.",
  [PLAN_LIMIT_CODES.PORTFOLIO_DISABLED]:
    "O portfólio público está disponível nos planos Professional e Studio. Faça upgrade para ativar.",
  [PLAN_LIMIT_CODES.PUBLIC_VISIBILITY_DISABLED]:
    "Visibilidade pública (portfólio) está disponível nos planos Professional e Studio. Faça upgrade para publicar.",
  [PLAN_LIMIT_CODES.PROJECT_EMBED_DISABLED]:
    "A incorporação em websites está disponível a partir do plano Professional.",
};

export class PlanLimitError extends Error {
  /**
   * @param {string} code — PLAN_LIMIT_CODES
   * @param {string} [message]
   */
  constructor(code, message) {
    super(message ?? FRIENDLY_MESSAGES[code] ?? "Limite do plano atingido.");
    this.name = "PlanLimitError";
    this.code = code;
  }
}

/**
 * @param {unknown} error
 * @returns {error is PlanLimitError}
 */
export function isPlanLimitError(error) {
  return error instanceof PlanLimitError;
}

/**
 * @typedef {Object} UserUsage
 * @property {number} projectCount
 * @property {number} imageCount
 * @property {number} storageBytes
 */

/**
 * Lista todas as imagens do usuário (para contagem e armazenamento comercial).
 *
 * `quotaBytes` usa originalSizeBytes (com fallback legado). Ver storageQuota.js.
 *
 * @param {string} userId
 * @returns {Promise<{ quotaBytes: number }[]>}
 */
async function fetchUserImageSizes(userId) {
  const imagesQuery = query(
    collection(db, "images"),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(imagesQuery);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return { quotaBytes: getQuotaSizeBytes(data) };
  });
}

/**
 * Uso comercial do plano. `storageBytes` = soma de tamanhos originais (quota).
 *
 * @param {string} userId
 * @returns {Promise<UserUsage>}
 */
export async function getUserUsage(userId) {
  const [projects, imageSizes] = await Promise.all([
    getProjectsByUserId(userId),
    fetchUserImageSizes(userId),
  ]);

  const storageBytes = imageSizes.reduce(
    (sum, img) => sum + (img.quotaBytes || 0),
    0,
  );

  return {
    projectCount: projects.length,
    imageCount: imageSizes.length,
    storageBytes,
  };
}

/**
 * @param {string} userId
 * @returns {Promise<{
 *   planId: import("@/config/planLimits").PlanId,
 *   limits: import("@/config/planLimits").PlanLimits,
 *   usage: UserUsage,
 *   billing: import("@/config/billing").UserBilling,
 * }>}
 */
export async function getUserPlanContext(userId) {
  const profile = await getUser(userId);
  const planId = normalizePlanId(profile?.planId ?? profile?.plan);
  const limits = getPlanLimits(planId);
  const usage = await getUserUsage(userId);

  return {
    planId,
    limits,
    usage,
    billing: profile?.billing ?? normalizeBilling(null),
  };
}

/**
 * @param {string} userId
 * @returns {Promise<import("@/config/planLimits").PlanLimits>}
 */
async function getLimitsForUser(userId) {
  const profile = await getUser(userId);
  const planId = normalizePlanId(profile?.planId ?? profile?.plan);
  return getPlanLimits(planId);
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function assertCanCreateProject(userId) {
  const limits = await getLimitsForUser(userId);

  if (isUnlimited(limits.maxProjects)) {
    return;
  }

  const usage = await getUserUsage(userId);

  if (usage.projectCount >= limits.maxProjects) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.PROJECT_LIMIT);
  }
}

/**
 * Valida quota comercial antes do upload.
 * `additionalBytes` deve ser o tamanho original (`File.size`), não o comprimido.
 *
 * @param {string} userId
 * @param {number} additionalBytes — originalSizeBytes do arquivo selecionado
 * @returns {Promise<void>}
 */
export async function assertCanUploadImage(userId, additionalBytes = 0) {
  const limits = await getLimitsForUser(userId);
  const usage = await getUserUsage(userId);

  if (
    !isUnlimited(limits.maxTotalImages) &&
    usage.imageCount >= limits.maxTotalImages
  ) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.IMAGE_LIMIT);
  }

  const projectedStorage = usage.storageBytes + additionalBytes;

  if (projectedStorage > limits.maxStorageBytes) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.STORAGE_LIMIT);
  }
}

/**
 * Valida quota comercial na substituição de arquivo.
 * `newSizeBytes` / `previousSizeBytes` devem ser tamanhos originais (quota).
 *
 * @param {string} userId
 * @param {number} newSizeBytes — originalSizeBytes do novo arquivo
 * @param {number} previousSizeBytes — quota da imagem existente
 * @returns {Promise<void>}
 */
export async function assertCanReplaceImageStorage(
  userId,
  newSizeBytes,
  previousSizeBytes,
) {
  const limits = await getLimitsForUser(userId);
  const usage = await getUserUsage(userId);
  const delta = newSizeBytes - previousSizeBytes;
  const projectedStorage = usage.storageBytes + delta;

  if (projectedStorage > limits.maxStorageBytes) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.STORAGE_LIMIT);
  }
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function assertHotspotsEnabled(userId) {
  const limits = await getLimitsForUser(userId);

  if (!limits.hotspotsEnabled) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.HOTSPOTS_DISABLED);
  }
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function assertPublicPortfolioEnabled(userId) {
  const limits = await getLimitsForUser(userId);

  if (!limits.publicPortfolioEnabled) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.PORTFOLIO_DISABLED);
  }
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function assertPublicVisibilityEnabled(userId) {
  const limits = await getLimitsForUser(userId);

  if (!limits.publicVisibilityEnabled) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.PUBLIC_VISIBILITY_DISABLED);
  }
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function assertProjectEmbedEnabled(userId) {
  const limits = await getLimitsForUser(userId);

  if (!limits.projectEmbedEnabled) {
    throw new PlanLimitError(PLAN_LIMIT_CODES.PROJECT_EMBED_DISABLED);
  }
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @returns {{
 *   projects: { current: number, limit: number | null, percentage: number, limitLabel: string },
 *   images: { current: number, limit: number | null, percentage: number, limitLabel: string },
 *   storage: { current: number, limit: number, percentage: number, currentLabel: string, limitLabel: string },
 * }}
 */
export function buildUsageStats(limits, usage) {
  const projectsUnlimited = isUnlimited(limits.maxProjects);
  const imagesUnlimited = isUnlimited(limits.maxTotalImages);

  const projectLimitLabel = projectsUnlimited
    ? "Ilimitado"
    : `/ ${limits.maxProjects}`;

  const imageLimitLabel = imagesUnlimited
    ? "Ilimitado"
    : `/ ${limits.maxTotalImages}`;

  return {
    projects: {
      current: usage.projectCount,
      limit: limits.maxProjects,
      unlimited: projectsUnlimited,
      percentage: usagePercentage(usage.projectCount, limits.maxProjects),
      limitLabel: projectLimitLabel,
    },
    images: {
      current: usage.imageCount,
      limit: limits.maxTotalImages,
      unlimited: imagesUnlimited,
      percentage: usagePercentage(usage.imageCount, limits.maxTotalImages),
      limitLabel: imageLimitLabel,
    },
    storage: {
      current: usage.storageBytes,
      limit: limits.maxStorageBytes,
      unlimited: false,
      percentage: usagePercentage(usage.storageBytes, limits.maxStorageBytes),
      currentLabel: formatStorageBytes(usage.storageBytes),
      limitLabel: formatStorageBytes(limits.maxStorageBytes),
    },
  };
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @returns {boolean}
 */
export function canCreateProject(limits, usage) {
  if (isUnlimited(limits.maxProjects)) {
    return true;
  }

  return usage.projectCount < limits.maxProjects;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @returns {boolean}
 */
export function canUploadImage(limits, usage) {
  if (
    !isUnlimited(limits.maxTotalImages) &&
    usage.imageCount >= limits.maxTotalImages
  ) {
    return false;
  }

  return usage.storageBytes < limits.maxStorageBytes;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @param {number} [additionalBytes=0]
 * @returns {string | null} PLAN_LIMIT_CODES ou null se permitido
 */
export function getImageUploadBlockCode(limits, usage, additionalBytes = 0) {
  if (
    !isUnlimited(limits.maxTotalImages) &&
    usage.imageCount >= limits.maxTotalImages
  ) {
    return PLAN_LIMIT_CODES.IMAGE_LIMIT;
  }

  if (usage.storageBytes + additionalBytes > limits.maxStorageBytes) {
    return PLAN_LIMIT_CODES.STORAGE_LIMIT;
  }

  return null;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @param {number} [additionalBytes=0]
 * @returns {boolean}
 */
export function canUploadImageWithSize(limits, usage, additionalBytes = 0) {
  return getImageUploadBlockCode(limits, usage, additionalBytes) === null;
}

/**
 * @param {string} code
 * @returns {string}
 */
export function getPlanLimitMessage(code) {
  return FRIENDLY_MESSAGES[code] ?? "Limite do plano atingido.";
}

export { formatStorageBytes, usagePercentage };
