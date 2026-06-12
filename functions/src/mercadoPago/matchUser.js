const { getAuth } = require("firebase-admin/auth");
const { resolvePlanIdFromMpPlanId } = require("../config/billing");

/**
 * @param {string | null | undefined} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

const CHECKOUT_SESSION_STATUSES = new Set(["created", "pending"]);

/**
 * @param {{ expiresAt?: import("firebase-admin/firestore").Timestamp }} session
 * @returns {boolean}
 */
function isCheckoutSessionExpired(session) {
  const expiresAt = session.expiresAt;

  if (!expiresAt || typeof expiresAt.toMillis !== "function") {
    return false;
  }

  return expiresAt.toMillis() < Date.now();
}

/**
 * @param {{ status?: string }} session
 * @returns {boolean}
 */
function isCheckoutSessionStatusEligible(session) {
  return CHECKOUT_SESSION_STATUSES.has(String(session.status || ""));
}

/**
 * @param {{ email?: string, mpPlanId?: string }} session
 * @param {{ payerEmail: string, mpPlanId: string, requireBoth: boolean }} criteria
 * @returns {boolean}
 */
function sessionMatchesCheckoutCriteria(session, { payerEmail, mpPlanId, requireBoth }) {
  const sessionEmail = typeof session.email === "string" ? session.email.trim() : "";
  const sessionMpPlanId = typeof session.mpPlanId === "string" ? session.mpPlanId.trim() : "";
  const normalizedPayerEmail = normalizeEmail(payerEmail);
  const normalizedMpPlanId = String(mpPlanId || "").trim();

  if (requireBoth) {
    const emailMatches =
      Boolean(normalizedPayerEmail) && normalizeEmail(sessionEmail) === normalizedPayerEmail;
    const planMatches = Boolean(normalizedMpPlanId) && sessionMpPlanId === normalizedMpPlanId;

    return emailMatches && planMatches;
  }

  const emailMatches =
    !normalizedPayerEmail || normalizeEmail(sessionEmail) === normalizedPayerEmail;
  const planMatches = !normalizedMpPlanId || sessionMpPlanId === normalizedMpPlanId;

  return emailMatches && planMatches;
}

/**
 * @param {{ createdAt?: import("firebase-admin/firestore").Timestamp }} left
 * @param {{ createdAt?: import("firebase-admin/firestore").Timestamp }} right
 * @returns {number}
 */
function compareCheckoutSessionsByRecency(left, right) {
  const leftTime = left.createdAt?.toMillis?.() ?? 0;
  const rightTime = right.createdAt?.toMillis?.() ?? 0;

  return rightTime - leftTime;
}

/**
 * @param {string | null | undefined} externalReference
 * @returns {{ userId: string, planId: string, sessionId?: string } | null}
 */
function parseExternalReference(externalReference) {
  const raw = String(externalReference || "").trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const userId = typeof parsed.userId === "string" ? parsed.userId.trim() : "";
    const planId = typeof parsed.planId === "string" ? parsed.planId.trim() : "";
    const sessionId =
      typeof parsed.sessionId === "string" ? parsed.sessionId.trim() : "";

    if (!userId) {
      return null;
    }

    return sessionId ? { userId, planId, sessionId } : { userId, planId };
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @returns {{ userId: string, planId: string, sessionId?: string } | null}
 */
function parseMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const userId = typeof metadata.userId === "string" ? metadata.userId.trim() : "";
  const planId = typeof metadata.planId === "string" ? metadata.planId.trim() : "";
  const sessionId =
    typeof metadata.sessionId === "string" ? metadata.sessionId.trim() : "";

  if (!userId) {
    return null;
  }

  return sessionId ? { userId, planId, sessionId } : { userId, planId };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ payerEmail?: string, mpPlanId?: string }} params
 * @returns {Promise<{ sessionId: string, userId: string, planId: string } | null>}
 */
async function findCheckoutSession(db, { payerEmail, mpPlanId }) {
  const normalizedPayerEmail = normalizeEmail(payerEmail);
  const normalizedMpPlanId = String(mpPlanId || "").trim();

  if (!normalizedPayerEmail && !normalizedMpPlanId) {
    return null;
  }

  const requireBoth = Boolean(normalizedPayerEmail && normalizedMpPlanId);

  let snapshot;

  if (normalizedMpPlanId) {
    snapshot = await db
      .collection("billingCheckoutSessions")
      .where("mpPlanId", "==", normalizedMpPlanId)
      .limit(50)
      .get();
  } else {
    snapshot = await db
      .collection("billingCheckoutSessions")
      .where("email", "==", String(payerEmail || "").trim())
      .limit(50)
      .get();
  }

  if (snapshot.empty) {
    return null;
  }

  const candidates = snapshot.docs
    .map((doc) => ({ sessionId: doc.id, ...doc.data() }))
    .filter((session) => isCheckoutSessionStatusEligible(session))
    .filter((session) => !isCheckoutSessionExpired(session))
    .filter((session) =>
      sessionMatchesCheckoutCriteria(session, {
        payerEmail: String(payerEmail || ""),
        mpPlanId: normalizedMpPlanId,
        requireBoth,
      }),
    )
    .sort(compareCheckoutSessionsByRecency);

  const match = candidates[0];
  if (!match?.userId || !match?.planId) {
    return null;
  }

  return {
    sessionId: match.sessionId,
    userId: String(match.userId),
    planId: String(match.planId),
  };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string | null | undefined} payerEmail
 * @returns {Promise<{ userId: string } | null>}
 */
async function findUserByEmail(db, payerEmail) {
  const email = String(payerEmail || "").trim();
  if (!email) {
    return null;
  }

  try {
    const authUser = await getAuth().getUserByEmail(email);
    if (authUser?.uid) {
      return { userId: authUser.uid };
    }
  } catch {
    // Auth lookup is best-effort; Firestore fallback below.
  }

  const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();

  if (!snapshot.empty) {
    return { userId: snapshot.docs[0].id };
  }

  const normalizedSnapshot = await db
    .collection("users")
    .where("email", "==", normalizeEmail(email))
    .limit(1)
    .get();

  if (normalizedSnapshot.empty) {
    return null;
  }

  return { userId: normalizedSnapshot.docs[0].id };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   payerEmail?: string,
 *   mpPlanId?: string,
 *   externalReference?: string,
 *   metadata?: Record<string, unknown> | null,
 * }} params
 * @returns {Promise<{
 *   userId: string,
 *   planId: string | null,
 *   matchSource: string,
 *   sessionId: string | null,
 * } | null>}
 */
async function resolveUserAndPlan(db, params) {
  const mpPlanId = String(params.mpPlanId || "").trim();

  const fromReference = parseExternalReference(params.externalReference);
  if (fromReference) {
    return {
      userId: fromReference.userId,
      planId: fromReference.planId || resolvePlanIdFromMpPlanId(mpPlanId),
      matchSource: "external_reference",
      sessionId: fromReference.sessionId || null,
    };
  }

  const fromMetadata = parseMetadata(params.metadata);
  if (fromMetadata) {
    return {
      userId: fromMetadata.userId,
      planId: fromMetadata.planId || resolvePlanIdFromMpPlanId(mpPlanId),
      matchSource: "metadata",
      sessionId: fromMetadata.sessionId || null,
    };
  }

  const sessionMatch = await findCheckoutSession(db, {
    payerEmail: params.payerEmail,
    mpPlanId,
  });

  if (sessionMatch) {
    return {
      userId: sessionMatch.userId,
      planId: sessionMatch.planId,
      matchSource: "checkout_session",
      sessionId: sessionMatch.sessionId,
    };
  }

  const userMatch = await findUserByEmail(db, params.payerEmail);
  if (userMatch) {
    return {
      userId: userMatch.userId,
      planId: resolvePlanIdFromMpPlanId(mpPlanId),
      matchSource: "user_email",
      sessionId: null,
    };
  }

  return null;
}

module.exports = {
  findCheckoutSession,
  findUserByEmail,
  parseExternalReference,
  parseMetadata,
  resolveUserAndPlan,
};
