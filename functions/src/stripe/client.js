const { defineSecret } = require("firebase-functions/params");
const Stripe = require("stripe");
const { requireConfiguredSecret } = require("../config/requireConfiguredSecret");

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

/** @type {Stripe | null} */
let stripeClient = null;

/**
 * Retorna cliente Stripe inicializado com a secret configurada.
 * Não inicializa se STRIPE_SECRET_KEY estiver ausente (retorna null).
 * Validação é lazy — não roda no import do módulo.
 *
 * @returns {Stripe | null}
 */
function getStripeClient() {
  let secretKey;
  try {
    secretKey = requireConfiguredSecret(STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
  } catch {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

module.exports = {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  getStripeClient,
};
