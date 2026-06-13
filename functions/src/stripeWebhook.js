const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const Stripe = require("stripe");
const { STRIPE_WEBHOOK_SECRET } = require("./stripe/client");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * @param {import("stripe").Stripe.Checkout.Session} session
 * @returns {{ userId: string, planId: string, customerId: string, subscriptionId: string } | null}
 */
function extractCheckoutSessionData(session) {
  const userId = session.metadata?.userId?.trim();
  const planId = session.metadata?.planId?.trim();

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!userId || !planId || !customerId || !subscriptionId) {
    return null;
  }

  return { userId, planId, customerId, subscriptionId };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 * @param {{
 *   planId: string,
 *   customerId: string,
 *   subscriptionId: string,
 * }} data
 */
async function updateUserAfterCheckout(db, uid, { planId, customerId, subscriptionId }) {
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        plan: {
          id: planId,
          status: "active",
          source: "stripe",
          updatedAt: FieldValue.serverTimestamp(),
        },
        billing: {
          provider: "stripe",
          stripe: {
            customerId,
            subscriptionId,
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 * @param {{
 *   planId: string,
 *   customerId: string,
 *   subscriptionId: string,
 * }} data
 */
async function upsertSubscriptionDoc(db, uid, { planId, customerId, subscriptionId }) {
  await db
    .collection("subscriptions")
    .doc(uid)
    .set(
      {
        provider: "stripe",
        planId,
        status: "active",
        providerCustomerId: customerId,
        providerSubscriptionId: subscriptionId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Checkout.Session} session
 */
async function handleCheckoutSessionCompleted(db, session) {
  const data = extractCheckoutSessionData(session);

  if (!data) {
    logger.warn("stripeWebhook: checkout.session.completed missing required fields", {
      sessionId: session.id,
      metadata: session.metadata,
      customer: session.customer,
      subscription: session.subscription,
    });
    return;
  }

  const { userId, planId, customerId, subscriptionId } = data;

  await updateUserAfterCheckout(db, userId, { planId, customerId, subscriptionId });
  await upsertSubscriptionDoc(db, userId, { planId, customerId, subscriptionId });

  logger.info("stripeWebhook: checkout.session.completed processed", {
    userId,
    planId,
    sessionId: session.id,
    customerId,
    subscriptionId,
  });
}

/**
 * Webhook público Stripe — Sprint 4A: apenas checkout.session.completed.
 */
exports.stripeWebhook = onRequest(
  {
    region: "southamerica-east1",
    secrets: [STRIPE_WEBHOOK_SECRET],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const webhookSecret = STRIPE_WEBHOOK_SECRET.value();
    if (!webhookSecret) {
      logger.error("stripeWebhook: STRIPE_WEBHOOK_SECRET not configured");
      res.status(500).send("Stripe webhook not configured");
      return;
    }

    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      logger.error("stripeWebhook: raw body unavailable");
      res.status(400).send("Webhook Error: raw body required");
      return;
    }

    /** @type {import("stripe").Stripe.Event} */
    let event;

    try {
      event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("stripeWebhook: signature verification failed", { error: message });
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    if (event.type !== "checkout.session.completed") {
      logger.info("stripeWebhook: event ignored", { type: event.type });
      res.status(200).json({ received: true, ignored: true });
      return;
    }

    const db = getFirestore();

    try {
      await handleCheckoutSessionCompleted(
        db,
        /** @type {import("stripe").Stripe.Checkout.Session} */ (event.data.object),
      );

      res.status(200).json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("stripeWebhook: handler failed", { type: event.type, error: message });
      res.status(500).send("Webhook handler failed");
    }
  },
);
