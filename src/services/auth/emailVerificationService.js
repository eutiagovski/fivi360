/**
 * Finalização de verificação de e-mail via Cloud Function.
 *
 * Enfileira o welcome server-side após confirmar emailVerified no Firebase Auth.
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

const completeEmailVerificationCallable = httpsCallable(
  functions,
  "completeEmailVerification",
);

/**
 * @returns {Promise<{ welcomeEmailQueued: boolean, alreadyQueued: boolean }>}
 */
export async function completeEmailVerification() {
  const result = await completeEmailVerificationCallable();
  const data = result.data ?? {};

  return {
    welcomeEmailQueued: Boolean(data.welcomeEmailQueued),
    alreadyQueued: Boolean(data.alreadyQueued),
  };
}
