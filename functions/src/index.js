/**
 * Cloud Functions entry point — FIVI360 transactional email.
 *
 * @see docs/resend-email-plan.md
 */

const { processEmailQueue } = require("./processEmailQueue");
const { requestPasswordResetEmail } = require("./requestPasswordResetEmail");

exports.processEmailQueue = processEmailQueue;
exports.requestPasswordResetEmail = requestPasswordResetEmail;
