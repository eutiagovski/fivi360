/**
 * RC-P0.8 — resolução de planId (metadata / invoice lines) e e-mail.
 */

const {
  createGetPlanIdFromInvoiceLines,
  resolvePlanIdFromSources,
} = require("../../functions/src/billing/resolvePlanFromInvoiceLines");
const {
  resolvePlanDisplayName,
} = require("../../functions/src/email/templates/paymentSuccess");

describe("resolvePlanIdFromSources", () => {
  test("metadata studio resolve Studio", () => {
    expect(
      resolvePlanIdFromSources({ subscriptionMetaPlanId: "studio" }),
    ).toEqual({
      planId: "studio",
      source: "stripe_subscription_metadata",
    });
  });

  test("invoice line Studio resolve Studio", () => {
    expect(
      resolvePlanIdFromSources({ invoiceLinePlanId: "studio" }),
    ).toEqual({
      planId: "studio",
      source: "invoice_line",
    });
  });

  test("Professional não é convertido em Studio", () => {
    expect(
      resolvePlanIdFromSources({
        subscriptionMetaPlanId: "professional",
        invoiceLinePlanId: "studio",
      }),
    ).toEqual({
      planId: "professional",
      source: "stripe_subscription_metadata",
    });
  });

  test("Studio metadata não cai em Professional por fallback", () => {
    expect(
      resolvePlanIdFromSources({
        subscriptionMetaPlanId: "studio",
        usersPlanFallback: "professional",
      }),
    ).toEqual({
      planId: "studio",
      source: "stripe_subscription_metadata",
    });
  });

  test("fallback seguro para starter", () => {
    expect(resolvePlanIdFromSources({})).toEqual({
      planId: "starter",
      source: "default_starter",
    });
  });
});

describe("getPlanIdFromInvoiceLines", () => {
  const priceMap = {
    price_pro: "professional",
    price_studio: "studio",
  };

  const getPlanIdFromInvoiceLines = createGetPlanIdFromInvoiceLines(
    (priceId) => priceMap[priceId] || null,
  );

  test("resolve Studio via priceId configurado na line", () => {
    const result = getPlanIdFromInvoiceLines({
      lines: {
        data: [
          {
            price: { id: "price_studio", metadata: {} },
          },
        ],
      },
    });

    expect(result).toEqual({
      planId: "studio",
      source: "invoice_line_stripe_price_id",
    });
  });

  test("metadata na price tem precedência e mantém Professional", () => {
    const result = getPlanIdFromInvoiceLines({
      lines: {
        data: [
          {
            price: {
              id: "price_studio",
              metadata: { planId: "professional" },
            },
          },
        ],
      },
    });

    expect(result.planId).toBe("professional");
  });
});

describe("resolvePlanDisplayName", () => {
  test("e-mail recebe nome correto do plano Studio", () => {
    expect(resolvePlanDisplayName("studio")).toBe("Studio");
    expect(resolvePlanDisplayName("professional")).toBe("Professional");
  });
});
