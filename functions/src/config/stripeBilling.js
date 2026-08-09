const { defineString } = require("firebase-functions/params");

/**
 * Mapeamento planKey interna → Stripe Price ID (Firebase param / env).
 * Gate global de checkout pago: PAID_CHECKOUT_ENABLED (RC-MANUAL-PLAN-AND-PAYMENTS-GATE-1).
 */

const stripePriceProfessional = defineString("STRIPE_PRICE_PROFESSIONAL");
const stripePriceStudio = defineString("STRIPE_PRICE_STUDIO", { default: "" });
/** Opt-out: "false" bloqueia checkout antes de Stripe. Default "true" para compat local/testes. */
const paidCheckoutEnabledParam = defineString("PAID_CHECKOUT_ENABLED", {
  default: "true",
});

const STRIPE_PLAN_PRICE_PARAMS = {
  professional: stripePriceProfessional,
  studio: stripePriceStudio,
};

/** Aliases de env para compatibilidade local. */
const STRIPE_PRICE_ENV_ALIASES = {
  studio: ["STRIPE_PRICE_STUDIO_MONTHLY"],
};

const PAYMENTS_COMING_SOON_MESSAGE = "Pagamentos serão ativados em breve.";

/**
 * Autoridade do gate de checkout pago (Functions).
 * `PAID_CHECKOUT_ENABLED=false` → rejeitar antes de chamar Stripe.
 * Também lê process.env para testes Jest sem defineString.
 * @returns {boolean}
 */
function isPaidCheckoutEnabled() {
  const fromEnv = process.env.PAID_CHECKOUT_ENABLED;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.toLowerCase().trim() !== "false";
  }

  try {
    const value = paidCheckoutEnabledParam.value();
    return String(value ?? "true").toLowerCase().trim() !== "false";
  } catch {
    return true;
  }
}

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
 * Gate global PAID_CHECKOUT_ENABLED deve ser consultado à parte (createStripeCheckoutSession).
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

/** Params a declarar em functions que resolvam preços / gate de checkout. */
const STRIPE_BILLING_PARAMS = [
  stripePriceProfessional,
  stripePriceStudio,
  paidCheckoutEnabledParam,
];

module.exports = {
  stripePriceProfessional,
  stripePriceStudio,
  paidCheckoutEnabledParam,
  STRIPE_PLAN_PRICE_PARAMS,
  STRIPE_BILLING_PARAMS,
  PAYMENTS_COMING_SOON_MESSAGE,
  isPaidCheckoutEnabled,
  getStripePriceId,
  getAllowedCheckoutPlanIds,
  resolvePlanIdFromStripePriceId,
};
