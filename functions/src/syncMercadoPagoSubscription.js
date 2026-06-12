const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { mpAccessToken } = require("./mercadoPago/client");
const { processMercadoPagoEvent } = require("./mercadoPago/processEvent");

const IS_DEVELOPMENT =
  process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV !== "production";

if (getApps().length === 0) {
  initializeApp();
}

/**
 * @param {import("firebase-functions/v2/https").CallableRequest} request
 * @returns {boolean}
 */
function isAdminUser(request) {
  return request.auth?.token?.admin === true;
}

/**
 * @param {import("firebase-functions/v2/https").CallableRequest} request
 */
function assertSyncAllowed(request) {
  if (IS_DEVELOPMENT || isAdminUser(request)) {
    return;
  }

  throw new HttpsError(
    "permission-denied",
    "syncMercadoPagoSubscription só está disponível em development/emulator ou para admin.",
  );
}

/**
 * @param {string} preapprovalId
 */
function buildPreapprovalEvent(preapprovalId) {
  return {
    type: "subscription_preapproval",
    entity: "preapproval",
    action: "updated",
    data: { id: preapprovalId },
  };
}

/**
 * @param {string} paymentId
 */
function buildPaymentEvent(paymentId) {
  return {
    type: "payment",
    action: "payment.updated",
    data: { id: paymentId },
  };
}

/**
 * Sincronização manual de assinatura/pagamento Mercado Pago (dev/emulator).
 */
exports.syncMercadoPagoSubscription = onCall(
  {
    region: "southamerica-east1",
    secrets: [mpAccessToken, "MP_PLAN_PROFESSIONAL", "MP_PLAN_ENTERPRISE"],
  },
  async (request) => {
    assertSyncAllowed(request);

    const preapprovalId =
      typeof request.data?.preapprovalId === "string"
        ? request.data.preapprovalId.trim()
        : "";
    const paymentId =
      typeof request.data?.paymentId === "string" ? request.data.paymentId.trim() : "";

    if (!preapprovalId && !paymentId) {
      throw new HttpsError(
        "invalid-argument",
        "Informe preapprovalId e/ou paymentId para sincronizar.",
      );
    }

    const db = getFirestore();
    const accessToken = mpAccessToken.value()?.trim() ?? "";
    const results = [];

    if (preapprovalId) {
      const result = await processMercadoPagoEvent({
        db,
        accessToken,
        body: buildPreapprovalEvent(preapprovalId),
        source: "sync",
      });
      results.push({ kind: "preapproval", resourceId: preapprovalId, ...result });
    }

    if (paymentId) {
      const result = await processMercadoPagoEvent({
        db,
        accessToken,
        body: buildPaymentEvent(paymentId),
        source: "sync",
      });
      results.push({ kind: "payment", resourceId: paymentId, ...result });
    }

    logger.info("syncMercadoPagoSubscription: completed", {
      preapprovalId: preapprovalId || null,
      paymentId: paymentId || null,
      results: results.map(({ kind, status, resolvedUserId }) => ({
        kind,
        status,
        resolvedUserId,
      })),
    });

    return {
      ok: results.every((result) => result.status !== "failed"),
      results,
    };
  },
);
