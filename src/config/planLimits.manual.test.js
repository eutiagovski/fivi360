/**
 * RC-MANUAL-PLAN-AND-PAYMENTS-GATE-1 — entitlement ignora source=manual.
 */

import {
  getPlanLimits,
  getPlanSource,
  isManualPlanSource,
  normalizeUserPlan,
  PLAN_IDS,
  PLAN_SOURCES,
} from "@/config/planLimits";

describe("RC-MANUAL — plan source + entitlement", () => {
  test("Studio manual → entitlement Studio", () => {
    const plan = { id: "studio", status: "active", source: "manual" };
    expect(normalizeUserPlan(plan)).toBe(PLAN_IDS.STUDIO);
    expect(getPlanSource(plan)).toBe(PLAN_SOURCES.MANUAL);
    expect(isManualPlanSource(getPlanSource(plan))).toBe(true);
    expect(getPlanLimits(plan).maxStorageBytes).toBe(
      getPlanLimits(PLAN_IDS.STUDIO).maxStorageBytes,
    );
  });

  test("Professional manual → entitlement Professional", () => {
    const plan = { id: "professional", status: "active", source: "manual" };
    expect(normalizeUserPlan(plan)).toBe(PLAN_IDS.PROFESSIONAL);
    expect(getPlanSource(plan)).toBe(PLAN_SOURCES.MANUAL);
  });

  test("Starter string → Starter", () => {
    expect(normalizeUserPlan("starter")).toBe(PLAN_IDS.STARTER);
    expect(getPlanSource("starter")).toBe("");
  });

  test("Studio Stripe → entitlement Studio (source não altera)", () => {
    const plan = { id: "studio", status: "active", source: "stripe" };
    expect(normalizeUserPlan(plan)).toBe(PLAN_IDS.STUDIO);
    expect(getPlanSource(plan)).toBe(PLAN_SOURCES.STRIPE);
    expect(isManualPlanSource(getPlanSource(plan))).toBe(false);
  });

  test("source manual com status canceled → Starter (status ainda filtra)", () => {
    expect(
      normalizeUserPlan({
        id: "studio",
        status: "canceled",
        source: "manual",
      }),
    ).toBe(PLAN_IDS.STARTER);
  });
});
