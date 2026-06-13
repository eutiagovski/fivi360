const { buildPaymentFailedEmail } = require("../email/templates/paymentFailed");

/**
 * Falha de cobrança (invoice.payment_failed).
 *
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function paymentFailedEmail(payload = {}) {
  return buildPaymentFailedEmail(payload);
}

module.exports = { paymentFailedEmail };
