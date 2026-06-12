const crypto = require("crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const {
  ACTIVE_SUBSCRIPTION_STATUSES,
  getMercadoPagoPlanConfigError,
  isBillingUpgradePlanId,
  requireMercadoPagoPlanId,
} = require("./config/billing");
const { mpAccessToken } = require("./mercadoPago/client");
const {
  CheckoutDiagnosticError,
  diagnoseCheckoutOrigin,
} = require("./mercadoPago/checkoutDiagnostics");

const MERCADO_PAGO_CHECKOUT_BASE_URL =
  "https://www.mercadopago.com.br/subscriptions/checkout";

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Inicia checkout hospedado pelo Mercado Pago (init_point do plano).
 * Não cria assinatura via POST /preapproval — webhook atualiza billing.
 */
exports.createSubscriptionCheckout = onCall(
  {
    region: "southamerica-east1",
    secrets: [mpAccessToken, "MP_PLAN_PROFESSIONAL", "MP_PLAN_ENTERPRISE"],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Login necessário para assinar um plano.");
    }

    const planId = request.data?.planId;

    if (!isBillingUpgradePlanId(planId)) {
      throw new HttpsError(
        "invalid-argument",
        "Plano inválido. Use professional ou enterprise.",
      );
    }

    const mpPlanConfigError = getMercadoPagoPlanConfigError(planId);

    if (mpPlanConfigError) {
      logger.error("createSubscriptionCheckout: Mercado Pago plan ID missing", {
        planId,
        error: mpPlanConfigError,
      });
      throw new HttpsError("failed-precondition", mpPlanConfigError);
    }

    const userId = request.auth.uid;
    const db = getFirestore();
    const subscriptionDoc = await db.collection("subscriptions").doc(userId).get();

    if (subscriptionDoc.exists) {
      const status = subscriptionDoc.data()?.status;

      if (typeof status === "string" && ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
        throw new HttpsError(
          "failed-precondition",
          "Você já possui uma assinatura ativa.",
        );
      }
    }

    const mpPlanId = requireMercadoPagoPlanId(planId);
    const checkoutUrl = `${MERCADO_PAGO_CHECKOUT_BASE_URL}?preapproval_plan_id=${encodeURIComponent(mpPlanId)}`;

    const accessToken = mpAccessToken.value()?.trim();

    if (!accessToken) {
      logger.warn("createSubscriptionCheckout: MP_ACCESS_TOKEN is not configured");
      throw new HttpsError(
        "failed-precondition",
        "MP_ACCESS_TOKEN não configurado para diagnóstico de checkout.",
      );
    }

    const payerEmail =
      typeof request.auth.token?.email === "string" ? request.auth.token.email : "";

    try {
      await diagnoseCheckoutOrigin({
        accessToken,
        mpPlanId,
        planId,
        checkoutUrl,
        payerEmail,
      });
    } catch (err) {
      if (err instanceof CheckoutDiagnosticError) {
        logger.error("createSubscriptionCheckout: checkout diagnostic failed", {
          planId,
          mpPlanId,
          error: err.message,
        });
        throw new HttpsError("failed-precondition", err.message);
      }

      const message = err instanceof Error ? err.message : String(err);
      logger.error("createSubscriptionCheckout: Mercado Pago diagnostic API failed", {
        planId,
        mpPlanId,
        error: message,
      });
      throw new HttpsError("internal", message);
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    await db.collection("billingCheckoutSessions").doc(sessionId).set({
      sessionId,
      userId,
      email: payerEmail,
      planId,
      mpPlanId,
      provider: "mercado_pago",
      status: "created",
      checkoutUrl,
      completedAt: null,
      providerSubscriptionId: null,
      providerPaymentId: null,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("createSubscriptionCheckout: session created", {
      userId,
      planId,
      mpPlanId,
      sessionId,
    });

    return {
      sessionId,
      checkoutUrl,
    };
  },
);
