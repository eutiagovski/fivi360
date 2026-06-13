const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const Stripe = require("stripe");
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, getStripeClient } = require("./stripe/client");

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
 * @param {string | import("stripe").Stripe.Subscription | null | undefined} subscription
 * @returns {string | null}
 */
function getStripeSubscriptionId(subscription) {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

/**
 * @param {string | import("stripe").Stripe.Customer | null | undefined} customer
 * @returns {string | null}
 */
function getStripeCustomerId(customer) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

/**
 * @param {import("stripe").Stripe.Subscription | string | null | undefined} subscription
 * @returns {{ userId?: string, planId?: string }}
 */
function getSubscriptionMetadata(subscription) {
  if (!subscription || typeof subscription === "string") {
    return {};
  }

  const userId = subscription.metadata?.userId?.trim();
  const planId = subscription.metadata?.planId?.trim();

  return {
    ...(userId ? { userId } : {}),
    ...(planId ? { planId } : {}),
  };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string | null} subscriptionId
 * @param {string | null} customerId
 * @param {import("stripe").Stripe.Subscription | string | null | undefined} subscriptionRef
 * @returns {Promise<{ userId: string | null, planId: string | null }>}
 */
async function resolveInvoiceUserContext(db, subscriptionId, customerId, subscriptionRef) {
  const inlineMetadata = getSubscriptionMetadata(subscriptionRef);
  if (inlineMetadata.userId) {
    return {
      userId: inlineMetadata.userId,
      planId: inlineMetadata.planId || null,
    };
  }

  if (subscriptionId) {
    const subscriptionSnap = await db
      .collection("subscriptions")
      .where("providerSubscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      const subscriptionData = subscriptionDoc.data();

      return {
        userId: subscriptionDoc.id,
        planId:
          typeof subscriptionData.planId === "string" ? subscriptionData.planId : null,
      };
    }

    const stripe = getStripeClient();
    if (stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const metadata = getSubscriptionMetadata(stripeSubscription);

        if (metadata.userId) {
          return {
            userId: metadata.userId,
            planId: metadata.planId || null,
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn("stripeWebhook: failed to retrieve subscription metadata", {
          subscriptionId,
          error: message,
        });
      }
    }
  }

  if (customerId) {
    const userSnap = await db
      .collection("users")
      .where("billing.stripe.customerId", "==", customerId)
      .limit(1)
      .get();

    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();
      const planId =
        typeof userData.plan?.id === "string"
          ? userData.plan.id
          : typeof userData.plan === "string"
            ? userData.plan
            : null;

      return {
        userId: userDoc.id,
        planId,
      };
    }
  }

  return { userId: null, planId: inlineMetadata.planId || null };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Subscription} subscription
 * @returns {Promise<string | null>}
 */
async function resolveSubscriptionDeletedUserId(db, subscription) {
  const metadataUserId = subscription.metadata?.userId?.trim();
  if (metadataUserId) {
    return metadataUserId;
  }

  const subscriptionId = subscription.id;

  if (subscriptionId) {
    const subscriptionSnap = await db
      .collection("subscriptions")
      .where("providerSubscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (!subscriptionSnap.empty) {
      return subscriptionSnap.docs[0].id;
    }

    const userSnap = await db
      .collection("users")
      .where("billing.stripe.subscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (!userSnap.empty) {
      return userSnap.docs[0].id;
    }
  }

  return null;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Subscription} subscription
 *
 * Downgrade para Starter via `users.plan` apenas — nenhum dado (projetos, imagens,
 * hotspots, links, billing, invoices) é removido.
 */
async function handleSubscriptionDeleted(db, subscription) {
  const userId = await resolveSubscriptionDeletedUserId(db, subscription);

  if (!userId) {
    logger.warn("stripeWebhook: customer.subscription.deleted without resolvable userId", {
      subscriptionId: subscription.id,
      customerId: getStripeCustomerId(subscription.customer),
      metadata: subscription.metadata,
    });
    return;
  }

  const subscriptionRef = db.collection("subscriptions").doc(userId);
  const userRef = db.collection("users").doc(userId);

  const [subscriptionSnap, userSnap] = await Promise.all([
    subscriptionRef.get(),
    userRef.get(),
  ]);

  const existingSubscription = subscriptionSnap.data();
  const existingPlan = userSnap.data()?.plan;

  if (
    existingSubscription?.status === "canceled" &&
    existingPlan &&
    typeof existingPlan === "object" &&
    existingPlan.id === "starter" &&
    existingPlan.source === "system"
  ) {
    logger.info("stripeWebhook: customer.subscription.deleted already processed", {
      userId,
      subscriptionId: subscription.id,
    });
    return;
  }

  const canceledAt =
    toFirestoreTimestamp(subscription.canceled_at) ??
    toFirestoreTimestamp(subscription.ended_at) ??
    FieldValue.serverTimestamp();

  const updatedAt = FieldValue.serverTimestamp();

  await subscriptionRef.set(
    {
      status: "canceled",
      cancelAtPeriodEnd: false,
      canceledAt,
      updatedAt,
    },
    { merge: true },
  );

  await userRef.set(
    {
      plan: {
        id: "starter",
        status: "active",
        source: "system",
        cancelAtPeriodEnd: false,
        updatedAt,
      },
      updatedAt,
    },
    { merge: true },
  );

  logger.info("stripeWebhook: customer.subscription.deleted processed", {
    userId,
    subscriptionId: subscription.id,
  });
}

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
 * @param {import("stripe").Stripe.Invoice} invoice
 * @param {"paid" | "failed"} status
 * @returns {Promise<void>}
 */
async function upsertInvoiceDoc(db, invoice, status) {
  const providerInvoiceId = invoice.id;
  const providerSubscriptionId = getStripeSubscriptionId(invoice.subscription);
  const providerCustomerId = getStripeCustomerId(invoice.customer);
  const { userId, planId } = await resolveInvoiceUserContext(
    db,
    providerSubscriptionId,
    providerCustomerId,
    invoice.subscription,
  );

  const amount =
    status === "paid"
      ? invoice.amount_paid ?? invoice.total ?? null
      : invoice.amount_due ?? invoice.total ?? null;

  const invoiceRef = db.collection("invoices").doc(providerInvoiceId);
  const existingSnap = await invoiceRef.get();

  /** @type {Record<string, unknown>} */
  const payload = {
    userId,
    provider: "stripe",
    providerInvoiceId,
    providerSubscriptionId,
    providerCustomerId,
    planId,
    status,
    amount,
    currency: invoice.currency ?? null,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === "paid") {
    payload.paidAt =
      toFirestoreTimestamp(invoice.status_transitions?.paid_at) ??
      FieldValue.serverTimestamp();
  } else {
    payload.failedAt = FieldValue.serverTimestamp();
  }

  if (!existingSnap.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }

  await invoiceRef.set(payload, { merge: true });

  if (!userId) {
    logger.warn("stripeWebhook: invoice persisted without userId", {
      providerInvoiceId,
      status,
      providerSubscriptionId,
      providerCustomerId,
    });
  }

  logger.info("stripeWebhook: invoice persisted", {
    providerInvoiceId,
    status,
    userId,
    planId,
  });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 */
async function handleInvoicePaid(db, invoice) {
  await upsertInvoiceDoc(db, invoice, "paid");
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 */
async function handleInvoicePaymentFailed(db, invoice) {
  await upsertInvoiceDoc(db, invoice, "failed");
}

const HANDLED_STRIPE_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

/**
 * Webhook público Stripe — checkout, assinatura encerrada, invoice.paid e invoice.payment_failed.
 */
exports.stripeWebhook = onRequest(
  {
    region: "southamerica-east1",
    secrets: [STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY],
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

    if (!HANDLED_STRIPE_EVENTS.has(event.type)) {
      logger.info("stripeWebhook: event ignored", { type: event.type });
      res.status(200).json({ received: true, ignored: true });
      return;
    }

    const db = getFirestore();

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(
            db,
            /** @type {import("stripe").Stripe.Checkout.Session} */ (event.data.object),
          );
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(
            db,
            /** @type {import("stripe").Stripe.Subscription} */ (event.data.object),
          );
          break;
        case "invoice.paid":
          await handleInvoicePaid(
            db,
            /** @type {import("stripe").Stripe.Invoice} */ (event.data.object),
          );
          break;
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(
            db,
            /** @type {import("stripe").Stripe.Invoice} */ (event.data.object),
          );
          break;
        default:
          break;
      }

      res.status(200).json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("stripeWebhook: handler failed", { type: event.type, error: message });
      res.status(500).send("Webhook handler failed");
    }
  },
);
