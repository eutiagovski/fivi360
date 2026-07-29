/**
 * RC-FIX-001 — confirmação pós-checkout por plano solicitado.
 */

import {
  BILLING_PROVIDER,
  DEFAULT_BILLING,
  doesPlanSatisfyRequestedPlan,
  getStripeCheckoutPlanIds,
  isActiveStripeBillingProvider,
  isActiveSubscriptionStatus,
  isCheckoutEnabledPlan,
  isCheckoutSuccessConfirmed,
  isPaidPlan,
  isStudioCheckoutConfigured,
  normalizeBilling,
  normalizeCheckoutRequestedPlanId,
  normalizeCheckoutSessionId,
  shouldFinalizeCheckoutSuccess,
} from "@/config/billing";
import { PLAN_IDS } from "@/config/planLimits";

describe("DEFAULT_BILLING bootstrap", () => {
  test("novo bootstrap é stripe/free sem IDs vazios", () => {
    expect(DEFAULT_BILLING.provider).toBe("stripe");
    expect(DEFAULT_BILLING.subscriptionStatus).toBe("free");
    expect(DEFAULT_BILLING).not.toHaveProperty("customerId");
    expect(DEFAULT_BILLING).not.toHaveProperty("subscriptionId");
    expect(JSON.stringify(DEFAULT_BILLING)).not.toMatch(/mercado_pago/i);
    expect(BILLING_PROVIDER).toBe("stripe");
  });
});

describe("plan checkout configuration", () => {
  const originalEnv = process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT;
    } else {
      process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT = originalEnv;
    }
  });

  test("Professional possui checkout ativo", () => {
    expect(isCheckoutEnabledPlan(PLAN_IDS.PROFESSIONAL)).toBe(true);
  });

  test("Studio possui checkout ativo no Beta (default)", () => {
    delete process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT;
    expect(isStudioCheckoutConfigured()).toBe(true);
    expect(isCheckoutEnabledPlan(PLAN_IDS.STUDIO)).toBe(true);
    expect(getStripeCheckoutPlanIds().has(PLAN_IDS.STUDIO)).toBe(true);
  });

  test("Enterprise continua sem checkout", () => {
    expect(isCheckoutEnabledPlan(PLAN_IDS.ENTERPRISE)).toBe(false);
    expect(isPaidPlan(PLAN_IDS.ENTERPRISE)).toBe(true);
  });

  test("Starter não possui checkout", () => {
    expect(isCheckoutEnabledPlan(PLAN_IDS.STARTER)).toBe(false);
    expect(isPaidPlan(PLAN_IDS.STARTER)).toBe(false);
  });

  test("Studio pode ser desabilitado com opt-out explícito", () => {
    process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT = "false";
    expect(isStudioCheckoutConfigured()).toBe(false);
    expect(isCheckoutEnabledPlan(PLAN_IDS.STUDIO)).toBe(false);
  });
});

describe("normalizeCheckoutRequestedPlanId", () => {
  test("aceita professional e studio", () => {
    expect(normalizeCheckoutRequestedPlanId("professional")).toBe(
      PLAN_IDS.PROFESSIONAL,
    );
    expect(normalizeCheckoutRequestedPlanId(" Studio ")).toBe(PLAN_IDS.STUDIO);
  });

  test("rejeita planos inválidos e valores vazios", () => {
    expect(normalizeCheckoutRequestedPlanId("enterprise")).toBeNull();
    expect(normalizeCheckoutRequestedPlanId("starter")).toBeNull();
    expect(normalizeCheckoutRequestedPlanId("premium")).toBeNull();
    expect(normalizeCheckoutRequestedPlanId("")).toBeNull();
    expect(normalizeCheckoutRequestedPlanId(undefined)).toBeNull();
    expect(normalizeCheckoutRequestedPlanId(null)).toBeNull();
  });
});

describe("normalizeCheckoutSessionId", () => {
  test("aceita session_id não vazio", () => {
    expect(normalizeCheckoutSessionId("cs_test_123")).toBe("cs_test_123");
  });

  test("rejeita placeholder e valores inválidos", () => {
    expect(normalizeCheckoutSessionId("{CHECKOUT_SESSION_ID}")).toBeNull();
    expect(normalizeCheckoutSessionId("")).toBeNull();
    expect(normalizeCheckoutSessionId(null)).toBeNull();
    expect(normalizeCheckoutSessionId(undefined)).toBeNull();
  });
});

describe("doesPlanSatisfyRequestedPlan", () => {
  test("A — Professional solicitado", () => {
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.STARTER, PLAN_IDS.PROFESSIONAL),
    ).toBe(false);
    expect(
      doesPlanSatisfyRequestedPlan(
        PLAN_IDS.PROFESSIONAL,
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(true);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, PLAN_IDS.PROFESSIONAL),
    ).toBe(true);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.ENTERPRISE, PLAN_IDS.PROFESSIONAL),
    ).toBe(true);
  });

  test("B — Studio solicitado", () => {
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.STARTER, PLAN_IDS.STUDIO),
    ).toBe(false);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.PROFESSIONAL, PLAN_IDS.STUDIO),
    ).toBe(false);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, PLAN_IDS.STUDIO),
    ).toBe(true);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.ENTERPRISE, PLAN_IDS.STUDIO),
    ).toBe(true);
  });

  test("C — requestedPlanId ausente não confirma qualquer plano pago", () => {
    expect(doesPlanSatisfyRequestedPlan(PLAN_IDS.PROFESSIONAL, null)).toBe(
      false,
    );
    expect(doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, undefined)).toBe(
      false,
    );
    expect(doesPlanSatisfyRequestedPlan(PLAN_IDS.PROFESSIONAL, "")).toBe(false);
  });

  test("D — requestedPlanId inválido não confirma", () => {
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.PROFESSIONAL, "enterprise"),
    ).toBe(false);
    expect(doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, "starter")).toBe(
      false,
    );
    expect(doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, "premium")).toBe(
      false,
    );
  });
});

describe("isCheckoutSuccessConfirmed", () => {
  const stripeActive = {
    subscriptionStatus: "active",
    provider: "stripe",
  };

  test("Professional ativo confirma só com requestedPlanId professional", () => {
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(true);
  });

  test("Studio ativo confirma requestedPlanId studio", () => {
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.STUDIO, billing: stripeActive },
        PLAN_IDS.STUDIO,
      ),
    ).toBe(true);
  });

  test("Starter não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed(
        {
          planId: PLAN_IDS.STARTER,
          billing: { subscriptionStatus: "free", provider: "stripe" },
        },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(false);
  });

  test("past_due não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed(
        {
          planId: PLAN_IDS.PROFESSIONAL,
          billing: { subscriptionStatus: "past_due", provider: "stripe" },
        },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(false);
  });

  test("plano desconhecido não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed(
        {
          planId: "gold",
          billing: stripeActive,
        },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(false);
  });

  test("provider inválido não confirma sucesso de checkout", () => {
    expect(
      isCheckoutSuccessConfirmed(
        {
          planId: PLAN_IDS.PROFESSIONAL,
          billing: {
            subscriptionStatus: "active",
            provider: "mercado_pago",
          },
        },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(false);
  });

  test("C — sem requestedPlanId não confirma plano pago", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.PROFESSIONAL,
        billing: stripeActive,
      }),
    ).toBe(false);
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.STUDIO, billing: stripeActive },
        null,
      ),
    ).toBe(false);
  });

  test("D — requestedPlanId inválido não confirma", () => {
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
        "enterprise",
      ),
    ).toBe(false);
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.STUDIO, billing: stripeActive },
        "starter",
      ),
    ).toBe(false);
  });

  test("F — upgrade Professional → Studio aguarda studio", () => {
    const stillProfessional = {
      planId: PLAN_IDS.PROFESSIONAL,
      billing: stripeActive,
    };
    const nowStudio = {
      planId: PLAN_IDS.STUDIO,
      billing: stripeActive,
    };

    expect(
      isCheckoutSuccessConfirmed(stillProfessional, PLAN_IDS.STUDIO),
    ).toBe(false);
    expect(isCheckoutSuccessConfirmed(nowStudio, PLAN_IDS.STUDIO)).toBe(true);
  });

  test("Studio satisfaz checkout Professional (plano superior)", () => {
    expect(
      isCheckoutSuccessConfirmed(
        { planId: PLAN_IDS.STUDIO, billing: stripeActive },
        PLAN_IDS.PROFESSIONAL,
      ),
    ).toBe(true);
  });
});

describe("shouldFinalizeCheckoutSuccess", () => {
  const stripeActive = {
    subscriptionStatus: "active",
    provider: "stripe",
  };

  test("exige checkout=success, session_id e requestedPlanId válidos", () => {
    expect(
      shouldFinalizeCheckoutSuccess({
        checkoutStatus: "success",
        sessionId: "cs_test_abc",
        requestedPlanId: PLAN_IDS.STUDIO,
        context: { planId: PLAN_IDS.STUDIO, billing: stripeActive },
      }),
    ).toBe(true);
  });

  test("URL antiga sem plan não gera falso positivo", () => {
    expect(
      shouldFinalizeCheckoutSuccess({
        checkoutStatus: "success",
        sessionId: "cs_test_abc",
        requestedPlanId: null,
        context: { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
      }),
    ).toBe(false);
  });

  test("URL sem session_id não confirma", () => {
    expect(
      shouldFinalizeCheckoutSuccess({
        checkoutStatus: "success",
        sessionId: null,
        requestedPlanId: PLAN_IDS.PROFESSIONAL,
        context: { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
      }),
    ).toBe(false);
  });

  test("plan=enterprise adulterado não confirma", () => {
    expect(
      shouldFinalizeCheckoutSuccess({
        checkoutStatus: "success",
        sessionId: "cs_test_fake",
        requestedPlanId: normalizeCheckoutRequestedPlanId("enterprise"),
        context: { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
      }),
    ).toBe(false);
  });

  test("F — Pro→Studio: professional ainda aguarda; studio finaliza uma vez", () => {
    const base = {
      checkoutStatus: "success",
      sessionId: "cs_test_upgrade",
      requestedPlanId: PLAN_IDS.STUDIO,
    };

    const firstRead = shouldFinalizeCheckoutSuccess({
      ...base,
      context: { planId: PLAN_IDS.PROFESSIONAL, billing: stripeActive },
    });
    const secondRead = shouldFinalizeCheckoutSuccess({
      ...base,
      context: { planId: PLAN_IDS.STUDIO, billing: stripeActive },
    });

    expect(firstRead).toBe(false);
    expect(secondRead).toBe(true);
  });
});

describe("normalizeBilling schema atual", () => {
  test("provider inválido cai em defaults Stripe/free sem inventar IDs", () => {
    const billing = normalizeBilling({
      provider: "mercado_pago",
      subscriptionStatus: "active",
      planId: "professional",
      customerId: "cus_fake",
    });

    expect(billing.provider).toBe("stripe");
    expect(isActiveStripeBillingProvider(billing.provider)).toBe(true);
    expect(billing.subscriptionStatus).toBe("free");
    expect(billing.customerId).toBe("");
    expect(billing.subscriptionId).toBe("");
    expect(billing.planId).toBe("");
  });

  test("billing Stripe parcial preserva campos conhecidos", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: "active",
    });

    expect(billing.provider).toBe("stripe");
    expect(billing.subscriptionStatus).toBe("active");
    expect(billing.customerId).toBe("");
  });

  test("normaliza timestamps de billing para Date", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: "active",
      currentPeriodStart: { toDate: () => start },
      currentPeriodEnd: "2026-02-01T00:00:00.000Z",
      updatedAt: start.getTime(),
    });

    expect(billing.currentPeriodStart).toEqual(start);
    expect(billing.currentPeriodEnd).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(billing.updatedAt).toEqual(start);
  });

  test("isActiveSubscriptionStatus", () => {
    expect(isActiveSubscriptionStatus("active")).toBe(true);
    expect(isActiveSubscriptionStatus("trialing")).toBe(true);
    expect(isActiveSubscriptionStatus("past_due")).toBe(false);
    expect(isActiveSubscriptionStatus("free")).toBe(false);
  });
});
