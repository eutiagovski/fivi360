const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { APP_BASE_URL } = require("./config/app");
const { STRIPE_SECRET_KEY, getStripeClient } = require("./stripe/client");
const { STRIPE_BILLING_PARAMS, getStripePriceId } = require("./config/stripeBilling");

if (getApps().length === 0) {
  initializeApp();
}

const ALLOWED_CHECKOUT_PLAN_IDS = new Set(["professional"]);

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

const CHECKOUT_ALREADY_SUBSCRIBED_MESSAGE =
  "Você já possui uma assinatura Professional ativa.";

/**
 * @param {{ plan?: unknown }} userData
 * @returns {"starter" | "professional" | "enterprise"}
 */
function normalizeUserPlanId(userData) {
  const plan = userData.plan;

  if (typeof plan === "string") {
    const key = plan.toLowerCase().trim();
    if (key === "professional" || key === "enterprise") {
      return key;
    }
    return "starter";
  }

  if (plan && typeof plan === "object" && typeof plan.id === "string") {
    const status = typeof plan.status === "string" ? plan.status.toLowerCase().trim() : "";

    if (status && !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
      return "starter";
    }

    const id = plan.id.toLowerCase().trim();
    if (id === "professional" || id === "enterprise") {
      return id;
    }
  }

  return "starter";
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 * @param {{ plan?: unknown }} userData
 * @returns {Promise<boolean>}
 */
async function hasActiveProfessionalSubscription(db, uid, userData) {
  const effectivePlanId = normalizeUserPlanId(userData);
  const plan = userData.plan;
  const planStatus =
    plan && typeof plan === "object" && typeof plan.status === "string"
      ? plan.status.toLowerCase().trim()
      : "";

  if (
    effectivePlanId === "professional" &&
    (!planStatus || ACTIVE_SUBSCRIPTION_STATUSES.has(planStatus))
  ) {
    return true;
  }

  const subscriptionSnap = await db.collection("subscriptions").doc(uid).get();

  if (!subscriptionSnap.exists) {
    return false;
  }

  const subscription = subscriptionSnap.data() ?? {};
  const subscriptionStatus =
    typeof subscription.status === "string" ? subscription.status.toLowerCase().trim() : "";
  const subscriptionPlanId =
    typeof subscription.planId === "string" ? subscription.planId.toLowerCase().trim() : "";

  return (
    subscriptionPlanId === "professional" &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  );
}

/**
 * @param {{ billing?: { stripe?: { customerId?: string }, stripeCustomerId?: string } }} userData
 * @returns {string | undefined}
 */
function getStoredStripeCustomerId(userData) {
  const billing = userData.billing;
  if (!billing) {
    return undefined;
  }

  const nestedCustomerId = billing.stripe?.customerId;
  if (nestedCustomerId) {
    return nestedCustomerId;
  }

  return billing.stripeCustomerId || undefined;
}

/**
 * @param {string} uid
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("stripe").Stripe} stripe
 * @param {{ email?: string, displayName?: string, billing?: { stripe?: { customerId?: string }, stripeCustomerId?: string } }} userData
 * @param {string | undefined} authEmail
 * @returns {Promise<string>}
 */
async function resolveStripeCustomerId(uid, db, stripe, userData, authEmail) {
  const existingCustomerId = getStoredStripeCustomerId(userData);
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const email = authEmail || userData.email;
  if (!email) {
    throw new HttpsError("failed-precondition", "E-mail do usuário não disponível.");
  }

  const customer = await stripe.customers.create({
    email,
    name: userData.displayName || undefined,
    metadata: { userId: uid },
  });

  await db.collection("users").doc(uid).update({
    "billing.provider": "stripe",
    "billing.stripe.customerId": customer.id,
  });

  return customer.id;
}

/**
 * Inicia assinatura via Stripe Checkout (callable, autenticada).
 */
exports.createStripeCheckoutSession = onCall(
  {
    region: "southamerica-east1",
    secrets: [STRIPE_SECRET_KEY],
    params: STRIPE_BILLING_PARAMS,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Autenticação obrigatória.");
    }

    const uid = request.auth.uid;
    const planId = request.data?.planId;

    if (typeof planId !== "string" || !ALLOWED_CHECKOUT_PLAN_IDS.has(planId)) {
      throw new HttpsError("invalid-argument", 'planId inválido. Use "professional".');
    }

    const priceId = getStripePriceId(planId);
    if (!priceId) {
      throw new HttpsError("failed-precondition", "Preço Stripe não configurado.");
    }

    const stripe = getStripeClient();
    if (!stripe) {
      throw new HttpsError("failed-precondition", "Stripe não configurado.");
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError("not-found", "Perfil do usuário não encontrado.");
    }

    const userData = userSnap.data();

    if (
      planId === "professional" &&
      (await hasActiveProfessionalSubscription(db, uid, userData))
    ) {
      throw new HttpsError("failed-precondition", CHECKOUT_ALREADY_SUBSCRIBED_MESSAGE);
    }

    try {
      const customerId = await resolveStripeCustomerId(
        uid,
        db,
        stripe,
        userData,
        request.auth.token.email,
      );

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${APP_BASE_URL}/plan?checkout=success`,
        cancel_url: `${APP_BASE_URL}/plan?checkout=cancel`,
        client_reference_id: uid,
        metadata: {
          userId: uid,
          planId,
        },
        subscription_data: {
          metadata: {
            userId: uid,
            planId,
          },
        },
      });

      if (!session.url) {
        throw new HttpsError("internal", "Stripe não retornou URL de checkout.");
      }

      logger.info("createStripeCheckoutSession: session created", {
        uid,
        planId,
        sessionId: session.id,
      });

      return { checkoutUrl: session.url };
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);
      logger.error("createStripeCheckoutSession: failed", { uid, planId, error: message });
      throw new HttpsError("internal", "Não foi possível iniciar o checkout.");
    }
  },
);
