const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");
const { DEFAULT_FROM } = require("../config/email");

const resendApiKey = defineSecret("RESEND_API_KEY");

/**
 * @param {string} apiKey
 * @returns {Resend}
 */
function createResendClient(apiKey) {
  return new Resend(apiKey);
}

/**
 * @param {{
 *   apiKey: string,
 *   to: string,
 *   subject: string,
 *   html: string,
 *   text: string,
 *   from?: string,
 * }} params
 * @returns {Promise<{ id: string }>}
 */
async function sendTransactionalEmail({ apiKey, to, subject, html, text, from }) {
  const resend = createResendClient(apiKey);

  const { data, error } = await resend.emails.send({
    from: from || DEFAULT_FROM,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Resend API error");
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email id");
  }

  return { id: data.id };
}

module.exports = {
  resendApiKey,
  sendTransactionalEmail,
};
