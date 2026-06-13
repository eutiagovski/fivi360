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
  VERIFY_EMAIL: "verify_email",
  PASSWORD_RESET: "password_reset",
  BILLING_UPGRADE_REQUESTED: "billing_upgrade_requested",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  SUBSCRIPTION_CANCELLATION_SCHEDULED: "subscription_cancellation_scheduled",
};

/** Tipos com template implementado. */
const IMPLEMENTED_EMAIL_TYPES = new Set([
  EMAIL_TYPES.WELCOME,
  EMAIL_TYPES.VERIFY_EMAIL,
  EMAIL_TYPES.PASSWORD_RESET,
  EMAIL_TYPES.BILLING_UPGRADE_REQUESTED,
  EMAIL_TYPES.PAYMENT_SUCCESS,
  EMAIL_TYPES.PAYMENT_FAILED,
  EMAIL_TYPES.SUBSCRIPTION_CANCELED,
  EMAIL_TYPES.SUBSCRIPTION_CANCELLATION_SCHEDULED,
]);

module.exports = {
  DEFAULT_FROM,
  EMAIL_TYPES,
  IMPLEMENTED_EMAIL_TYPES,
};
