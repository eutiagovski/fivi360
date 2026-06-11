/**
 * Solicitação de redefinição de senha via Cloud Function pública.
 *
 * O envio do e-mail ocorre em processEmailQueue (Resend); este módulo apenas
 * enfileira a solicitação sem revelar se o e-mail existe.
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

const requestPasswordResetEmailCallable = httpsCallable(
  functions,
  "requestPasswordResetEmail",
);

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";

/**
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export async function requestPasswordResetEmail(email) {
  const result = await requestPasswordResetEmailCallable({ email });
  const data = result.data;

  return {
    message:
      typeof data?.message === "string" ? data.message : PASSWORD_RESET_SUCCESS_MESSAGE,
  };
}
