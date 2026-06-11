/**
 * Serviço de fila de e-mails transacionais.
 *
 * O frontend apenas enfileira pedidos; o envio real ocorre em Cloud Functions (Resend).
 * A API key do Resend nunca deve estar neste módulo ou no bundle React.
 *
 * @see docs/resend-email-plan.md
 */

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

const EMAIL_QUEUE_COLLECTION = "emailQueue";

/** Tipos que o cliente pode enfileirar (espelha firestore.rules). */
export const CLIENT_EMAIL_TYPES = {
  WELCOME: "welcome",
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
  const docRef = await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
    type,
    to,
    userId,
    payload,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
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
