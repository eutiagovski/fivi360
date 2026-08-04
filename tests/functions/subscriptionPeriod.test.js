/**
 * RC-PLAN-USAGE-BILLING-DISPLAY-1 — extração de período Stripe Basil/Dahlia.
 */

const {
  extractSubscriptionPeriodUnix,
} = require("../../functions/src/stripe/subscriptionPeriod");

describe("extractSubscriptionPeriodUnix", () => {
  test("lê current_period_end de items.data (API Dahlia)", () => {
    const result = extractSubscriptionPeriodUnix({
      cancel_at_period_end: false,
      items: {
        data: [
          {
            current_period_start: 1690000000,
            current_period_end: 1692678400,
          },
        ],
      },
    });

    expect(result.currentPeriodStart).toBe(1690000000);
    expect(result.currentPeriodEnd).toBe(1692678400);
    expect(result.cancelAtPeriodEnd).toBe(false);
  });

  test("escolhe o maior current_period_end entre items", () => {
    const result = extractSubscriptionPeriodUnix({
      items: {
        data: [
          { current_period_end: 100, current_period_start: 1 },
          { current_period_end: 200, current_period_start: 2 },
        ],
      },
    });

    expect(result.currentPeriodEnd).toBe(200);
    expect(result.currentPeriodStart).toBe(2);
  });

  test("fallback para subscription.current_period_end (pré-Basil)", () => {
    const result = extractSubscriptionPeriodUnix({
      current_period_start: 10,
      current_period_end: 20,
      cancel_at_period_end: true,
      items: { data: [] },
    });

    expect(result.currentPeriodStart).toBe(10);
    expect(result.currentPeriodEnd).toBe(20);
    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  test("subscription sem período retorna nulls", () => {
    expect(extractSubscriptionPeriodUnix(null)).toEqual({
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    expect(extractSubscriptionPeriodUnix({ items: { data: [{}] } })).toEqual({
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });
});
