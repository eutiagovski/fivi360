const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const Stripe = require("stripe");
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, getStripeClient } = require("./stripe/client");
const { resolvePlanIdFromStripePriceId } = require("./config/stripeBilling");
const { createGetPlanIdFromInvoiceLines } = require("./billing/resolvePlanFromInvoiceLines");
const { EMAIL_TYPES } = require("./config/email");
const { resolveUserEmail } = require("./email/sendBillingEmail");

if (getApps().length === 0) {
  initializeApp();
}

const PUBLIC_PORTFOLIO_PLAN_IDS = new Set(["professional", "studio", "enterprise"]);
const getPlanIdFromInvoiceLines = createGetPlanIdFromInvoiceLines(resolvePlanIdFromStripePriceId);

/**
 * @param {unknown} plan
 * @returns {"starter" | "professional" | "studio" | "enterprise"}
 */
function normalizePlanId(plan) {
  if (typeof plan === "string") {
    const key = plan.toLowerCase().trim();
    if (key === "professional" || key === "studio" || key === "enterprise") {
      return key;
    }
    return "starter";
  }

  if (plan && typeof plan === "object" && typeof plan.id === "string") {
    const status = typeof plan.status === "string" ? plan.status.toLowerCase().trim() : "";

    if (status && status !== "active" && status !== "trialing") {
      return "starter";
    }

    const id = plan.id.toLowerCase().trim();
    if (id === "professional" || id === "studio" || id === "enterprise") {
      return id;
    }
  }

  return "starter";
}

/**
 * @param {boolean | undefined} portfolioEnabled
 * @param {unknown} plan
 * @returns {boolean}
 */
function computePortfolioAvailable(portfolioEnabled, plan) {
  if (portfolioEnabled !== true) {
    return false;
  }

  return PUBLIC_PORTFOLIO_PLAN_IDS.has(normalizePlanId(plan));
}

/**
 * Recalcula `publicProfiles/{uid}.portfolioAvailable` após mudança de plano.
 * Promote/demote via Admin SDK (rules bloqueiam promote pelo cliente — RC-P0.5).
 * Settings também chama a callable `syncPublicPortfolioAvailability` ao ativar o portfólio.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 */
async function syncPublicProfilePortfolioAvailable(db, uid) {
  const [userSnap, profileSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("publicProfiles").doc(uid).get(),
  ]);

  if (!profileSnap.exists) {
    return;
  }

  const portfolioEnabled = profileSnap.data()?.portfolioEnabled === true;
  const portfolioAvailable = computePortfolioAvailable(portfolioEnabled, userSnap.data()?.plan);

  await db.collection("publicProfiles").doc(uid).set(
    {
      portfolioAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
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
 * @param {string} subscriptionId
 * @returns {Promise<{
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 *   cancelAtPeriodEnd: boolean,
 * }>}
 */
async function fetchSubscriptionPeriodFields(subscriptionId) {
  const stripe = getStripeClient();
  if (!stripe || !subscriptionId) {
    return { currentPeriodEnd: null, nextBillingAt: null, cancelAtPeriodEnd: false };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPeriodEnd = toFirestoreTimestamp(subscription.current_period_end);

    return {
      currentPeriodEnd,
      nextBillingAt: currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("stripeWebhook: failed to retrieve subscription period fields", {
      subscriptionId,
      error: message,
    });
    return { currentPeriodEnd: null, nextBillingAt: null, cancelAtPeriodEnd: false };
  }
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 * @param {{
 *   planId: string,
 *   customerId: string,
 *   subscriptionId: string,
 *   currentPeriodEnd?: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt?: FirebaseFirestore.Timestamp | null,
 *   cancelAtPeriodEnd?: boolean,
 * }} data
 */
async function upsertSubscriptionDoc(
  db,
  uid,
  { planId, customerId, subscriptionId, currentPeriodEnd, nextBillingAt, cancelAtPeriodEnd },
) {
  /** @type {Record<string, unknown>} */
  const payload = {
    provider: "stripe",
    planId,
    status: "active",
    providerCustomerId: customerId,
    providerSubscriptionId: subscriptionId,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (currentPeriodEnd) {
    payload.currentPeriodEnd = currentPeriodEnd;
  }

  if (nextBillingAt) {
    payload.nextBillingAt = nextBillingAt;
  }

  if (typeof cancelAtPeriodEnd === "boolean") {
    payload.cancelAtPeriodEnd = cancelAtPeriodEnd;
  }

  await db.collection("subscriptions").doc(uid).set(payload, { merge: true });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Checkout.Session} session
 */
async function handleCheckoutSessionCompleted(db, session) {
  let resolvedSession = session;
  const stripe = getStripeClient();

  if (stripe && session.id && (!session.subscription || !session.customer)) {
    try {
      resolvedSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["subscription", "customer"],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("stripeWebhook: failed to expand checkout session", {
        sessionId: session.id,
        error: message,
      });
    }
  }

  const data = extractCheckoutSessionData(resolvedSession);

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
  const periodFields = await fetchSubscriptionPeriodFields(subscriptionId);

  await updateUserAfterCheckout(db, userId, { planId, customerId, subscriptionId });
  await upsertSubscriptionDoc(db, userId, {
    planId,
    customerId,
    subscriptionId,
    ...periodFields,
  });
  await syncPublicProfilePortfolioAvailable(db, userId);

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
 * Stripe API 2025+ moveu a referência da assinatura para `invoice.parent`.
 *
 * @param {import("stripe").Stripe.Invoice} invoice
 * @returns {string | null}
 */
function getInvoiceSubscriptionId(invoice) {
  const legacySubscriptionId = getStripeSubscriptionId(invoice.subscription);
  if (legacySubscriptionId) {
    return legacySubscriptionId;
  }

  const parent = invoice.parent;
  if (parent?.type === "subscription_details") {
    const parentSubscription = parent.subscription_details?.subscription;
    const parentSubscriptionId = getStripeSubscriptionId(parentSubscription);
    if (parentSubscriptionId) {
      return parentSubscriptionId;
    }
  }

  const lines = invoice.lines?.data;
  if (Array.isArray(lines)) {
    for (const line of lines) {
      const lineParent = line.parent;
      if (lineParent?.type === "subscription_item_details") {
        const lineSubscriptionId = getStripeSubscriptionId(
          lineParent.subscription_item_details?.subscription,
        );
        if (lineSubscriptionId) {
          return lineSubscriptionId;
        }
      }

      const legacyLineSubscriptionId = getStripeSubscriptionId(line.subscription);
      if (legacyLineSubscriptionId) {
        return legacyLineSubscriptionId;
      }
    }
  }

  return null;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} customerId
 * @returns {Promise<string | null>}
 */
async function resolveUserIdByStripeCustomerId(db, customerId) {
  if (!customerId) {
    return null;
  }

  for (const fieldPath of ["billing.stripe.customerId", "billing.stripeCustomerId"]) {
    const userSnap = await db.collection("users").where(fieldPath, "==", customerId).limit(1).get();

    if (!userSnap.empty) {
      return userSnap.docs[0].id;
    }
  }

  return null;
}

/**
 * Sempre busca a subscription na API — não confiar no objeto expandido do invoice.
 *
 * @param {string | null} subscriptionId
 * @returns {Promise<import("stripe").Stripe.Subscription | null>}
 */
async function fetchStripeSubscriptionById(subscriptionId) {
  if (!subscriptionId) {
    return null;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("stripeWebhook: failed to retrieve subscription", {
      subscriptionId,
      error: message,
    });
    return null;
  }
}

/**
 * @param {import("stripe").Stripe.Subscription | null | undefined} stripeSubscription
 * @returns {{
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 *   cancelAtPeriodEnd: boolean,
 * }}
 */
function extractSubscriptionPeriodFields(stripeSubscription) {
  if (!stripeSubscription) {
    return { currentPeriodEnd: null, nextBillingAt: null, cancelAtPeriodEnd: false };
  }

  const currentPeriodEnd = toFirestoreTimestamp(stripeSubscription.current_period_end);

  return {
    currentPeriodEnd,
    nextBillingAt: currentPeriodEnd,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end === true,
  };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 * @returns {Promise<{
 *   userId: string | null,
 *   planId: string,
 *   planIdSource: string,
 *   subscriptionId: string | null,
 *   customerId: string | null,
 *   subscriptionMetadata: Record<string, string>,
 *   firestoreSubscriptionPlanId: string | null,
 *   userPlanFallback: string | null,
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 *   cancelAtPeriodEnd: boolean,
 * }>}
 */
async function resolveInvoicePaidContext(db, invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getStripeCustomerId(invoice.customer);
  const stripeSubscription = await fetchStripeSubscriptionById(subscriptionId);
  const subscriptionMetadata = stripeSubscription?.metadata ?? {};
  const subscriptionMetaUserId =
    typeof subscriptionMetadata.userId === "string" ? subscriptionMetadata.userId.trim() : "";
  const subscriptionMetaPlanId =
    typeof subscriptionMetadata.planId === "string" ? subscriptionMetadata.planId.trim() : "";

  let userId = subscriptionMetaUserId || null;
  let planId = subscriptionMetaPlanId || null;
  let planIdSource = planId ? "stripe_subscription_metadata" : "unresolved";
  let firestoreSubscriptionPlanId = null;
  let userPlanFallback = null;

  const periodFields = extractSubscriptionPeriodFields(stripeSubscription);

  if (!userId && subscriptionId) {
    const subscriptionSnap = await db
      .collection("subscriptions")
      .where("providerSubscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (!subscriptionSnap.empty) {
      userId = subscriptionSnap.docs[0].id;
    }
  }

  if (!userId && customerId) {
    userId = await resolveUserIdByStripeCustomerId(db, customerId);
  }

  if (!planId) {
    const linePlan = getPlanIdFromInvoiceLines(invoice);
    if (linePlan.planId) {
      planId = linePlan.planId;
      planIdSource = linePlan.source || "invoice_line";
    }
  }

  if (!planId && stripeSubscription?.items?.data?.length) {
    for (const item of stripeSubscription.items.data) {
      const priceRef = item.price;
      const stripePriceId =
        typeof priceRef === "string" ? priceRef : priceRef?.id ?? null;
      const fromSubscriptionPrice = resolvePlanIdFromStripePriceId(stripePriceId);

      if (fromSubscriptionPrice) {
        planId = fromSubscriptionPrice;
        planIdSource = "stripe_subscription_item_price_id";
        break;
      }
    }
  }

  if (!planId && userId) {
    const subscriptionSnap = await db.collection("subscriptions").doc(userId).get();
    if (subscriptionSnap.exists) {
      const rawPlanId = subscriptionSnap.data()?.planId;
      firestoreSubscriptionPlanId =
        typeof rawPlanId === "string" && rawPlanId.trim() ? rawPlanId.trim() : null;

      if (firestoreSubscriptionPlanId) {
        planId = firestoreSubscriptionPlanId;
        planIdSource = "firestore_subscriptions";
      }
    }
  }

  if (!planId && subscriptionId) {
    const subscriptionSnap = await db
      .collection("subscriptions")
      .where("providerSubscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (!subscriptionSnap.empty) {
      const rawPlanId = subscriptionSnap.docs[0].data()?.planId;
      firestoreSubscriptionPlanId =
        typeof rawPlanId === "string" && rawPlanId.trim() ? rawPlanId.trim() : null;

      if (firestoreSubscriptionPlanId) {
        planId = firestoreSubscriptionPlanId;
        planIdSource = "firestore_subscriptions_query";
      }
    }
  }

  if (!planId && userId) {
    const userSnap = await db.collection("users").doc(userId).get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      userPlanFallback =
        typeof userData?.plan?.id === "string"
          ? userData.plan.id.trim()
          : typeof userData?.plan === "string"
            ? userData.plan.trim()
            : null;

      if (userPlanFallback) {
        planId = userPlanFallback;
        planIdSource = "users_plan_fallback";
      }
    }
  }

  if (!planId) {
    planId = "starter";
    planIdSource = "default_starter";
  }

  logger.info("stripeWebhook: invoice.paid context resolved", {
    invoiceId: invoice.id,
    invoiceCustomer: invoice.customer,
    invoiceSubscription: invoice.subscription,
    invoiceParentType: invoice.parent?.type ?? null,
    invoiceParentSubscription: invoice.parent?.subscription_details?.subscription ?? null,
    resolvedSubscriptionId: subscriptionId,
    resolvedUserId: userId,
    resolvedPlanId: planId,
    planIdSource,
    subscriptionMetadata,
    firestoreSubscriptionPlanId,
    userPlanFallback,
    currentPeriodEnd: periodFields.currentPeriodEnd?.seconds ?? null,
    nextBillingAt: periodFields.nextBillingAt?.seconds ?? null,
  });

  return {
    userId,
    planId,
    planIdSource,
    subscriptionId,
    customerId,
    subscriptionMetadata,
    firestoreSubscriptionPlanId,
    userPlanFallback,
    ...periodFields,
  };
}

/**
 * @param {import("stripe").Stripe.Invoice} invoice
 * @returns {Promise<import("stripe").Stripe.Invoice>}
 */
async function expandStripeInvoice(invoice) {
  const stripe = getStripeClient();
  if (!stripe || !invoice?.id) {
    return invoice;
  }

  try {
    return await stripe.invoices.retrieve(invoice.id, {
      expand: [
        "subscription",
        "parent.subscription_details.subscription",
        "lines.data.price",
        "lines.data.pricing.price_details.price",
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("stripeWebhook: failed to expand invoice", {
      providerInvoiceId: invoice.id,
      error: message,
    });
    return invoice;
  }
}

/**
 * Wrapper legado usado por invoice.payment_failed.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 * @returns {Promise<{ userId: string | null, planId: string }>}
 */
async function resolveInvoiceUserContext(db, invoice) {
  const context = await resolveInvoicePaidContext(db, invoice);
  return {
    userId: context.userId,
    planId: context.planId,
  };
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

  await syncPublicProfilePortfolioAvailable(db, userId);

  logger.info("stripeWebhook: customer.subscription.deleted processed", {
    userId,
    subscriptionId: subscription.id,
  });

  try {
    await enqueueSubscriptionCanceledEmail(db, {
      userId,
      planIdAnterior: resolvePreviousPlanId(existingSubscription, existingPlan),
      providerSubscriptionId: subscription.id,
      canceledAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("stripeWebhook: subscription canceled email enqueue failed", {
      userId,
      subscriptionId: subscription.id,
      error: message,
    });
  }
}

/**
 * @param {Record<string, unknown> | undefined} existingSubscription
 * @param {unknown} existingPlan
 * @returns {string | null}
 */
function resolvePreviousPlanId(existingSubscription, existingPlan) {
  if (typeof existingSubscription?.planId === "string") {
    return existingSubscription.planId;
  }

  if (existingPlan && typeof existingPlan === "object" && typeof existingPlan.id === "string") {
    return existingPlan.id;
  }

  if (typeof existingPlan === "string") {
    return existingPlan;
  }

  return null;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planIdAnterior: string | null,
 *   providerSubscriptionId: string,
 *   canceledAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue,
 * }} params
 */
async function enqueueSubscriptionCanceledEmail(db, {
  userId,
  planIdAnterior,
  providerSubscriptionId,
  canceledAt,
}) {
  const emailId = `subscription_canceled_${providerSubscriptionId}`;
  const emailRef = db.collection("emailQueue").doc(emailId);
  const existingSnap = await emailRef.get();

  if (existingSnap.exists) {
    logger.info("stripeWebhook: subscription canceled email already queued", {
      emailId,
      providerSubscriptionId,
      userId,
    });
    return;
  }

  const to = await resolveUserEmail(db, userId);

  if (!to) {
    logger.warn("stripeWebhook: subscription canceled email skipped — no recipient", {
      userId,
      providerSubscriptionId,
    });
    return;
  }

  await emailRef.set({
    type: EMAIL_TYPES.SUBSCRIPTION_CANCELED,
    to,
    userId,
    status: "pending",
    payload: {
      userId,
      planIdAnterior,
      providerSubscriptionId,
      canceledAt,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("stripeWebhook: subscription canceled email enqueued", {
    emailId,
    providerSubscriptionId,
    userId,
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
 * @returns {Promise<{
 *   userId: string | null,
 *   planId: string | null,
 *   amount: number | null,
 *   currency: string | null,
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 * }>}
 */
async function upsertInvoiceDoc(db, invoice, status, billingContext = null) {
  const context =
    billingContext ?? (await resolveInvoicePaidContext(db, invoice));

  const providerInvoiceId = invoice.id;
  const providerSubscriptionId = context.subscriptionId ?? getInvoiceSubscriptionId(invoice);
  const providerCustomerId = context.customerId ?? getStripeCustomerId(invoice.customer);

  const amount =
    status === "paid"
      ? invoice.amount_paid ?? invoice.total ?? null
      : invoice.amount_due ?? invoice.total ?? null;

  const invoiceRef = db.collection("invoices").doc(providerInvoiceId);
  const existingSnap = await invoiceRef.get();

  /** @type {Record<string, unknown>} */
  const payload = {
    userId: context.userId,
    provider: "stripe",
    providerInvoiceId,
    providerSubscriptionId,
    providerCustomerId,
    planId: context.planId,
    status,
    amount,
    currency: invoice.currency ?? null,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (context.currentPeriodEnd) {
    payload.currentPeriodEnd = context.currentPeriodEnd;
  }

  if (context.nextBillingAt) {
    payload.nextBillingAt = context.nextBillingAt;
  }

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

  if (!context.userId) {
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
    userId: context.userId,
    planId: context.planId,
    planIdSource: context.planIdSource,
    currentPeriodEnd: context.currentPeriodEnd?.seconds ?? null,
    nextBillingAt: context.nextBillingAt?.seconds ?? null,
  });

  return {
    userId: context.userId,
    planId: context.planId,
    amount: typeof amount === "number" ? amount : null,
    currency: invoice.currency ?? null,
    currentPeriodEnd: context.currentPeriodEnd,
    nextBillingAt: context.nextBillingAt,
  };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string | null} [providerSubscriptionId]
 * @returns {Promise<{
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 * }>}
 */
async function resolveSubscriptionBillingPeriod(db, userId, providerSubscriptionId = null) {
  const subscriptionRef = db.collection("subscriptions").doc(userId);
  const subscriptionSnap = await subscriptionRef.get();
  const subscriptionData = subscriptionSnap.data() ?? {};

  let currentPeriodEnd =
    subscriptionData.currentPeriodEnd instanceof Timestamp
      ? subscriptionData.currentPeriodEnd
      : null;

  let nextBillingAt =
    subscriptionData.nextBillingAt instanceof Timestamp
      ? subscriptionData.nextBillingAt
      : currentPeriodEnd;

  if (!currentPeriodEnd && providerSubscriptionId) {
    const periodFields = await fetchSubscriptionPeriodFields(providerSubscriptionId);
    currentPeriodEnd = periodFields.currentPeriodEnd;
    nextBillingAt = periodFields.nextBillingAt ?? currentPeriodEnd;

    if (currentPeriodEnd) {
      await subscriptionRef.set(
        {
          currentPeriodEnd,
          nextBillingAt,
          cancelAtPeriodEnd: periodFields.cancelAtPeriodEnd,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  return { currentPeriodEnd, nextBillingAt };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string | null,
 *   amount: number | null,
 *   currency: string | null,
 *   providerInvoiceId: string,
 *   paidAt: FirebaseFirestore.Timestamp,
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 * }} params
 */
async function enqueuePaymentSuccessEmail(db, {
  userId,
  planId,
  amount,
  currency,
  providerInvoiceId,
  paidAt,
  currentPeriodEnd,
  nextBillingAt,
}) {
  const emailId = `payment_success_${providerInvoiceId}`;
  const emailRef = db.collection("emailQueue").doc(emailId);
  const existingSnap = await emailRef.get();

  const payload = {
    userId,
    planId,
    amount,
    currency,
    providerInvoiceId,
    paidAt,
    currentPeriodEnd,
    nextBillingAt,
  };

  if (existingSnap.exists) {
    const existing = existingSnap.data() ?? {};
    const existingStatus = existing.status;

    if (existingStatus === "sent") {
      logger.warn("stripeWebhook: payment success email already sent with previous payload", {
        emailId,
        providerInvoiceId,
        userId,
        existingPlanId: existing.payload?.planId ?? null,
        correctedPlanId: planId,
      });
      return;
    }

    if (existingStatus === "pending" || existingStatus === "failed") {
      if (existingStatus === "failed") {
        await emailRef.delete();
        const to = existing.to || (await resolveUserEmail(db, userId));

        if (!to) {
          logger.warn("stripeWebhook: payment success email correction skipped — no recipient", {
            userId,
            providerInvoiceId,
          });
          return;
        }

        await emailRef.set({
          type: EMAIL_TYPES.PAYMENT_SUCCESS,
          to,
          userId,
          status: "pending",
          payload,
          createdAt: FieldValue.serverTimestamp(),
          correctedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await emailRef.update({
          payload,
          updatedAt: FieldValue.serverTimestamp(),
          correctedAt: FieldValue.serverTimestamp(),
        });
      }

      logger.info("stripeWebhook: payment success email payload corrected", {
        emailId,
        providerInvoiceId,
        userId,
        planId,
        previousStatus: existingStatus,
      });
      return;
    }

    logger.info("stripeWebhook: payment success email already queued", {
      emailId,
      providerInvoiceId,
      userId,
      status: existingStatus,
    });
    return;
  }

  const to = await resolveUserEmail(db, userId);

  if (!to) {
    logger.warn("stripeWebhook: payment success email skipped — no recipient", {
      userId,
      providerInvoiceId,
    });
    return;
  }

  await emailRef.set({
    type: EMAIL_TYPES.PAYMENT_SUCCESS,
    to,
    userId,
    status: "pending",
    payload,
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("stripeWebhook: payment success email enqueued", {
    emailId,
    providerInvoiceId,
    userId,
    planId,
  });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string | null,
 *   amount: number | null,
 *   currency: string | null,
 *   providerInvoiceId: string,
 *   currentPeriodEnd: FirebaseFirestore.Timestamp | null,
 *   nextBillingAt: FirebaseFirestore.Timestamp | null,
 *   hostedInvoiceUrl: string | null,
 *   nextPaymentAttempt: FirebaseFirestore.Timestamp | null,
 * }} params
 */
async function enqueuePaymentFailedEmail(db, {
  userId,
  planId,
  amount,
  currency,
  providerInvoiceId,
  currentPeriodEnd,
  nextBillingAt,
  hostedInvoiceUrl,
  nextPaymentAttempt,
}) {
  const emailId = `payment_failed_${providerInvoiceId}`;
  const emailRef = db.collection("emailQueue").doc(emailId);
  const existingSnap = await emailRef.get();

  if (existingSnap.exists) {
    logger.info("stripeWebhook: payment failed email already queued", {
      emailId,
      providerInvoiceId,
      userId,
    });
    return;
  }

  const to = await resolveUserEmail(db, userId);

  if (!to) {
    logger.warn("stripeWebhook: payment failed email skipped — no recipient", {
      userId,
      providerInvoiceId,
    });
    return;
  }

  await emailRef.set({
    type: EMAIL_TYPES.PAYMENT_FAILED,
    to,
    userId,
    status: "pending",
    payload: {
      userId,
      planId,
      amount,
      currency,
      providerInvoiceId,
      currentPeriodEnd,
      nextBillingAt,
      hostedInvoiceUrl,
      nextPaymentAttempt,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("stripeWebhook: payment failed email enqueued", {
    emailId,
    providerInvoiceId,
    userId,
  });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 */
async function handleInvoicePaid(db, invoice) {
  logger.info("stripeWebhook: invoice.paid received", {
    invoiceId: invoice.id,
    invoiceCustomer: invoice.customer ?? null,
    invoiceSubscription: invoice.subscription ?? null,
    invoiceParentType: invoice.parent?.type ?? null,
    invoiceParentSubscription: invoice.parent?.subscription_details?.subscription ?? null,
  });

  const expandedInvoice = await expandStripeInvoice(invoice);
  const context = await resolveInvoicePaidContext(db, expandedInvoice);

  if (context.userId && context.subscriptionId) {
    await upsertSubscriptionDoc(db, context.userId, {
      planId: context.planId,
      customerId: context.customerId ?? "",
      subscriptionId: context.subscriptionId,
      currentPeriodEnd: context.currentPeriodEnd,
      nextBillingAt: context.nextBillingAt,
      cancelAtPeriodEnd: context.cancelAtPeriodEnd,
    });
  }

  const invoiceContext = await upsertInvoiceDoc(db, expandedInvoice, "paid", context);

  if (!invoiceContext.userId) {
    logger.warn("stripeWebhook: payment success email skipped — no userId", {
      providerInvoiceId: invoice.id,
    });
    return;
  }

  const paidAt =
    toFirestoreTimestamp(invoice.status_transitions?.paid_at) ??
    Timestamp.now();

  try {
    await enqueuePaymentSuccessEmail(db, {
      userId: invoiceContext.userId,
      planId: invoiceContext.planId,
      amount: invoiceContext.amount,
      currency: invoiceContext.currency,
      providerInvoiceId: invoice.id,
      paidAt,
      currentPeriodEnd: invoiceContext.currentPeriodEnd,
      nextBillingAt: invoiceContext.nextBillingAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("stripeWebhook: payment success email enqueue failed", {
      userId: invoiceContext.userId,
      providerInvoiceId: invoice.id,
      error: message,
    });
  }
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe.Invoice} invoice
 */
async function handleInvoicePaymentFailed(db, invoice) {
  const invoiceContext = await upsertInvoiceDoc(db, invoice, "failed");

  if (!invoiceContext.userId) {
    logger.warn("stripeWebhook: payment failed email skipped — no userId", {
      providerInvoiceId: invoice.id,
    });
    return;
  }

  const { currentPeriodEnd, nextBillingAt } = await resolveSubscriptionBillingPeriod(
    db,
    invoiceContext.userId,
  );

  const nextPaymentAttempt = toFirestoreTimestamp(invoice.next_payment_attempt);

  try {
    await enqueuePaymentFailedEmail(db, {
      userId: invoiceContext.userId,
      planId: invoiceContext.planId,
      amount: invoiceContext.amount,
      currency: invoiceContext.currency,
      providerInvoiceId: invoice.id,
      currentPeriodEnd,
      nextBillingAt,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      nextPaymentAttempt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("stripeWebhook: payment failed email enqueue failed", {
      userId: invoiceContext.userId,
      providerInvoiceId: invoice.id,
      error: message,
    });
  }
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
