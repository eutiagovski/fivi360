const { buildSubscriptionCanceledEmail } = require("../email/templates/subscriptionCanceled");

/**
 * Assinatura encerrada (customer.subscription.deleted).
 *
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function subscriptionCanceledEmail(payload = {}) {
  return buildSubscriptionCanceledEmail(payload);
}

module.exports = { subscriptionCanceledEmail };
