const { logger } = require("firebase-functions");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const {
  ACTIVE_SUBSCRIPTION_STATUSES,
  isBillingUpgradePlanId,
  isMercadoPagoPaymentApproved,
  mapMercadoPagoPreapprovalStatus,
} = require("../config/billing");
const { fetchMercadoPagoPayment, fetchMercadoPagoPreapproval } = require("./fetchResources");
const { resolveUserAndPlan } = require("./matchUser");

/** @typedef {"processed" | "ignored" | "unmatched" | "failed"} ProcessStatus */

/**
 * @param {unknown} body
 * @returns {"payment" | "subscription_preapproval" | null}
 */
function identifyMercadoPagoEventType(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const type = /** @type {{ type?: unknown }} */ (body).type;

  if (type === "payment") {
    return "payment";
  }

  if (type === "subscription_preapproval") {
    return "subscription_preapproval";
  }

  return null;
}

/**
 * @param {unknown} body
 * @returns {string | null}
 */
function extractMercadoPagoResourceId(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const payload = /** @type {{ data?: unknown }} */ (body);
  const data = payload.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const id = /** @type {{ id?: unknown }} */ (data).id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

/**
 * @param {string | null | undefined} value
 * @returns {import("firebase-admin/firestore").Timestamp | null}
 */
function parseMercadoPagoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Timestamp.fromDate(date);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} sessionId
 * @param {string} status
 * @param {{
 *   providerSubscriptionId?: string,
 *   providerPaymentId?: string,
 * } | undefined} [metadata]
 */
async function updateCheckoutSessionStatus(db, sessionId, status, metadata) {
  /** @type {Record<string, unknown>} */
  const payload = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof metadata?.providerSubscriptionId === "string" && metadata.providerSubscriptionId) {
    payload.providerSubscriptionId = metadata.providerSubscriptionId;
  }

  if (typeof metadata?.providerPaymentId === "string" && metadata.providerPaymentId) {
    payload.providerPaymentId = metadata.providerPaymentId;
  }

  if (status === "completed") {
    const existing = await db.collection("billingCheckoutSessions").doc(sessionId).get();
    if (!existing.data()?.completedAt) {
      payload.completedAt = FieldValue.serverTimestamp();
    }
  }

  await db.collection("billingCheckoutSessions").doc(sessionId).set(payload, { merge: true });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string,
 *   preapprovalId: string,
 *   payerEmail: string,
 *   status: string,
 *   currentPeriodEnd: import("firebase-admin/firestore").Timestamp | null,
 * }} params
 */
async function upsertSubscription(db, params) {
  const subscriptionRef = db.collection("subscriptions").doc(params.userId);
  const existing = await subscriptionRef.get();

  /** @type {Record<string, unknown>} */
  const payload = {
    userId: params.userId,
    provider: "mercado_pago",
    planId: params.planId,
    status: params.status,
    providerSubscriptionId: params.preapprovalId,
    payerEmail: params.payerEmail || null,
    currentPeriodEnd: params.currentPeriodEnd,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }

  await subscriptionRef.set(payload, { merge: true });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string,
 *   currentPeriodEnd: import("firebase-admin/firestore").Timestamp | null,
 * }} params
 */
async function updateUserPlan(db, params) {
  await db.collection("users").doc(params.userId).set(
    {
      plan: {
        id: params.planId,
        status: "active",
        source: "mercado_pago",
        currentPeriodEnd: params.currentPeriodEnd,
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   userId: string,
 *   planId: string,
 *   paymentId: string,
 *   amount: number | null,
 *   currency: string,
 *   paidAt: import("firebase-admin/firestore").Timestamp | null,
 *   providerSubscriptionId?: string | null,
 * }} params
 */
async function createOrUpdateInvoice(db, params) {
  const invoiceId = `mercado_pago_${params.paymentId}`;
  const invoiceRef = db.collection("invoices").doc(invoiceId);
  const existing = await invoiceRef.get();

  if (existing.exists && existing.data()?.status === "paid") {
    return { invoiceId, created: false };
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    userId: params.userId,
    subscriptionId: params.providerSubscriptionId ?? null,
    provider: "mercado_pago",
    providerPaymentId: params.paymentId,
    planId: params.planId,
    amount: params.amount ?? 0,
    currency: params.currency,
    status: "paid",
    paidAt: params.paidAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }

  await invoiceRef.set(payload, { merge: true });

  return { invoiceId, created: !existing.exists };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} accessToken
 * @param {unknown} body
 * @returns {Promise<{
 *   status: ProcessStatus,
 *   resolvedUserId: string | null,
 *   eventType: string | null,
 *   resourceId: string | null,
 *   message?: string,
 *   details?: Record<string, unknown>,
 * }>}
 */
async function processPaymentEvent(db, accessToken, body) {
  const paymentId = extractMercadoPagoResourceId(body);
  if (!paymentId) {
    return {
      status: "ignored",
      resolvedUserId: null,
      eventType: "payment",
      resourceId: null,
      message: "payment event without data.id",
    };
  }

  const payment = await fetchMercadoPagoPayment(accessToken, paymentId);
  const match = await resolveUserAndPlan(db, {
    payerEmail: payment.payerEmail,
    externalReference: payment.externalReference,
    metadata: payment.metadata,
  });

  if (!match?.userId) {
    return {
      status: "unmatched",
      resolvedUserId: null,
      eventType: "payment",
      resourceId: paymentId,
      message: "payment event without resolvable user",
    };
  }

  const planId = match.planId && isBillingUpgradePlanId(match.planId) ? match.planId : null;

  if (!planId) {
    return {
      status: "unmatched",
      resolvedUserId: match.userId,
      eventType: "payment",
      resourceId: paymentId,
      message: "payment event without resolvable plan",
      details: { matchSource: match.matchSource },
    };
  }

  const paidAt = parseMercadoPagoDate(payment.dateApproved);
  const subscriptionDoc = await db.collection("subscriptions").doc(match.userId).get();
  const providerSubscriptionId =
    typeof subscriptionDoc.data()?.providerSubscriptionId === "string"
      ? subscriptionDoc.data().providerSubscriptionId
      : null;

  /** @type {Record<string, unknown>} */
  const details = {
    matchSource: match.matchSource,
    planId,
    paymentStatus: payment.status,
  };

  if (match.sessionId) {
    const sessionStatus = isMercadoPagoPaymentApproved(payment.status) ? "completed" : "pending";
    await updateCheckoutSessionStatus(
      db,
      match.sessionId,
      sessionStatus,
      sessionStatus === "completed" ? { providerPaymentId: payment.id } : undefined,
    );
    details.sessionId = match.sessionId;
    details.checkoutUpdated = true;
  }

  if (isMercadoPagoPaymentApproved(payment.status)) {
    const invoice = await createOrUpdateInvoice(db, {
      userId: match.userId,
      planId,
      paymentId: payment.id,
      amount: payment.transactionAmount,
      currency: payment.currencyId,
      paidAt,
      providerSubscriptionId,
    });

    details.invoiceId = invoice.invoiceId;
    details.invoiceCreated = invoice.created;

    const subscriptionStatus = subscriptionDoc.data()?.status;
    const hasActiveSubscription =
      typeof subscriptionStatus === "string" &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus);

    if (hasActiveSubscription) {
      await updateUserPlan(db, {
        userId: match.userId,
        planId,
        currentPeriodEnd: subscriptionDoc.data()?.currentPeriodEnd ?? paidAt,
      });
      details.userPlanUpdated = true;
    }
  }

  return {
    status: "processed",
    resolvedUserId: match.userId,
    eventType: "payment",
    resourceId: paymentId,
    details,
  };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} accessToken
 * @param {unknown} body
 * @returns {Promise<{
 *   status: ProcessStatus,
 *   resolvedUserId: string | null,
 *   eventType: string | null,
 *   resourceId: string | null,
 *   message?: string,
 *   details?: Record<string, unknown>,
 * }>}
 */
async function processPreapprovalEvent(db, accessToken, body) {
  const preapprovalId = extractMercadoPagoResourceId(body);
  if (!preapprovalId) {
    return {
      status: "ignored",
      resolvedUserId: null,
      eventType: "subscription_preapproval",
      resourceId: null,
      message: "preapproval event without data.id",
    };
  }

  const preapproval = await fetchMercadoPagoPreapproval(accessToken, preapprovalId);
  const match = await resolveUserAndPlan(db, {
    payerEmail: preapproval.payerEmail,
    mpPlanId: preapproval.preapprovalPlanId,
    externalReference: preapproval.externalReference,
    metadata: preapproval.metadata,
  });

  if (!match?.userId) {
    return {
      status: "unmatched",
      resolvedUserId: null,
      eventType: "subscription_preapproval",
      resourceId: preapprovalId,
      message: "preapproval event without resolvable user",
    };
  }

  const planId = match.planId && isBillingUpgradePlanId(match.planId) ? match.planId : null;

  if (!planId) {
    return {
      status: "unmatched",
      resolvedUserId: match.userId,
      eventType: "subscription_preapproval",
      resourceId: preapprovalId,
      message: "preapproval event without resolvable plan",
      details: { matchSource: match.matchSource },
    };
  }

  const internalStatus = mapMercadoPagoPreapprovalStatus(preapproval.status);
  const currentPeriodEnd = parseMercadoPagoDate(preapproval.nextPaymentDate);

  await upsertSubscription(db, {
    userId: match.userId,
    planId,
    preapprovalId: preapproval.id,
    payerEmail: preapproval.payerEmail,
    status: internalStatus,
    currentPeriodEnd,
  });

  /** @type {Record<string, unknown>} */
  const details = {
    matchSource: match.matchSource,
    planId,
    subscriptionId: preapproval.id,
    preapprovalStatus: preapproval.status,
    internalStatus,
    subscriptionUpdated: true,
  };

  if (match.sessionId) {
    const sessionStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(internalStatus)
      ? "completed"
      : internalStatus === "inactive"
        ? "pending"
        : "created";
    await updateCheckoutSessionStatus(
      db,
      match.sessionId,
      sessionStatus,
      sessionStatus === "completed" ? { providerSubscriptionId: preapproval.id } : undefined,
    );
    details.sessionId = match.sessionId;
    details.checkoutUpdated = true;
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(internalStatus)) {
    await updateUserPlan(db, {
      userId: match.userId,
      planId,
      currentPeriodEnd,
    });
    details.userPlanUpdated = true;
  }

  return {
    status: "processed",
    resolvedUserId: match.userId,
    eventType: "subscription_preapproval",
    resourceId: preapprovalId,
    details,
  };
}

/**
 * Processa um evento Mercado Pago e atualiza billing interno.
 *
 * @param {{
 *   db: import("firebase-admin/firestore").Firestore,
 *   accessToken: string,
 *   body: unknown,
 *   source?: "webhook" | "sync",
 * }} event
 * @returns {Promise<{
 *   status: ProcessStatus,
 *   resolvedUserId: string | null,
 *   eventType: string | null,
 *   resourceId: string | null,
 *   message?: string,
 *   details?: Record<string, unknown>,
 * }>}
 */
async function processMercadoPagoEvent(event) {
  const { db, accessToken, body, source = "webhook" } = event;
  const eventType = identifyMercadoPagoEventType(body);

  if (!eventType) {
    return {
      status: "ignored",
      resolvedUserId: null,
      eventType: null,
      resourceId: extractMercadoPagoResourceId(body),
      message: "unsupported mercado pago event type",
    };
  }

  if (!accessToken?.trim()) {
    return {
      status: "failed",
      resolvedUserId: null,
      eventType,
      resourceId: extractMercadoPagoResourceId(body),
      message: "MP_ACCESS_TOKEN is not configured",
    };
  }

  try {
    if (eventType === "payment") {
      const result = await processPaymentEvent(db, accessToken.trim(), body);
      logger.info("processMercadoPagoEvent: payment processed", {
        source,
        status: result.status,
        resourceId: result.resourceId,
        resolvedUserId: result.resolvedUserId,
      });
      return result;
    }

    const result = await processPreapprovalEvent(db, accessToken.trim(), body);
    logger.info("processMercadoPagoEvent: preapproval processed", {
      source,
      status: result.status,
      resourceId: result.resourceId,
      resolvedUserId: result.resolvedUserId,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("processMercadoPagoEvent: processing failed", {
      source,
      eventType,
      resourceId: extractMercadoPagoResourceId(body),
      error: message,
    });

    return {
      status: "failed",
      resolvedUserId: null,
      eventType,
      resourceId: extractMercadoPagoResourceId(body),
      message,
    };
  }
}

module.exports = {
  extractMercadoPagoResourceId,
  identifyMercadoPagoEventType,
  processMercadoPagoEvent,
};
