/**
 * RC-MANUAL-PLAN-AND-PAYMENTS-GATE-1 — gate PAID_CHECKOUT_ENABLED (Functions).
 */

describe("isPaidCheckoutEnabled", () => {
  const original = process.env.PAID_CHECKOUT_ENABLED;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("firebase-functions/params", () => ({
      defineString: (name, opts = {}) => ({
        name,
        value: () => opts.default ?? "",
      }),
    }));
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PAID_CHECKOUT_ENABLED;
    } else {
      process.env.PAID_CHECKOUT_ENABLED = original;
    }

    jest.resetModules();
    jest.dontMock("firebase-functions/params");
  });

  test("false → checkout desabilitado", () => {
    process.env.PAID_CHECKOUT_ENABLED = "false";
    const { isPaidCheckoutEnabled } = require("../../functions/src/config/stripeBilling");
    expect(isPaidCheckoutEnabled()).toBe(false);
  });

  test("true → checkout habilitado", () => {
    process.env.PAID_CHECKOUT_ENABLED = "true";
    const { isPaidCheckoutEnabled } = require("../../functions/src/config/stripeBilling");
    expect(isPaidCheckoutEnabled()).toBe(true);
  });

  test("mensagem de pagamentos em breve exportada", () => {
    const { PAYMENTS_COMING_SOON_MESSAGE } = require("../../functions/src/config/stripeBilling");
    expect(PAYMENTS_COMING_SOON_MESSAGE).toMatch(/breve/i);
  });
});

describe("createStripeCheckoutSession — gate no código-fonte", () => {
  test("handler rejeita quando isPaidCheckoutEnabled é false antes de Stripe", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(
      path.join(__dirname, "../../functions/src/createStripeCheckoutSession.js"),
      "utf8",
    );

    const gateIdx = source.indexOf("isPaidCheckoutEnabled()");
    const stripeIdx = source.indexOf("getStripeClient()");

    expect(gateIdx).toBeGreaterThan(-1);
    expect(stripeIdx).toBeGreaterThan(-1);
    expect(gateIdx).toBeLessThan(stripeIdx);
    expect(source).toContain("PAYMENTS_COMING_SOON_MESSAGE");
  });
});
