/**
 * RC-P0.8 — helpers de billing / checkout success / Studio Beta.
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
  isLegacyBillingProvider,
  isPaidPlan,
  isStudioCheckoutConfigured,
  LEGACY_BILLING_PROVIDER,
  normalizeBilling,
} from "@/config/billing";
import { PLAN_IDS } from "@/config/planLimits";

describe("DEFAULT_BILLING bootstrap", () => {
  test("novo bootstrap não contém Mercado Pago nem IDs vazios", () => {
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

describe("isCheckoutSuccessConfirmed", () => {
  test("Professional ativo retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.PROFESSIONAL,
        billing: { subscriptionStatus: "active", provider: "stripe" },
      }),
    ).toBe(true);
  });

  test("Studio ativo retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.STUDIO,
        billing: { subscriptionStatus: "active", provider: "stripe" },
      }),
    ).toBe(true);
  });

  test("Starter não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.STARTER,
        billing: { subscriptionStatus: "free", provider: "stripe" },
      }),
    ).toBe(false);
  });

  test("past_due não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.PROFESSIONAL,
        billing: { subscriptionStatus: "past_due", provider: "stripe" },
      }),
    ).toBe(false);
  });

  test("plano desconhecido não retorna sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: "gold",
        billing: { subscriptionStatus: "active", provider: "stripe" },
      }),
    ).toBe(false);
  });

  test("plano já atualizado antes de abrir a tela é reconhecido", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.STUDIO,
        billing: { subscriptionStatus: "trialing", provider: "stripe" },
      }),
    ).toBe(true);
  });

  test("billing legado Mercado Pago não confirma sucesso", () => {
    expect(
      isCheckoutSuccessConfirmed({
        planId: PLAN_IDS.PROFESSIONAL,
        billing: {
          subscriptionStatus: "active",
          provider: LEGACY_BILLING_PROVIDER,
        },
      }),
    ).toBe(false);
  });

  test("doesPlanSatisfyRequestedPlan compara planos corretamente", () => {
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.STUDIO, PLAN_IDS.PROFESSIONAL),
    ).toBe(true);
    expect(
      doesPlanSatisfyRequestedPlan(PLAN_IDS.PROFESSIONAL, PLAN_IDS.STUDIO),
    ).toBe(false);
  });
});

describe("legacy billing compatibility", () => {
  test("normalizeBilling preserva provider mercado_pago sem inventar Stripe IDs", () => {
    const billing = normalizeBilling({
      provider: "mercado_pago",
      subscriptionStatus: "free",
    });

    expect(isLegacyBillingProvider(billing.provider)).toBe(true);
    expect(isActiveStripeBillingProvider(billing.provider)).toBe(false);
    expect(billing.customerId).toBe("");
    expect(billing.subscriptionId).toBe("");
  });

  test("isActiveSubscriptionStatus", () => {
    expect(isActiveSubscriptionStatus("active")).toBe(true);
    expect(isActiveSubscriptionStatus("trialing")).toBe(true);
    expect(isActiveSubscriptionStatus("past_due")).toBe(false);
    expect(isActiveSubscriptionStatus("free")).toBe(false);
  });
});
