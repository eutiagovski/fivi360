/**
 * URL base do app web (links de ação do Firebase Auth, CTAs de e-mail, back_url MP).
 *
 * Produção e emulador: https://fivi360.web.app
 * Mercado Pago rejeita Firebase Hosting preview channels como back_url.
 * Sobrescreva com APP_BASE_URL em functions/.env ou params do Firebase.
 */

const DEFAULT_APP_BASE_URL = "https://fivi360.web.app";

/**
 * @returns {string}
 */
function resolveAppBaseUrl() {
  const raw = (process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL).replace(/\/$/, "");

  if (!raw) {
    throw new Error("APP_BASE_URL não configurada");
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("APP_BASE_URL não configurada");
    }
  } catch {
    throw new Error("APP_BASE_URL não configurada");
  }

  return raw;
}

const APP_BASE_URL = resolveAppBaseUrl();

/**
 * URL de retorno após checkout de assinatura no Mercado Pago (preapproval).
 * @returns {string}
 */
function getSubscriptionCheckoutBackUrl() {
  return `${APP_BASE_URL}/plan?checkout=mercado_pago`;
}

module.exports = {
  APP_BASE_URL,
  getSubscriptionCheckoutBackUrl,
  resolveAppBaseUrl,
};
