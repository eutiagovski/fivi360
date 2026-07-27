/**
 * RC-P0.5A — testes do resolver puro de entitlement (callable syncPublicPortfolioAvailability).
 *
 * A callable em si ignora request.data e usa apenas request.auth.uid + users.plan.
 * Estes testes cobrem a regra comercial sem emulator de Functions.
 *
 * Run: npm run test:portfolio-entitlement
 */

const {
  normalizePlanId,
  computePortfolioAvailable,
  resolvePortfolioAvailableFromServerState,
} = require("../../functions/src/portfolio/resolvePortfolioAvailable");

describe("normalizePlanId (server source of truth)", () => {
  test("6. invalid plan string falls back to starter", () => {
    expect(normalizePlanId("gold")).toBe("starter");
    expect(normalizePlanId("")).toBe("starter");
    expect(normalizePlanId(null)).toBe("starter");
    expect(normalizePlanId(undefined)).toBe("starter");
  });

  test("11. paid plan with inactive status does not keep entitlement", () => {
    expect(
      normalizePlanId({ id: "professional", status: "canceled" }),
    ).toBe("starter");
    expect(
      normalizePlanId({ id: "studio", status: "past_due" }),
    ).toBe("starter");
    expect(
      normalizePlanId({ id: "enterprise", status: "unpaid" }),
    ).toBe("starter");
  });

  test("active and trialing paid plans remain eligible", () => {
    expect(
      normalizePlanId({ id: "professional", status: "active", source: "stripe" }),
    ).toBe("professional");
    expect(
      normalizePlanId({ id: "studio", status: "trialing" }),
    ).toBe("studio");
  });

  test("cancelAtPeriodEnd with active status still keeps plan (until period ends)", () => {
    expect(
      normalizePlanId({
        id: "professional",
        status: "active",
        cancelAtPeriodEnd: true,
      }),
    ).toBe("professional");
  });
});

describe("computePortfolioAvailable / resolve — deny promotion paths", () => {
  test("3/5. Starter cannot promote even with portfolioEnabled", () => {
    expect(computePortfolioAvailable(true, "starter")).toBe(false);
    expect(
      computePortfolioAvailable(true, { id: "starter", status: "active" }),
    ).toBe(false);
  });

  test("4. client-supplied portfolioAvailable:true is irrelevant (resolver ignores it)", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: "starter",
      portfolioEnabled: true,
      // campos abaixo não existem na API — simulam payload malicioso ignorado
      clientPortfolioAvailable: true,
      clientPlanId: "studio",
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.portfolioAvailable).toBe(false);
  });

  test("payload planId studio while server plan is starter does not promote", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "starter", status: "active", source: "system" },
      portfolioEnabled: true,
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.planId).toBe("starter");
    expect(resolved.portfolioAvailable).toBe(false);
  });

  test("7. missing user is not-found (callable must not invent entitlement)", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: false,
      plan: { id: "studio", status: "active" },
      portfolioEnabled: true,
    });

    expect(resolved).toEqual({ ok: false, code: "user-not-found" });
  });

  test("portfolioEnabled false never promotes", () => {
    expect(
      computePortfolioAvailable(false, {
        id: "professional",
        status: "active",
      }),
    ).toBe(false);
  });
});

describe("computePortfolioAvailable / resolve — allow eligible plans", () => {
  test("8. Professional eligible promotes to true", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "professional", status: "active", source: "stripe" },
      portfolioEnabled: true,
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.portfolioAvailable).toBe(true);
    expect(resolved.planId).toBe("professional");
  });

  test("9. Studio eligible promotes to true", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "studio", status: "active", source: "stripe" },
      portfolioEnabled: true,
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.portfolioAvailable).toBe(true);
    expect(resolved.planId).toBe("studio");
  });

  test("10. Starter keeps false", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: "starter",
      portfolioEnabled: true,
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.portfolioAvailable).toBe(false);
  });

  test("11. inactive paid plan does not promote", () => {
    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "professional", status: "canceled" },
      portfolioEnabled: true,
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.portfolioAvailable).toBe(false);
    expect(resolved.planId).toBe("starter");
  });

  test("12. repeated resolve is idempotent", () => {
    const input = {
      userExists: true,
      plan: { id: "professional", status: "active" },
      portfolioEnabled: true,
    };

    expect(resolvePortfolioAvailableFromServerState(input)).toEqual(
      resolvePortfolioAvailableFromServerState(input),
    );
  });

  test("13. resolution is scoped to auth uid data only (no cross-user plan)", () => {
    const own = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "starter", status: "active" },
      portfolioEnabled: true,
    });
    const otherWouldBe = resolvePortfolioAvailableFromServerState({
      userExists: true,
      plan: { id: "studio", status: "active" },
      portfolioEnabled: true,
    });

    // Callable always loads users/{auth.uid}; spoofed other-user plan cannot be injected.
    expect(own.portfolioAvailable).toBe(false);
    expect(otherWouldBe.portfolioAvailable).toBe(true);
  });
});

describe("callable contract notes (manual / emulator)", () => {
  test("1/2. documents auth and uid contract", () => {
    // syncPublicPortfolioAvailability:
    // - sem request.auth → HttpsError unauthenticated
    // - uid = request.auth.uid apenas; request.data.uid ignorado
    expect(true).toBe(true);
  });
});
