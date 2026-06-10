const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { resendApiKey, sendTransactionalEmail } = require("./email/resendClient");
const { IMPLEMENTED_EMAIL_TYPES, resolveEmailTemplate } = require("./emailTemplates");

initializeApp();

/**
 * Processa itens da fila emailQueue quando criados com status pending.
 *
 * @see docs/resend-email-plan.md
 */
exports.processEmailQueue = onDocumentCreated(
  {
    document: "emailQueue/{emailId}",
    secrets: [resendApiKey],
    region: "southamerica-east1",
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      logger.warn("processEmailQueue: missing snapshot");
      return;
    }

    const emailId = event.params.emailId;
    const data = snapshot.data();
    const docRef = getFirestore().collection("emailQueue").doc(emailId);

    if (data.status !== "pending") {
      logger.info("processEmailQueue: skipping non-pending item", { emailId, status: data.status });
      return;
    }

    const { type, to, payload = {} } = data;

    if (!type || !to) {
      await docRef.update({
        status: "failed",
        error: "Missing required fields: type or to",
      });
      return;
    }

    if (!IMPLEMENTED_EMAIL_TYPES.has(type)) {
      await docRef.update({
        status: "failed",
        error: `Email type not implemented: ${type}`,
      });
      return;
    }

    try {
      await docRef.update({ status: "processing" });

      const template = resolveEmailTemplate(type, payload);
      const apiKey = resendApiKey.value();

      const { id: resendId } = await sendTransactionalEmail({
        apiKey,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      await docRef.update({
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        resendId,
        error: null,
      });

      logger.info("processEmailQueue: email sent", { emailId, type, resendId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      logger.error("processEmailQueue: send failed", { emailId, type, error: message });

      await docRef.update({
        status: "failed",
        error: message,
      });
    }
  },
);
