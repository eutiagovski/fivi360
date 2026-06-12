/**
 * Valida conexão com a API do Mercado Pago via Cloud Function callable.
 *
 * @see functions/src/getMercadoPagoStatus.js
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

const getMercadoPagoStatusCallable = httpsCallable(functions, "getMercadoPagoStatus");

/**
 * @returns {Promise<{ connected: boolean, environment?: "sandbox" | "production" }>}
 */
export async function getMercadoPagoStatus() {
  const result = await getMercadoPagoStatusCallable();
  return result.data ?? { connected: false };
}
