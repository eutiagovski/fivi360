/**
 * Cloud Functions entry point — FIVI360 transactional email.
 *
 * @see docs/resend-email-plan.md
 */

const { processEmailQueue } = require("./processEmailQueue");

exports.processEmailQueue = processEmailQueue;
