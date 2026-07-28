/**
 * Serviço de fila de e-mails transacionais.
 *
 * O frontend apenas enfileira pedidos; o envio real ocorre em Cloud Functions (Resend).
 * A API key do Resend nunca deve estar neste módulo ou no bundle React.
 *
 * @see docs/resend-email-plan.md
 */

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

const EMAIL_QUEUE_COLLECTION = "emailQueue";

/** Tipos que o cliente pode enfileirar (espelha firestore.rules). */
export const CLIENT_EMAIL_TYPES = {
  WELCOME: "welcome",
  VERIFY_EMAIL: "verify_email",
  BILLING_UPGRADE_REQUESTED: "billing_upgrade_requested",
};

/**
 * @param {{
 *   type: string,
 *   to: string,
 *   userId: string,
 *   payload?: Record<string, unknown>,
 * }} params
 * @returns {Promise<string>} ID do documento na fila
 */
export async function enqueueEmail({ type, to, userId, payload = {} }) {
  try {
    const docRef = await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
      type,
      to,
      userId,
      payload,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    console.error("[FIVI360] emailQueue.addDoc failed:", {
      stage: "enqueueEmail",
      type,
      userId,
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
}

/**
 * Enfileira e-mail de verificação de cadastro.
 *
 * O campo `to` usa exclusivamente o e-mail canônico de `auth.currentUser`
 * (exigência das Firestore Rules: `to == request.auth.token.email`).
 * O parâmetro `to` do caller é ignorado quando há sessão autenticada.
 *
 * @param {{
 *   to?: string,
 *   userId: string,
 *   name?: string,
 * }} params
 */
export async function enqueueVerifyEmail({ to, userId, name = "" }) {
  const authenticatedEmail = auth.currentUser?.email;

  if (!authenticatedEmail) {
    const error = new Error(
      "Authenticated email required to enqueue verify_email",
    );
    error.code = "verification-email-missing-auth-email";
    throw error;
  }

  if (
    process.env.NODE_ENV === "development"
    && to
    && to !== authenticatedEmail
  ) {
    console.warn("[FIVI360] enqueueVerifyEmail ignoring non-canonical to", {
      providedTo: to,
      authEmail: authenticatedEmail,
    });
  }

  return enqueueEmail({
    type: CLIENT_EMAIL_TYPES.VERIFY_EMAIL,
    to: authenticatedEmail,
    userId,
    payload: { name },
  });
}

/**
 * Enfileira e-mail de boas-vindas após cadastro.
 *
 * @param {{
 *   to: string,
 *   userId: string,
 *   name: string,
 *   companyName?: string,
 * }} params
 */
export async function enqueueWelcomeEmail({ to, userId, name, companyName = "" }) {
  return enqueueEmail({
    type: CLIENT_EMAIL_TYPES.WELCOME,
    to,
    userId,
    payload: { name, companyName },
  });
}

/**
 * Enfileira confirmação de solicitação de upgrade (uso futuro no app).
 *
 * @param {{
 *   to: string,
 *   userId: string,
 *   name: string,
 *   planId: string,
 *   planName: string,
 * }} params
 */
export async function enqueueUpgradeRequestedEmail({
  to,
  userId,
  name,
  planId,
  planName,
}) {
  return enqueueEmail({
    type: CLIENT_EMAIL_TYPES.BILLING_UPGRADE_REQUESTED,
    to,
    userId,
    payload: { name, planId, planName },
  });
}
