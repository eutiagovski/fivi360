const { defineSecret } = require("firebase-functions/params");
const Stripe = require("stripe");

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

/** @type {Stripe | null} */
let stripeClient = null;

/**
 * Retorna cliente Stripe inicializado com a secret configurada.
 * Não inicializa se STRIPE_SECRET_KEY estiver ausente.
 *
 * @returns {Stripe | null}
 */
function getStripeClient() {
  const secretKey = STRIPE_SECRET_KEY.value();
  if (!secretKey) {
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
