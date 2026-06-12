const { resolveMercadoPagoEnvironment } = require("./client");
const { mercadoPagoApiRequest } = require("./preapproval");

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/**
 * Consulta GET /users/me e normaliza dados da conta Mercado Pago.
 *
 * @param {string} accessToken
 * @returns {Promise<{
 *   accountId: string,
 *   nickname: string,
 *   email: string,
 *   country: string,
 *   site: string,
 *   isTestAccount: boolean,
 *   environment: "sandbox" | "production",
 * }>}
 */
async function fetchMercadoPagoAccountInfo(accessToken) {
  const response = await mercadoPagoApiRequest(accessToken, "/users/me");
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Mercado Pago API returned ${response.status}`;
    throw new Error(message);
  }

  return {
    accountId: asString(payload.id),
    nickname: asString(payload.nickname),
    email: asString(payload.email),
    country: asString(payload.country_id),
    site: asString(payload.site_id),
    isTestAccount: Boolean(payload.is_test_user),
    environment: resolveMercadoPagoEnvironment(accessToken),
  };
}

module.exports = {
  fetchMercadoPagoAccountInfo,
};
