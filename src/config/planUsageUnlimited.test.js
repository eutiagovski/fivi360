/**
 * RC-PLAN-USAGE-BILLING-DISPLAY-1 — consumo ilimitado e percentual.
 */

import {
  formatStorageBytes,
  getPlanLimits,
  isUnlimited,
  isUnlimitedLimit,
  PLAN_IDS,
  usagePercentage,
} from "@/config/planLimits";

/**
 * Espelho de `getUsageVisualClasses` (planUsageAlerts) sem importar planService/Firebase.
 *
 * @param {number} percentage
 */
function getUsageVisualClasses(percentage) {
  if (percentage >= 100) {
    return { valueClassName: "text-red-400", barClassName: "bg-red-400" };
  }

  if (percentage >= 80) {
    return { valueClassName: "text-amber-400", barClassName: "bg-amber-400" };
  }

  return { valueClassName: "text-white", barClassName: "bg-white" };
}

/**
 * Espelho puro de `buildUsageStats` (planService) para testes sem Firebase.
 */
function buildUsageStats(limits, usage) {
  const projectsUnlimited = isUnlimited(limits.maxProjects);
  const imagesUnlimited = isUnlimited(limits.maxTotalImages);

  return {
    projects: {
      current: usage.projectCount,
      limit: limits.maxProjects,
      unlimited: projectsUnlimited,
      percentage: usagePercentage(usage.projectCount, limits.maxProjects),
      limitLabel: projectsUnlimited ? "Ilimitado" : `/ ${limits.maxProjects}`,
    },
    images: {
      current: usage.imageCount,
      limit: limits.maxTotalImages,
      unlimited: imagesUnlimited,
      percentage: usagePercentage(usage.imageCount, limits.maxTotalImages),
      limitLabel: imagesUnlimited ? "Ilimitado" : `/ ${limits.maxTotalImages}`,
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

describe("RC-PLAN-USAGE-BILLING-DISPLAY-1 — unlimited usage", () => {
  test("isUnlimitedLimit reconhece somente null/undefined", () => {
    expect(isUnlimitedLimit(null)).toBe(true);
    expect(isUnlimitedLimit(undefined)).toBe(true);
    expect(isUnlimitedLimit(-1)).toBe(false);
    expect(isUnlimitedLimit(Infinity)).toBe(false);
    expect(isUnlimitedLimit(10)).toBe(false);
    expect(isUnlimited(null)).toBe(true);
  });

  test("usagePercentage não calcula alerta para limite ilimitado", () => {
    expect(usagePercentage(0, null)).toBe(0);
    expect(usagePercentage(27, null)).toBe(0);
    expect(usagePercentage(1000, null)).toBe(0);
    expect(usagePercentage(8, 10)).toBe(80);
    expect(usagePercentage(10, 10)).toBe(100);
    expect(usagePercentage(12, 10)).toBe(100);
  });

  test("Professional/Studio — imagens ilimitadas, armazenamento finito", () => {
    const professional = getPlanLimits(PLAN_IDS.PROFESSIONAL);
    const studio = getPlanLimits(PLAN_IDS.STUDIO);

    expect(isUnlimitedLimit(professional.maxTotalImages)).toBe(true);
    expect(isUnlimitedLimit(studio.maxTotalImages)).toBe(true);
    expect(isUnlimitedLimit(professional.maxStorageBytes)).toBe(false);
    expect(isUnlimitedLimit(studio.maxStorageBytes)).toBe(false);
  });

  test("Starter mantém limite finito de imagens", () => {
    const starter = getPlanLimits(PLAN_IDS.STARTER);
    expect(isUnlimitedLimit(starter.maxTotalImages)).toBe(false);
    expect(starter.maxTotalImages).toBe(10);
  });

  test("ilimitado exibe Ilimitado, % 0 e cor neutra", () => {
    const limits = getPlanLimits(PLAN_IDS.PROFESSIONAL);
    const usage = { projectCount: 5, imageCount: 27, storageBytes: 10 * 1024 * 1024 };
    const stats = buildUsageStats(limits, usage);

    expect(stats.images.unlimited).toBe(true);
    expect(stats.images.limitLabel).toBe("Ilimitado");
    expect(stats.images.percentage).toBe(0);
    expect(stats.images.current).toBe(27);
    expect(getUsageVisualClasses(stats.images.percentage).valueClassName).toBe(
      "text-white",
    );
  });

  test("uso elevado de imagens ilimitadas não contamina armazenamento", () => {
    const limits = getPlanLimits(PLAN_IDS.PROFESSIONAL);
    const nearStorage = Math.round(limits.maxStorageBytes * 0.9);
    const usage = {
      projectCount: 3,
      imageCount: 500,
      storageBytes: nearStorage,
    };
    const stats = buildUsageStats(limits, usage);

    expect(stats.images.unlimited).toBe(true);
    expect(stats.images.percentage).toBe(0);
    expect(stats.storage.unlimited).toBe(false);
    expect(stats.storage.percentage).toBeGreaterThanOrEqual(80);
    expect(getUsageVisualClasses(stats.images.percentage).valueClassName).toBe(
      "text-white",
    );
    expect(getUsageVisualClasses(stats.storage.percentage).valueClassName).toBe(
      "text-amber-400",
    );
  });

  test("Starter com imagens no limite fica vermelho; Professional não", () => {
    const starter = getPlanLimits(PLAN_IDS.STARTER);
    const professional = getPlanLimits(PLAN_IDS.PROFESSIONAL);
    const usage = {
      projectCount: 1,
      imageCount: starter.maxTotalImages,
      storageBytes: 1024,
    };

    const starterStats = buildUsageStats(starter, usage);
    const proStats = buildUsageStats(professional, usage);

    expect(starterStats.images.percentage).toBe(100);
    expect(getUsageVisualClasses(starterStats.images.percentage).valueClassName).toBe(
      "text-red-400",
    );
    expect(proStats.images.percentage).toBe(0);
    expect(proStats.images.limitLabel).toBe("Ilimitado");
  });
});
