/**
 * Serviço de planos: uso, limites e validações antes de mutações.
 */

import { collection, getDocs, query, where } from "firebase/firestore";
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

export const PLAN_LIMIT_CODES = {
  PROJECT_LIMIT: "PROJECT_LIMIT",
  IMAGE_LIMIT: "IMAGE_LIMIT",
  STORAGE_LIMIT: "STORAGE_LIMIT",
  HOTSPOTS_DISABLED: "HOTSPOTS_DISABLED",
  PORTFOLIO_DISABLED: "PORTFOLIO_DISABLED",
  PUBLIC_VISIBILITY_DISABLED: "PUBLIC_VISIBILITY_DISABLED",
};

const FRIENDLY_MESSAGES = {
  [PLAN_LIMIT_CODES.PROJECT_LIMIT]:
    "Você atingiu o limite de projetos do seu plano. Faça upgrade para criar mais projetos.",
  [PLAN_LIMIT_CODES.IMAGE_LIMIT]:
    "Você atingiu o limite de imagens do seu plano. Faça upgrade para enviar mais imagens.",
  [PLAN_LIMIT_CODES.STORAGE_LIMIT]:
    "Você atingiu o limite de armazenamento do seu plano. Faça upgrade ou remova imagens antigas.",
  [PLAN_LIMIT_CODES.HOTSPOTS_DISABLED]:
    "Hotspots estão disponíveis a partir do plano Professional. Faça upgrade para usar marcadores no panorama.",
  [PLAN_LIMIT_CODES.PORTFOLIO_DISABLED]:
    "O portfólio público está disponível a partir do plano Professional. Faça upgrade para ativar.",
  [PLAN_LIMIT_CODES.PUBLIC_VISIBILITY_DISABLED]:
    "Visibilidade pública (portfólio) está disponível a partir do plano Professional. Faça upgrade para publicar.",
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
 * Lista todas as imagens do usuário (para contagem e armazenamento).
 *
 * @param {string} userId
 * @returns {Promise<{ sizeBytes: number }[]>}
 */
async function fetchUserImageSizes(userId) {
  const imagesQuery = query(
    collection(db, "images"),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(imagesQuery);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return { sizeBytes: data.sizeBytes ?? 0 };
  });
}

/**
 * @param {string} userId
 * @returns {Promise<UserUsage>}
 */
export async function getUserUsage(userId) {
  const [projects, imageSizes] = await Promise.all([
    getProjectsByUserId(userId),
    fetchUserImageSizes(userId),
  ]);

  const storageBytes = imageSizes.reduce(
    (sum, img) => sum + (img.sizeBytes || 0),
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
 * @returns {Promise<{ planId: import("@/config/planLimits").PlanId, limits: import("@/config/planLimits").PlanLimits, usage: UserUsage }>}
 */
export async function getUserPlanContext(userId) {
  const profile = await getUser(userId);
  const planId = normalizePlanId(profile?.plan);
  const limits = getPlanLimits(planId);
  const usage = await getUserUsage(userId);

  return { planId, limits, usage };
}

/**
 * @param {string} userId
 * @returns {Promise<import("@/config/planLimits").PlanLimits>}
 */
async function getLimitsForUser(userId) {
  const profile = await getUser(userId);
  return getPlanLimits(profile?.plan);
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
 * @param {string} userId
 * @param {number} additionalBytes
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
 * @param {string} userId
 * @param {number} newSizeBytes
 * @param {number} previousSizeBytes
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
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {UserUsage} usage
 * @returns {{
 *   projects: { current: number, limit: number | null, percentage: number, limitLabel: string },
 *   images: { current: number, limit: number | null, percentage: number, limitLabel: string },
 *   storage: { current: number, limit: number, percentage: number, currentLabel: string, limitLabel: string },
 * }}
 */
export function buildUsageStats(limits, usage) {
  const projectLimitLabel = isUnlimited(limits.maxProjects)
    ? "ilimitado"
    : `/ ${limits.maxProjects}`;

  const imageLimitLabel = isUnlimited(limits.maxTotalImages)
    ? "ilimitado"
    : `/ ${limits.maxTotalImages}`;

  return {
    projects: {
      current: usage.projectCount,
      limit: limits.maxProjects,
      percentage: usagePercentage(usage.projectCount, limits.maxProjects),
      limitLabel: projectLimitLabel,
    },
    images: {
      current: usage.imageCount,
      limit: limits.maxTotalImages,
      percentage: usagePercentage(usage.imageCount, limits.maxTotalImages),
      limitLabel: imageLimitLabel,
    },
    storage: {
      current: usage.storageBytes,
      limit: limits.maxStorageBytes,
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
  if (!isUnlimited(limits.maxTotalImages) && usage.imageCount >= limits.maxTotalImages) {
    return false;
  }

  return usage.storageBytes < limits.maxStorageBytes;
}

export { formatStorageBytes, usagePercentage };
