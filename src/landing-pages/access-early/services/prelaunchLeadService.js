/**
 * Service de pré-cadastro da LP — não chamar Firebase direto do componente.
 *
 * @see docs/RC-LP-PRELAUNCH-DATA-1.md
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "@/config/firebase";
import { ACCESS_EARLY_CAMPAIGN } from "../config";
import { getPrelaunchAttribution } from "../utils/getPrelaunchAttribution";

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

const submitPrelaunchLeadCallable = httpsCallable(functions, "submitPrelaunchLead");

/**
 * @typedef {object} PrelaunchLeadFormInput
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} profession
 * @property {boolean} marketingConsent
 * @property {ReturnType<typeof getPrelaunchAttribution>} [attribution]
 * @property {string} [campaignId]
 */

/**
 * Envia pré-cadastro via Cloud Function (Admin SDK no servidor).
 *
 * @param {PrelaunchLeadFormInput} input
 * @returns {Promise<{ success: true, alreadyRegistered: boolean }>}
 */
export async function submitPrelaunchLead(input) {
  const attribution = input.attribution ?? getPrelaunchAttribution();
  const campaignId = input.campaignId ?? ACCESS_EARLY_CAMPAIGN.id;

  const result = await submitPrelaunchLeadCallable({
    name: input.name,
    email: input.email,
    phone: input.phone,
    profession: input.profession,
    marketingConsent: input.marketingConsent,
    campaignId,
    attribution,
  });

  const data = result.data;

  return {
    success: data?.success === true,
    alreadyRegistered: data?.alreadyRegistered === true,
  };
}
