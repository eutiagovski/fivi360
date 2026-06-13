const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { STRIPE_SECRET_KEY, getStripeClient } = require("./stripe/client");

if (getApps().length === 0) {
  initializeApp();
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/**
 * Agenda cancelamento da assinatura Stripe ao fim do período atual (callable, autenticada).
 */
exports.cancelStripeSubscription = onCall(
  {
    region: "southamerica-east1",
    secrets: [STRIPE_SECRET_KEY],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Autenticação obrigatória.");
    }

    const uid = request.auth.uid;

    const stripe = getStripeClient();
    if (!stripe) {
      throw new HttpsError("failed-precondition", "Stripe não configurado.");
    }

    const db = getFirestore();
    const subscriptionRef = db.collection("subscriptions").doc(uid);
    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists) {
      throw new HttpsError("not-found", "Assinatura não encontrada.");
    }

    const subscriptionData = subscriptionSnap.data() ?? {};

    if (subscriptionData.provider !== "stripe") {
      throw new HttpsError("failed-precondition", "Assinatura não é Stripe.");
    }

    const providerSubscriptionId = subscriptionData.providerSubscriptionId;
    if (typeof providerSubscriptionId !== "string" || !providerSubscriptionId) {
      throw new HttpsError("failed-precondition", "Assinatura Stripe inválida.");
    }

    const status =
      typeof subscriptionData.status === "string"
        ? subscriptionData.status.toLowerCase().trim()
        : "";

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
      throw new HttpsError("failed-precondition", "Assinatura não está ativa.");
    }

    if (subscriptionData.cancelAtPeriodEnd === true) {
      throw new HttpsError("failed-precondition", "Cancelamento já agendado.");
    }

    try {
      await stripe.subscriptions.update(providerSubscriptionId, {
        cancel_at_period_end: true,
      });

      const updatedAt = FieldValue.serverTimestamp();

      await subscriptionRef.update({
        status: "active",
        cancelAtPeriodEnd: true,
        canceledAt: null,
        updatedAt,
      });

      await db.collection("users").doc(uid).update({
        "plan.status": "active",
        "plan.cancelAtPeriodEnd": true,
        "plan.updatedAt": updatedAt,
      });

      logger.info("cancelStripeSubscription: cancellation scheduled", {
        uid,
        providerSubscriptionId,
      });

      return { ok: true };
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);
      logger.error("cancelStripeSubscription: failed", { uid, error: message });
      throw new HttpsError("internal", "Não foi possível cancelar a assinatura.");
    }
  },
);
