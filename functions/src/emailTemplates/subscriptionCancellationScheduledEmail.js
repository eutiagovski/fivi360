const {
  buildSubscriptionCancellationScheduledEmail,
} = require("../email/templates/subscriptionCancellationScheduled");

/**
 * Cancelamento agendado (cancel_at_period_end).
 *
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function subscriptionCancellationScheduledEmail(payload = {}) {
  return buildSubscriptionCancellationScheduledEmail(payload);
}

module.exports = { subscriptionCancellationScheduledEmail };
