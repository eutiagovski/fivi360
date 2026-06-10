/**
 * Configuração de e-mail transacional (Cloud Functions).
 *
 * @see docs/resend-email-plan.md
 */

/** Remetente padrão — requer domínio verificado no Resend. */
const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || "FIVI360 <onboarding@emails.fivi360.com.br>";

/** Tipos processados pela fila (deve espelhar firestore.rules). */
const EMAIL_TYPES = {
  WELCOME: "welcome",
  BILLING_UPGRADE_REQUESTED: "billing_upgrade_requested",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
};

/** Tipos com template implementado. */
const IMPLEMENTED_EMAIL_TYPES = new Set([
  EMAIL_TYPES.WELCOME,
  EMAIL_TYPES.BILLING_UPGRADE_REQUESTED,
]);

module.exports = {
  DEFAULT_FROM,
  EMAIL_TYPES,
  IMPLEMENTED_EMAIL_TYPES,
};
