/**
 * Serviço de billing — Stripe Checkout (assinaturas via Cloud Functions).
 *
 * @see functions/src/createStripeCheckoutSession.js
 * @see src/config/billing.js
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "@/config/firebase";
import {
  CANCEL_SUBSCRIPTION_ERROR_MESSAGE,
  CANCEL_SUBSCRIPTION_SUCCESS_MESSAGE,
  PAYMENTS_COMING_SOON_MESSAGE,
} from "@/config/billing";
import { PLAN_IDS } from "@/config/planLimits";
import {
  getInvoicesByUserId,
  mapInvoicesToBillingRows,
} from "@/services/billing/invoiceService";

const functions = getFunctions(app, "southamerica-east1");

if (
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true" &&
  !globalThis.__FIVI360_FUNCTIONS_EMULATOR_CONNECTED__
) {
  const host = process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
  const port = Number(process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
  connectFunctionsEmulator(functions, host, port);
  globalThis.__FIVI360_FUNCTIONS_EMULATOR_CONNECTED__ = true;
}

const createStripeCheckoutSessionCallable = httpsCallable(
  functions,
  "createStripeCheckoutSession",
);

const cancelStripeSubscriptionCallable = httpsCallable(
  functions,
  "cancelStripeSubscription",
);

const NOT_ACTIVE = { ok: false, message: "Billing ainda não está ativo." };

export const CHECKOUT_START_ERROR_MESSAGE =
  "Não foi possível iniciar o checkout. Tente novamente.";

const STRIPE_CHECKOUT_PLAN_IDS = new Set([PLAN_IDS.PROFESSIONAL]);

/**
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
function getCallableErrorMessage(error, fallback) {
  if (
    error != null
    && typeof error === "object"
    && "code" in error
    && "message" in error
    && typeof error.message === "string"
    && error.message
  ) {
    const code = String(error.code);

    if (code === "functions/failed-precondition") {
      return error.message;
    }
  }

  return fallback;
}

/**
 * Chama a Cloud Function createStripeCheckoutSession.
 * @param {string} planId
 * @returns {Promise<string>}
 */
export async function createStripeCheckoutSession(planId) {
  const result = await createStripeCheckoutSessionCallable({ planId });
  const checkoutUrl = result.data?.checkoutUrl;

  if (typeof checkoutUrl !== "string" || !checkoutUrl) {
    throw new Error("Missing checkoutUrl");
  }

  return checkoutUrl;
}

/**
 * Inicia upgrade via Stripe Checkout.
 * @param {string} planId
 * @returns {Promise<{ ok: false, message: string } | { ok: true, checkoutUrl: string }>}
 */
export async function requestUpgrade(planId) {
  if (!STRIPE_CHECKOUT_PLAN_IDS.has(planId)) {
    return { ok: false, message: PAYMENTS_COMING_SOON_MESSAGE };
  }

  try {
    const checkoutUrl = await createStripeCheckoutSession(planId);
    return { ok: true, checkoutUrl };
  } catch (error) {
    return {
      ok: false,
      message: getCallableErrorMessage(error, CHECKOUT_START_ERROR_MESSAGE),
    };
  }
}

/**
 * Inicia checkout para o plano informado.
 * @param {string} planId
 * @returns {Promise<{ ok: false, message: string } | { ok: true, url: string }>}
 */
export async function createCheckoutSession(planId) {
  const result = await requestUpgrade(planId);
  if (!result.ok) {
    return result;
  }

  return { ok: true, url: result.checkoutUrl };
}

/**
 * Abre portal de gestão de assinatura.
 * @returns {Promise<{ ok: false, message: string } | { ok: true, url: string }>}
 */
export async function createBillingPortalSession() {
  return NOT_ACTIVE;
}

/**
 * Agenda cancelamento da assinatura Stripe ao fim do período atual.
 * @returns {Promise<{ ok: false, message: string } | { ok: true, message: string }>}
 */
export async function cancelSubscription() {
  try {
    const result = await cancelStripeSubscriptionCallable();
    if (result.data?.ok === true) {
      return { ok: true, message: CANCEL_SUBSCRIPTION_SUCCESS_MESSAGE };
    }

    return { ok: false, message: CANCEL_SUBSCRIPTION_ERROR_MESSAGE };
  } catch {
    return { ok: false, message: CANCEL_SUBSCRIPTION_ERROR_MESSAGE };
  }
}

/**
 * Resumo de billing para a UI (Firestore + gateway quando ativo).
 * @returns {Promise<{ ok: false, message: string } | { ok: true, summary: object }>}
 */
export async function getBillingSummary() {
  return NOT_ACTIVE;
}

/**
 * Lista faturas/cobranças do usuário (Firestore `invoices`).
 * @param {string} userId
 * @returns {Promise<{ ok: true, invoices: import("@/services/billing/invoiceService").BillingInvoiceRow[] } | { ok: false, message: string, invoices: [] }>}
 */
export async function getInvoices(userId) {
  if (!userId) {
    return { ok: true, invoices: [] };
  }

  try {
    const invoices = await getInvoicesByUserId(userId);
    return { ok: true, invoices: mapInvoicesToBillingRows(invoices) };
  } catch {
    return {
      ok: false,
      message: "Não foi possível carregar as cobranças.",
      invoices: [],
    };
  }
}
