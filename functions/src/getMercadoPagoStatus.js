const { onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { mpAccessToken, validateMercadoPagoConnection } = require("./mercadoPago/client");

/**
 * Valida a conexão com a API do Mercado Pago usando MP_ACCESS_TOKEN.
 */
exports.getMercadoPagoStatus = onCall(
  {
    region: "southamerica-east1",
    secrets: [mpAccessToken],
  },
  async () => {
    const accessToken = mpAccessToken.value();

    if (!accessToken?.trim()) {
      logger.warn("getMercadoPagoStatus: MP_ACCESS_TOKEN is not configured");
      return { connected: false };
    }

    try {
      const status = await validateMercadoPagoConnection(accessToken);
      logger.info("getMercadoPagoStatus: connection validated", {
        environment: status.environment,
      });
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("getMercadoPagoStatus: connection failed", { error: message });
      return { connected: false };
    }
  },
);
