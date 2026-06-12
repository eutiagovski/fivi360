/**
 * Checkout de assinatura Mercado Pago via Cloud Function callable.
 *
 * @see functions/src/createSubscriptionCheckout.js
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "@/config/firebase";

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

const createSubscriptionCheckoutCallable = httpsCallable(
  functions,
  "createSubscriptionCheckout",
);

/**
 * @param {import("@/config/planLimits").PlanId} planId
 * @returns {Promise<{ checkoutUrl: string }>}
 */
export async function createSubscriptionCheckout(planId) {
  const result = await createSubscriptionCheckoutCallable({ planId });
  const data = result.data ?? {};

  if (typeof data.checkoutUrl !== "string" || !data.checkoutUrl) {
    throw new Error("Resposta inválida do servidor de checkout.");
  }

  return { checkoutUrl: data.checkoutUrl };
}
