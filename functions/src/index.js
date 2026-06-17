/**
 * Cloud Functions entry point — FIVI360 transactional email.
 *
 * @see docs/resend-email-plan.md
 */

const { processEmailQueue } = require("./processEmailQueue");
const { requestPasswordResetEmail } = require("./requestPasswordResetEmail");
const { completeEmailVerification } = require("./completeEmailVerification");
const { createStripeCheckoutSession } = require("./createStripeCheckoutSession");
const { cancelStripeSubscription } = require("./cancelStripeSubscription");
const { stripeWebhook } = require("./stripeWebhook");

exports.processEmailQueue = processEmailQueue;
exports.requestPasswordResetEmail = requestPasswordResetEmail;
exports.completeEmailVerification = completeEmailVerification;
exports.createStripeCheckoutSession = createStripeCheckoutSession;
exports.cancelStripeSubscription = cancelStripeSubscription;
exports.stripeWebhook = stripeWebhook;
