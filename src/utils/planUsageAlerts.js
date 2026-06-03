import { isUnlimited } from "@/config/planLimits";
import {
  canCreateProject,
  canUploadImage,
} from "@/services/plans/planService";

const NEAR_LIMIT_THRESHOLD = 80;

/**
 * Classes visuais alinhadas à página de planos (amber próximo do limite, vermelho suave no limite).
 *
 * @param {number} percentage
 * @returns {{ valueClassName: string, barClassName: string }}
 */
export function getUsageVisualClasses(percentage) {
  if (percentage >= 100) {
    return { valueClassName: "text-red-400", barClassName: "bg-red-400" };
  }

  if (percentage >= NEAR_LIMIT_THRESHOLD) {
    return { valueClassName: "text-amber-400", barClassName: "bg-amber-400" };
  }

  return { valueClassName: "text-white", barClassName: "bg-white" };
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ projectCount: number, imageCount: number, storageBytes: number }} usage
 */
export function isAtProjectLimit(limits, usage) {
  if (isUnlimited(limits.maxProjects)) {
    return false;
  }

  return usage.projectCount >= limits.maxProjects;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ projectCount: number, imageCount: number, storageBytes: number }} usage
 */
export function isAtImageLimit(limits, usage) {
  if (isUnlimited(limits.maxTotalImages)) {
    return false;
  }

  return usage.imageCount >= limits.maxTotalImages;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ projectCount: number, imageCount: number, storageBytes: number }} usage
 */
export function isAtStorageLimit(limits, usage) {
  return usage.storageBytes >= limits.maxStorageBytes;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {ReturnType<import("@/services/plans/planService").buildUsageStats>} usageStats
 */
export function isNearAnyLimit(limits, usageStats) {
  const checks = [];

  if (!isUnlimited(limits.maxProjects)) {
    checks.push(usageStats.projects.percentage);
  }

  if (!isUnlimited(limits.maxTotalImages)) {
    checks.push(usageStats.images.percentage);
  }

  checks.push(usageStats.storage.percentage);

  return checks.some(
    (pct) => pct >= NEAR_LIMIT_THRESHOLD && pct < 100,
  );
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ projectCount: number, imageCount: number, storageBytes: number }} usage
 * @param {ReturnType<import("@/services/plans/planService").buildUsageStats>} usageStats
 */
export function analyzePlanUsage(limits, usage, usageStats) {
  const atProjectLimit = isAtProjectLimit(limits, usage);
  const atImageLimit = isAtImageLimit(limits, usage);
  const atStorageLimit = isAtStorageLimit(limits, usage);
  const atAnyLimit =
    atProjectLimit ||
    atImageLimit ||
    atStorageLimit ||
    !canCreateProject(limits, usage) ||
    !canUploadImage(limits, usage);

  return {
    atProjectLimit,
    atImageLimit,
    atStorageLimit,
    atAnyLimit,
    nearLimit: isNearAnyLimit(limits, usageStats),
    canCreateProject: canCreateProject(limits, usage),
    canUploadImage: canUploadImage(limits, usage),
  };
}
