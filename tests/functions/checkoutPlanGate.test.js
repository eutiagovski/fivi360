/**
 * RC-P0.8 / RC-FIX-001 — gate de checkout Stripe (planId → priceId no backend).
 */

const {
  buildCheckoutSuccessUrl,
  normalizeCheckoutPlanId,
  resolveCheckoutPlanFromRequest,
  STRIPE_CHECKOUT_SESSION_ID_PLACEHOLDER,
} = require("../../functions/src/billing/checkoutPlanGate");

describe("normalizeCheckoutPlanId", () => {
  test("planId inválido é rejeitado", () => {
    expect(normalizeCheckoutPlanId(null).ok).toBe(false);
    expect(normalizeCheckoutPlanId(123).ok).toBe(false);
    expect(normalizeCheckoutPlanId("").ok).toBe(false);
  });

  test("normaliza planId string", () => {
    expect(normalizeCheckoutPlanId(" Professional ").planId).toBe("professional");
  });
});

describe("buildCheckoutSuccessUrl", () => {
  test("E — inclui checkout=success, session_id placeholder e plan", () => {
    const professionalUrl = buildCheckoutSuccessUrl(
      "https://app.example.com",
      "professional",
    );
    const studioUrl = buildCheckoutSuccessUrl(
      "https://app.example.com/",
      "studio",
    );

    expect(professionalUrl).toBe(
      `https://app.example.com/plan?checkout=success&session_id=${STRIPE_CHECKOUT_SESSION_ID_PLACEHOLDER}&plan=professional`,
    );
    expect(studioUrl).toBe(
      `https://app.example.com/plan?checkout=success&session_id=${STRIPE_CHECKOUT_SESSION_ID_PLACEHOLDER}&plan=studio`,
    );
    expect(professionalUrl).toContain("checkout=success");
    expect(professionalUrl).toContain(
      `session_id=${STRIPE_CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    );
    expect(professionalUrl).toContain("plan=professional");
    expect(studioUrl).toContain("plan=studio");
  });
});

describe("resolveCheckoutPlanFromRequest", () => {
  const priceMap = {
    professional: "price_pro_test",
    studio: "price_studio_test",
  };

  const deps = {
    getAllowedCheckoutPlanIds: () => new Set(["professional", "studio"]),
    getStripePriceId: (planKey) => priceMap[planKey] || "",
  };

  test("cria resolução Professional com priceId correto", () => {
    const result = resolveCheckoutPlanFromRequest(
      { planId: "professional" },
      deps,
    );
    expect(result).toEqual({
      ok: true,
      planId: "professional",
      priceId: "price_pro_test",
    });
  });

  test("cria resolução Studio com priceId correto", () => {
    const result = resolveCheckoutPlanFromRequest({ planId: "studio" }, deps);
    expect(result).toEqual({
      ok: true,
      planId: "studio",
      priceId: "price_studio_test",
    });
  });

  test("rejeita Starter", () => {
    const result = resolveCheckoutPlanFromRequest({ planId: "starter" }, deps);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/indisponível/i);
  });

  test("rejeita Enterprise", () => {
    const result = resolveCheckoutPlanFromRequest(
      { planId: "enterprise" },
      deps,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/indisponível/i);
  });

  test("não confia em priceId do payload", () => {
    const result = resolveCheckoutPlanFromRequest(
      {
        planId: "professional",
        priceId: "price_attacker_injected",
      },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(result.priceId).toBe("price_pro_test");
    expect(result.priceId).not.toBe("price_attacker_injected");
  });

  test("planId desconhecido é rejeitado", () => {
    const result = resolveCheckoutPlanFromRequest({ planId: "gold" }, deps);
    expect(result.ok).toBe(false);
  });

  test("Studio sem price configurado é rejeitado", () => {
    const result = resolveCheckoutPlanFromRequest(
      { planId: "studio" },
      {
        getAllowedCheckoutPlanIds: () => new Set(["professional"]),
        getStripePriceId: () => "",
      },
    );
    expect(result.ok).toBe(false);
  });
});
