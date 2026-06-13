const { EMAIL_TYPES, IMPLEMENTED_EMAIL_TYPES } = require("../config/email");
const { welcomeEmail } = require("./welcomeEmail");
const { verifyEmail } = require("./verifyEmail");
const { passwordResetEmail } = require("./passwordResetEmail");
const { upgradeRequestedEmail } = require("./upgradeRequestedEmail");
const { paymentSuccessEmail } = require("./paymentSuccessEmail");
const { paymentFailedEmail } = require("./paymentFailedEmail");
const { subscriptionCanceledEmail } = require("./subscriptionCanceledEmail");
const {
  subscriptionCancellationScheduledEmail,
} = require("./subscriptionCancellationScheduledEmail");

/**
 * @param {string} type
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function resolveEmailTemplate(type, payload) {
  switch (type) {
    case EMAIL_TYPES.WELCOME:
      return welcomeEmail(payload);
    case EMAIL_TYPES.VERIFY_EMAIL:
      return verifyEmail(payload);
    case EMAIL_TYPES.PASSWORD_RESET:
      return passwordResetEmail(payload);
    case EMAIL_TYPES.BILLING_UPGRADE_REQUESTED:
      return upgradeRequestedEmail(payload);
    case EMAIL_TYPES.PAYMENT_SUCCESS:
      return paymentSuccessEmail(payload);
    case EMAIL_TYPES.PAYMENT_FAILED:
      return paymentFailedEmail(payload);
    case EMAIL_TYPES.SUBSCRIPTION_CANCELED:
      return subscriptionCanceledEmail(payload);
    case EMAIL_TYPES.SUBSCRIPTION_CANCELLATION_SCHEDULED:
      return subscriptionCancellationScheduledEmail(payload);
    default:
      throw new Error(`No template implemented for email type: ${type}`);
  }
}

module.exports = {
  IMPLEMENTED_EMAIL_TYPES,
  resolveEmailTemplate,
};
