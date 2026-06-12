import {
  DEFAULT_USER_PLAN,
  isPaidPlan,
  isSubscriptionActive,
  normalizeUserPlan,
  PLAN_SOURCE,
  PLAN_STATUS,
  SUBSCRIPTION_STATUS,
} from "./billing";

describe("normalizeUserPlan", () => {
  it("normaliza plan legado como string starter", () => {
    const plan = normalizeUserPlan("starter");

    expect(plan).toEqual({
      ...DEFAULT_USER_PLAN,
      id: "starter",
    });
  });

  it("normaliza plan legado como string professional", () => {
    const plan = normalizeUserPlan("professional");

    expect(plan.id).toBe("professional");
    expect(plan.status).toBe(PLAN_STATUS.ACTIVE);
    expect(plan.source).toBe(PLAN_SOURCE.SYSTEM);
  });

  it("preserva objeto plan completo", () => {
    const plan = normalizeUserPlan({
      id: "enterprise",
      status: "trialing",
      source: "mercado_pago",
      startedAt: "2026-01-01",
      currentPeriodEnd: "2026-02-01",
      updatedAt: "2026-01-15",
    });

    expect(plan.id).toBe("enterprise");
    expect(plan.status).toBe("trialing");
    expect(plan.source).toBe("mercado_pago");
    expect(plan.startedAt).toBe("2026-01-01");
    expect(plan.currentPeriodEnd).toBe("2026-02-01");
  });

  it("retorna starter padrão para valor inválido", () => {
    const plan = normalizeUserPlan(null);

    expect(plan).toEqual({ ...DEFAULT_USER_PLAN });
  });
});

describe("isPaidPlan", () => {
  it("starter não é plano pago", () => {
    expect(isPaidPlan("starter")).toBe(false);
    expect(isPaidPlan({ id: "starter", status: "active" })).toBe(false);
  });

  it("professional e enterprise são planos pagos", () => {
    expect(isPaidPlan("professional")).toBe(true);
    expect(isPaidPlan({ id: "enterprise", status: "active" })).toBe(true);
  });
});

describe("isSubscriptionActive", () => {
  it("retorna false sem assinatura", () => {
    expect(isSubscriptionActive(null)).toBe(false);
    expect(isSubscriptionActive(undefined)).toBe(false);
  });

  it("retorna false para inactive", () => {
    expect(
      isSubscriptionActive({ status: SUBSCRIPTION_STATUS.INACTIVE }),
    ).toBe(false);
  });

  it("retorna true para active e trialing", () => {
    expect(
      isSubscriptionActive({ status: SUBSCRIPTION_STATUS.ACTIVE }),
    ).toBe(true);
    expect(
      isSubscriptionActive({ status: SUBSCRIPTION_STATUS.TRIALING }),
    ).toBe(true);
  });
});
