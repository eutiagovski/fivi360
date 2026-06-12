const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { mpAccessToken } = require("./mercadoPago/client");
const { createMercadoPagoPreapprovalPlan } = require("./mercadoPago/plan");

/** URL aceita pelo MP para criação de planos em diagnóstico (preview channels podem ser rejeitados). */
const DIAGNOSTIC_PLAN_BACK_URL = "https://www.mercadopago.com.br";

/**
 * Diagnóstico: cria plano de assinatura recorrente no mesmo ambiente do token.
 */
exports.createMercadoPagoPlan = onCall(
  {
    region: "southamerica-east1",
    secrets: [mpAccessToken],
  },
  async (request) => {
    const name = typeof request.data?.name === "string" ? request.data.name.trim() : "";
    const amount = request.data?.amount;

    if (!name) {
      throw new HttpsError("invalid-argument", "name é obrigatório.");
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError("invalid-argument", "amount deve ser um número positivo.");
    }

    const accessToken = mpAccessToken.value()?.trim();

    if (!accessToken) {
      logger.warn("createMercadoPagoPlan: MP_ACCESS_TOKEN is not configured");
      throw new HttpsError("failed-precondition", "MP_ACCESS_TOKEN não configurado.");
    }

    try {
      const result = await createMercadoPagoPreapprovalPlan({
        accessToken,
        name,
        amount,
        backUrl: DIAGNOSTIC_PLAN_BACK_URL,
      });

      logger.info("createMercadoPagoPlan: plan created", {
        planId: result.planId,
        collectorId:
          result.rawResponse &&
          typeof result.rawResponse === "object" &&
          "collector_id" in result.rawResponse
            ? result.rawResponse.collector_id
            : undefined,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("createMercadoPagoPlan: API failed", { error: message });
      throw new HttpsError("internal", message);
    }
  },
);
