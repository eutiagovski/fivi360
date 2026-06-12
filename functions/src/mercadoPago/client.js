const { defineSecret } = require("firebase-functions/params");

const MP_API_BASE = "https://api.mercadopago.com";

const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");

/**
 * @param {string} accessToken
 * @returns {"sandbox" | "production"}
 */
function resolveMercadoPagoEnvironment(accessToken) {
  if (accessToken.startsWith("TEST-")) {
    return "sandbox";
  }

  return "production";
}

/**
 * Valida o access token contra a API do Mercado Pago.
 *
 * @param {string} accessToken
 * @returns {Promise<{ connected: true, environment: "sandbox" | "production" }>}
 */
async function validateMercadoPagoConnection(accessToken) {
  const response = await fetch(`${MP_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = `Mercado Pago API returned ${response.status}`;
    throw new Error(message);
  }

  return {
    connected: true,
    environment: resolveMercadoPagoEnvironment(accessToken),
  };
}

module.exports = {
  MP_API_BASE,
  mpAccessToken,
  resolveMercadoPagoEnvironment,
  validateMercadoPagoConnection,
};
