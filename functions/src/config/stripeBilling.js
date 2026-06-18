const { defineString } = require("firebase-functions/params");

/**
 * Mapeamento planKey interna → Stripe Price ID (Firebase param / env).
 */

const stripePriceProfessional = defineString("STRIPE_PRICE_PROFESSIONAL");
const stripePriceStudio = defineString("STRIPE_PRICE_STUDIO", { default: "" });

const STRIPE_PLAN_PRICE_PARAMS = {
  professional: stripePriceProfessional,
  studio: stripePriceStudio,
};

/** Aliases de env para compatibilidade local. */
const STRIPE_PRICE_ENV_ALIASES = {
  studio: ["STRIPE_PRICE_STUDIO_MONTHLY"],
};

/**
 * @param {"professional" | "studio" | string} planKey
 * @returns {string}
 */
function getStripePriceId(planKey) {
  const priceParam = STRIPE_PLAN_PRICE_PARAMS[planKey];
  if (priceParam) {
    const value = priceParam.value();
    if (value && value.trim()) {
      return value.trim();
    }
  }

  const aliases = STRIPE_PRICE_ENV_ALIASES[planKey] ?? [];
  for (const envKey of aliases) {
    const aliasValue = process.env[envKey];
    if (typeof aliasValue === "string" && aliasValue.trim()) {
      return aliasValue.trim();
    }
  }

  return "";
}

/**
 * Planos com preço Stripe configurado e checkout permitido.
 * @returns {Set<string>}
 */
function getAllowedCheckoutPlanIds() {
  const allowed = new Set();

  for (const planKey of Object.keys(STRIPE_PLAN_PRICE_PARAMS)) {
    if (getStripePriceId(planKey)) {
      allowed.add(planKey);
    }
  }

  return allowed;
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

/** Params a declarar em functions que resolvam preços. */
const STRIPE_BILLING_PARAMS = [stripePriceProfessional, stripePriceStudio];

module.exports = {
  stripePriceProfessional,
  stripePriceStudio,
  STRIPE_PLAN_PRICE_PARAMS,
  STRIPE_BILLING_PARAMS,
  getStripePriceId,
  getAllowedCheckoutPlanIds,
  resolvePlanIdFromStripePriceId,
};
