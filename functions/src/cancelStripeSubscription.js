const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { STRIPE_SECRET_KEY, getStripeClient } = require("./stripe/client");
const { EMAIL_TYPES } = require("./config/email");
const { resolveUserEmail } = require("./email/sendBillingEmail");

if (getApps().length === 0) {
  initializeApp();
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/**
 * @param {number | null | undefined} unixSeconds
 * @returns {FirebaseFirestore.Timestamp | null}
 */
function toFirestoreTimestamp(unixSeconds) {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) {
    return null;
  }

  return new Timestamp(unixSeconds, 0);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string | null,
 *   providerSubscriptionId: string,
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 * }} params
 */
async function enqueueSubscriptionCancellationScheduledEmail(db, {
  userId,
  planId,
  providerSubscriptionId,
  currentPeriodEnd,
}) {
  if (!userId) {
    logger.warn("cancelStripeSubscription: cancellation scheduled email skipped — no userId", {
      providerSubscriptionId,
    });
    return;
  }

  const emailId = `subscription_cancellation_scheduled_${providerSubscriptionId}`;
  const emailRef = db.collection("emailQueue").doc(emailId);
  const existingSnap = await emailRef.get();

  if (existingSnap.exists) {
    logger.info("cancelStripeSubscription: cancellation scheduled email already queued", {
      emailId,
      providerSubscriptionId,
      userId,
    });
    return;
  }

  const to = await resolveUserEmail(db, userId);

  if (!to) {
    logger.warn("cancelStripeSubscription: cancellation scheduled email skipped — no recipient", {
      userId,
      providerSubscriptionId,
    });
    return;
  }

  await emailRef.set({
    type: EMAIL_TYPES.SUBSCRIPTION_CANCELLATION_SCHEDULED,
    to,
    userId,
    status: "pending",
    payload: {
      userId,
      planId,
      providerSubscriptionId,
      currentPeriodEnd,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("cancelStripeSubscription: cancellation scheduled email enqueued", {
    emailId,
    providerSubscriptionId,
    userId,
  });
}

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
      const stripeSubscription = await stripe.subscriptions.update(providerSubscriptionId, {
        cancel_at_period_end: true,
      });

      if (stripeSubscription.cancel_at_period_end !== true) {
        logger.warn("cancelStripeSubscription: Stripe did not confirm cancel_at_period_end", {
          uid,
          providerSubscriptionId,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        });
        throw new HttpsError("internal", "Não foi possível cancelar a assinatura.");
      }

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

      const planId =
        typeof subscriptionData.planId === "string" ? subscriptionData.planId : null;

      const currentPeriodEnd =
        toFirestoreTimestamp(stripeSubscription.current_period_end) ??
        (subscriptionData.currentPeriodEnd instanceof Timestamp
          ? subscriptionData.currentPeriodEnd
          : null);

      try {
        await enqueueSubscriptionCancellationScheduledEmail(db, {
          userId: uid,
          planId,
          providerSubscriptionId,
          currentPeriodEnd,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("cancelStripeSubscription: cancellation scheduled email enqueue failed", {
          uid,
          providerSubscriptionId,
          error: message,
        });
      }

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
