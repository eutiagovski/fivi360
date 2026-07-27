/**
 * RC-P0.8 — compatibilidade de mapeamento com billing legado Mercado Pago.
 */

import { mapUserDoc } from "@/services/users/userMappers";
import { normalizeUserPlan } from "@/config/planLimits";

describe("legacy Mercado Pago billing mapping", () => {
  test("usuário antigo com billing mercado_pago continua carregando o app", () => {
    const profile = mapUserDoc(
      "uid-legacy",
      {
        displayName: "Legado",
        email: "legado@example.com",
        plan: "starter",
        billing: {
          provider: "mercado_pago",
          customerId: "",
          subscriptionId: "",
          planId: "",
          subscriptionStatus: "free",
        },
      },
      {
        displayName: "Legado",
        slug: "",
        portfolioEnabled: false,
      },
    );

    expect(profile.planId).toBe("starter");
    expect(profile.billing.provider).toBe("mercado_pago");
    expect(profile.displayName).toBe("Legado");
  });

  test("billing legacy não libera entitlement", () => {
    const profile = mapUserDoc(
      "uid-legacy",
      {
        displayName: "Legado",
        email: "legado@example.com",
        plan: "starter",
        billing: {
          provider: "mercado_pago",
          planId: "professional",
          subscriptionStatus: "active",
        },
      },
      null,
    );

    // Entitlement vem de users.plan, não de billing.planId legado.
    expect(normalizeUserPlan(profile.plan)).toBe("starter");
    expect(profile.planId).toBe("starter");
  });

  test("billing legacy não interfere em users.plan Stripe", () => {
    const profile = mapUserDoc(
      "uid-mixed",
      {
        displayName: "Misto",
        email: "misto@example.com",
        plan: {
          id: "studio",
          status: "active",
          source: "stripe",
        },
        billing: {
          provider: "mercado_pago",
          planId: "professional",
        },
      },
      null,
    );

    expect(profile.planId).toBe("studio");
    expect(profile.billing.provider).toBe("stripe");
    expect(profile.billing.planId).toBe("studio");
  });
});
