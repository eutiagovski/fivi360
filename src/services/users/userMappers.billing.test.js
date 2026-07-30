/**
 * RC-CLEANUP-LEGACY-1 — mapeamento do schema atual de billing / plano.
 */

import { mapUserDoc, mapToPublicUser } from "@/services/users/userMappers";
import { normalizeUserPlan } from "@/config/planLimits";

describe("current billing / plan mapping", () => {
  test("Starter atual: plan string + billing stripe/free", () => {
    const profile = mapUserDoc(
      "uid-starter",
      {
        displayName: "Starter",
        email: "starter@example.com",
        plan: "starter",
        billing: {
          provider: "stripe",
          subscriptionStatus: "free",
        },
      },
      {
        displayName: "Starter",
        slug: "",
        portfolioEnabled: false,
        portfolioAvailable: false,
      },
    );

    expect(profile.planId).toBe("starter");
    expect(profile.billing.provider).toBe("stripe");
    expect(profile.billing.subscriptionStatus).toBe("free");
    expect(profile.billing.customerId).toBe("");
    expect(profile.billing.subscriptionId).toBe("");
  });

  test("Professional Stripe: plan objeto + billing.stripe", () => {
    const profile = mapUserDoc(
      "uid-pro",
      {
        displayName: "Pro",
        email: "pro@example.com",
        plan: {
          id: "professional",
          status: "active",
          source: "stripe",
        },
        billing: {
          provider: "stripe",
          stripe: {
            customerId: "cus_pro",
            subscriptionId: "sub_pro",
          },
        },
      },
      null,
    );

    expect(profile.planId).toBe("professional");
    expect(profile.billing.provider).toBe("stripe");
    expect(profile.billing.planId).toBe("professional");
    expect(profile.billing.subscriptionStatus).toBe("active");
    expect(profile.billing.customerId).toBe("cus_pro");
    expect(profile.billing.subscriptionId).toBe("sub_pro");
  });

  test("Studio Stripe", () => {
    const profile = mapUserDoc(
      "uid-studio",
      {
        plan: { id: "studio", status: "active", source: "stripe" },
        billing: {
          provider: "stripe",
          stripe: { customerId: "cus_s", subscriptionId: "sub_s" },
        },
      },
      null,
    );

    expect(profile.planId).toBe("studio");
    expect(profile.billing.planId).toBe("studio");
  });

  test("Enterprise reconhecido internamente", () => {
    const profile = mapUserDoc(
      "uid-ent",
      {
        plan: { id: "enterprise", status: "active", source: "stripe" },
        billing: { provider: "stripe" },
      },
      null,
    );

    expect(profile.planId).toBe("enterprise");
  });

  test("billing ausente não concede entitlement e usa defaults Stripe", () => {
    const profile = mapUserDoc(
      "uid-no-billing",
      {
        plan: "starter",
      },
      null,
    );

    expect(profile.planId).toBe("starter");
    expect(profile.billing.provider).toBe("stripe");
    expect(profile.billing.subscriptionStatus).toBe("free");
  });

  test("billing parcial usa defaults seguros", () => {
    const profile = mapUserDoc(
      "uid-partial",
      {
        plan: "starter",
        billing: { provider: "stripe" },
      },
      null,
    );

    expect(profile.billing.provider).toBe("stripe");
    expect(profile.billing.subscriptionStatus).toBe("free");
    expect(profile.billing.customerId).toBe("");
  });

  test("provider inválido não concede entitlement e normaliza para stripe", () => {
    const profile = mapUserDoc(
      "uid-invalid-provider",
      {
        plan: "starter",
        billing: {
          provider: "mercado_pago",
          planId: "professional",
          subscriptionStatus: "active",
        },
      },
      null,
    );

    expect(normalizeUserPlan(profile.plan)).toBe("starter");
    expect(profile.planId).toBe("starter");
    expect(profile.billing.provider).toBe("stripe");
  });

  test("aliases históricos de plano não concedem entitlement", () => {
    expect(normalizeUserPlan("free")).toBe("starter");
    expect(normalizeUserPlan("pro")).toBe("starter");
    expect(normalizeUserPlan("gold")).toBe("starter");
  });

  test("plano inválido → Starter", () => {
    const profile = mapUserDoc(
      "uid-bad-plan",
      { plan: "premium", billing: { provider: "stripe" } },
      null,
    );

    expect(profile.planId).toBe("starter");
  });

  test("mapToPublicUser não inclui plan/billing e exige portfolioAvailable explícito", () => {
    const publicUser = mapToPublicUser("uid-pub", {
      displayName: "Público",
      portfolioEnabled: true,
      portfolioAvailable: true,
      slug: "publico",
    });

    expect(publicUser.portfolioAvailable).toBe(true);
    expect(publicUser).not.toHaveProperty("plan");
    expect(publicUser).not.toHaveProperty("billing");
    expect(publicUser).not.toHaveProperty("email");
  });

  test("RC-MARKETING-CONSENT-1 — mapUserDoc maps marketingPreferences dates; absence → defaults", () => {
    const withoutField = mapUserDoc("uid-legacy", {
      displayName: "Legacy",
      email: "legacy@example.com",
      plan: "starter",
    });

    expect(withoutField.marketingPreferences.enabled).toBe(false);
    expect(withoutField.marketingPreferences.consentVersion).toBeNull();
    expect(withoutField.marketingPreferences.consentedAt).toBeNull();

    const consentedAt = { toDate: () => new Date("2026-03-01T10:00:00.000Z") };
    const withConsent = mapUserDoc("uid-new", {
      displayName: "New",
      email: "new@example.com",
      plan: "starter",
      marketingPreferences: {
        enabled: true,
        productUpdates: true,
        offers: false,
        tips: true,
        newsletter: false,
        research: false,
        consentVersion: "beta-2026-01",
        consentSource: "signup",
        consentedAt,
        revokedAt: null,
        updatedAt: consentedAt,
      },
    });

    expect(withConsent.marketingPreferences.enabled).toBe(true);
    expect(withConsent.marketingPreferences.offers).toBe(false);
    expect(withConsent.marketingPreferences.consentedAt).toEqual(
      new Date("2026-03-01T10:00:00.000Z"),
    );
    expect(withConsent.marketingPreferences.consentedAt).toBeInstanceOf(Date);
  });
});
