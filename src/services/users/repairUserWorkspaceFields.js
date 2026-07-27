/**
 * Callable Admin SDK — repara workspace pessoal, member e IDs ausentes.
 *
 * RC-P0.5: defaultWorkspaceId / activeWorkspaceId não estão na allowlist de update do cliente.
 * Gets de workspaces/members exigem membership — reparo via Admin SDK.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "@/config/firebase";

const functions = getFunctions(app, "southamerica-east1");

if (
  process.env.NODE_ENV === "development"
  && process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true"
  && !globalThis.__FIVI360_FUNCTIONS_EMULATOR_CONNECTED__
) {
  const host = process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
  const port = Number(process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
  connectFunctionsEmulator(functions, host, port);
  globalThis.__FIVI360_FUNCTIONS_EMULATOR_CONNECTED__ = true;
}

const repairUserWorkspaceFieldsCallable = httpsCallable(
  functions,
  "repairUserWorkspaceFields",
);

/**
 * @returns {Promise<{
 *   repaired: boolean,
 *   fields?: string[],
 *   defaultWorkspaceId?: string,
 *   activeWorkspaceId?: string,
 * }>}
 */
export async function repairUserWorkspaceFields() {
  const result = await repairUserWorkspaceFieldsCallable();
  const data = result.data ?? {};

  return {
    repaired: Boolean(data.repaired),
    fields: Array.isArray(data.fields) ? data.fields.map(String) : [],
    defaultWorkspaceId:
      typeof data.defaultWorkspaceId === "string"
        ? data.defaultWorkspaceId
        : undefined,
    activeWorkspaceId:
      typeof data.activeWorkspaceId === "string"
        ? data.activeWorkspaceId
        : undefined,
  };
}
