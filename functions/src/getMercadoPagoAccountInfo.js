const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { mpAccessToken } = require("./mercadoPago/client");
const { fetchMercadoPagoAccountInfo } = require("./mercadoPago/account");

/**
 * Diagnóstico: identifica qual conta Mercado Pago está associada ao MP_ACCESS_TOKEN.
 */
exports.getMercadoPagoAccountInfo = onCall(
  {
    region: "southamerica-east1",
    secrets: [mpAccessToken],
  },
  async () => {
    const accessToken = mpAccessToken.value()?.trim();

    if (!accessToken) {
      logger.warn("getMercadoPagoAccountInfo: MP_ACCESS_TOKEN is not configured");
      throw new HttpsError("failed-precondition", "MP_ACCESS_TOKEN não configurado.");
    }

    try {
      const accountInfo = await fetchMercadoPagoAccountInfo(accessToken);
      logger.info("getMercadoPagoAccountInfo: account resolved", {
        accountId: accountInfo.accountId,
        environment: accountInfo.environment,
        isTestAccount: accountInfo.isTestAccount,
      });
      return accountInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("getMercadoPagoAccountInfo: API failed", { error: message });
      throw new HttpsError("internal", message);
    }
  },
);
