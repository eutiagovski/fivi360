const { defineString } = require("firebase-functions/params");

/**
 * Mapeamento planKey interna → Stripe Price ID (Firebase param / env).
 *
 * @see Sprint Stripe 1 — base de configuração, sem checkout ainda.
 */

const stripePriceProfessional = defineString("STRIPE_PRICE_PROFESSIONAL");

const STRIPE_PLAN_PRICE_PARAMS = {
  professional: stripePriceProfessional,
};

/**
 * @param {"professional" | string} planKey
 * @returns {string}
 */
function getStripePriceId(planKey) {
  const priceParam = STRIPE_PLAN_PRICE_PARAMS[planKey];
  if (!priceParam) {
    return "";
  }

  return priceParam.value();
}

/**
 * @param {string} stripePriceId
 * @returns {string | null}
 */
function resolvePlanIdFromStripePriceId(stripePriceId) {
  if (typeof stripePriceId !== "string" || !stripePriceId.trim()) {
    return null;
  }

  const normalizedPriceId = stripePriceId.trim();

  for (const planKey of Object.keys(STRIPE_PLAN_PRICE_PARAMS)) {
    if (getStripePriceId(planKey) === normalizedPriceId) {
      return planKey;
    }
  }

  return null;
}

/** Params a declarar em functions que resolvam preços (ex.: checkout futuro). */
const STRIPE_BILLING_PARAMS = [stripePriceProfessional];

module.exports = {
  stripePriceProfessional,
  STRIPE_PLAN_PRICE_PARAMS,
  STRIPE_BILLING_PARAMS,
  getStripePriceId,
  resolvePlanIdFromStripePriceId,
};
