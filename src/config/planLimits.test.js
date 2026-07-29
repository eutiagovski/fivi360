/**
 * RC-PLANS-PRICING-1 — matriz comercial Beta (fonte: planLimits.js).
 */

import {
  APPROX_IMAGE_BYTES,
  formatApproximateImageCountLabel,
  formatMonthlyPriceLabel,
  formatStorageLimitLabel,
  PLAN_CONFIG,
  PLAN_IDS,
  PLAN_LIMITS,
  STORAGE_IMAGE_ESTIMATE_NOTE,
} from "@/config/planLimits";
import {
  BILLING_PLANS,
  getPlanMonthlyPriceLabel,
  isCheckoutEnabledPlan,
  UPGRADE_PLAN_PRICES,
} from "@/config/billing";

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

describe("PLAN_LIMITS / PLAN_CONFIG commercial matrix", () => {
  test("PLAN_CONFIG is the same object as PLAN_LIMITS", () => {
    expect(PLAN_CONFIG).toBe(PLAN_LIMITS);
  });

  test("Starter — free, 25 MB, ~5 images, no checkout", () => {
    const plan = PLAN_LIMITS[PLAN_IDS.STARTER];
    expect(plan.monthlyPrice).toBe(0);
    expect(plan.maxStorageBytes).toBe(25 * MB);
    expect(plan.approximateImageCount).toBe(5);
    expect(plan.checkoutEnabled).toBe(false);
    expect(plan.priceLabel).toBe("Grátis");
    expect(plan.featureBullets).toEqual(
      expect.arrayContaining([
        "25 MB de armazenamento",
        "Aproximadamente 5 imagens panorâmicas",
      ]),
    );
  });

  test("Professional — R$ 49, 250 MB, ~50 images, checkout", () => {
    const plan = PLAN_LIMITS[PLAN_IDS.PROFESSIONAL];
    expect(plan.monthlyPrice).toBe(49);
    expect(plan.maxStorageBytes).toBe(250 * MB);
    expect(plan.approximateImageCount).toBe(50);
    expect(plan.checkoutEnabled).toBe(true);
    expect(plan.priceLabel).toBe("R$ 49");
    expect(plan.featureBullets).toEqual(
      expect.arrayContaining([
        "250 MB de armazenamento",
        "Aproximadamente 50 imagens panorâmicas",
      ]),
    );
    expect(plan.featureBullets.join(" ")).not.toMatch(/500 MB/);
  });

  test("Studio — R$ 199, 2 GB, ~400 images, checkout", () => {
    const plan = PLAN_LIMITS[PLAN_IDS.STUDIO];
    expect(plan.monthlyPrice).toBe(199);
    expect(plan.maxStorageBytes).toBe(2 * GB);
    expect(plan.approximateImageCount).toBe(400);
    expect(plan.checkoutEnabled).toBe(true);
    expect(plan.priceLabel).toBe("R$ 199");
  });

  test("Enterprise — sob consulta, from 10 GB, contact only", () => {
    const plan = PLAN_LIMITS[PLAN_IDS.ENTERPRISE];
    expect(plan.monthlyPrice).toBeNull();
    expect(plan.maxStorageBytes).toBe(10 * GB);
    expect(plan.approximateImageCount).toBeNull();
    expect(plan.checkoutEnabled).toBe(false);
    expect(plan.contactOnly).toBe(true);
    expect(plan.priceLabel).toBe("Sob consulta");
    expect(plan.periodLabel).toBe("");
    expect(isCheckoutEnabledPlan(PLAN_IDS.ENTERPRISE)).toBe(false);
  });

  test("estimate note and ~5 MB reference are defined", () => {
    expect(APPROX_IMAGE_BYTES).toBe(5 * MB);
    expect(STORAGE_IMAGE_ESTIMATE_NOTE).toMatch(/5 MB/);
    expect(STORAGE_IMAGE_ESTIMATE_NOTE).toMatch(/aproximada/i);
  });

  test("format helpers", () => {
    expect(formatMonthlyPriceLabel(0)).toBe("Grátis");
    expect(formatMonthlyPriceLabel(49)).toBe("R$ 49");
    expect(formatMonthlyPriceLabel(null)).toBe("Sob consulta");
    expect(formatApproximateImageCountLabel(50)).toBe(
      "Aproximadamente 50 imagens panorâmicas",
    );
    expect(formatApproximateImageCountLabel(null)).toBe(
      "Quantidade de imagens personalizada",
    );
    expect(formatStorageLimitLabel(250 * MB)).toBe("250 MB de armazenamento");
    expect(formatStorageLimitLabel(10 * GB, { from: true })).toBe(
      "A partir de 10 GB de armazenamento",
    );
  });
});

describe("billing and upgrade prices derive from PLAN_LIMITS", () => {
  test("UPGRADE_PLAN_PRICES mirrors PLAN_LIMITS labels", () => {
    for (const planId of Object.values(PLAN_IDS)) {
      expect(UPGRADE_PLAN_PRICES[planId].priceLabel).toBe(
        PLAN_LIMITS[planId].priceLabel,
      );
      expect(getPlanMonthlyPriceLabel(planId)).toBe(
        PLAN_LIMITS[planId].priceLabel,
      );
    }
  });

  test("BILLING_PLANS monthly prices match PLAN_LIMITS", () => {
    expect(BILLING_PLANS.professional.price).toBe(
      PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].monthlyPrice,
    );
    expect(BILLING_PLANS.studio.price).toBe(
      PLAN_LIMITS[PLAN_IDS.STUDIO].monthlyPrice,
    );
    expect(BILLING_PLANS.enterprise.price).toBe(
      PLAN_LIMITS[PLAN_IDS.ENTERPRISE].monthlyPrice,
    );
  });
});
