const { EMAIL_TYPES, IMPLEMENTED_EMAIL_TYPES } = require("../config/email");
const { welcomeEmail } = require("./welcomeEmail");
const { upgradeRequestedEmail } = require("./upgradeRequestedEmail");

/**
 * @param {string} type
 * @param {Record<string, unknown>} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function resolveEmailTemplate(type, payload) {
  switch (type) {
    case EMAIL_TYPES.WELCOME:
      return welcomeEmail(payload);
    case EMAIL_TYPES.BILLING_UPGRADE_REQUESTED:
      return upgradeRequestedEmail(payload);
    default:
      throw new Error(`No template implemented for email type: ${type}`);
  }
}

module.exports = {
  IMPLEMENTED_EMAIL_TYPES,
  resolveEmailTemplate,
};
