/**
 * Sincroniza `publicProfiles.portfolioAvailable` via Cloud Function (Admin SDK).
 *
 * RC-P0.5: o cliente não pode promover portfolioAvailable=true pelas rules.
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

const syncPublicPortfolioAvailabilityCallable = httpsCallable(
  functions,
  "syncPublicPortfolioAvailability",
);

/**
 * @returns {Promise<boolean>} portfolioAvailable resultante
 *
 * Não envia uid/planId/portfolioAvailable — a Function usa só request.auth.uid + users.plan.
 */
export async function syncPublicPortfolioAvailability() {
  const result = await syncPublicPortfolioAvailabilityCallable();
  return Boolean(result.data?.portfolioAvailable);
}
