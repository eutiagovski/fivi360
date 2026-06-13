const { buildPaymentSuccessEmail } = require("../email/templates/paymentSuccess");

/**
 * Confirmação de pagamento (invoice.paid).
 *
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function paymentSuccessEmail(payload = {}) {
  return buildPaymentSuccessEmail(payload);
}

module.exports = { paymentSuccessEmail };
