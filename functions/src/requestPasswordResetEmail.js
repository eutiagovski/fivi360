const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { EMAIL_TYPES } = require("./config/email");

if (getApps().length === 0) {
  initializeApp();
}

const GENERIC_SUCCESS_MESSAGE =
  "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";

const THROTTLE_COLLECTION = "passwordResetThrottle";
const THROTTLE_MS = 60_000;

/**
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @param {string} email
 * @returns {string}
 */
function throttleDocId(email) {
  return email.replace(/\./g, "_");
}

/**
 * Solicita envio de e-mail de redefinição de senha via fila transacional.
 * Nunca revela se o e-mail existe na base.
 */
exports.requestPasswordResetEmail = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const rawEmail = request.data?.email;

    if (typeof rawEmail !== "string" || !rawEmail.trim()) {
      throw new HttpsError("invalid-argument", "E-mail inválido.");
    }

    const email = normalizeEmail(rawEmail);

    if (!isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "E-mail inválido.");
    }

    const db = getFirestore();
    const throttleRef = db.collection(THROTTLE_COLLECTION).doc(throttleDocId(email));

    try {
      const throttleDoc = await throttleRef.get();

      if (throttleDoc.exists) {
        const lastRequestedAt = throttleDoc.data()?.lastRequestedAt;

        if (lastRequestedAt?.toMillis && Date.now() - lastRequestedAt.toMillis() < THROTTLE_MS) {
          logger.info("requestPasswordResetEmail: throttled", { email });
          return { success: true, message: GENERIC_SUCCESS_MESSAGE };
        }
      }

      await throttleRef.set({ lastRequestedAt: FieldValue.serverTimestamp() }, { merge: true });

      await db.collection("emailQueue").add({
        type: EMAIL_TYPES.PASSWORD_RESET,
        to: email,
        status: "pending",
        payload: { email },
        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info("requestPasswordResetEmail: queued", { email });
    } catch (err) {
      logger.error("requestPasswordResetEmail: failed to queue", {
        email,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { success: true, message: GENERIC_SUCCESS_MESSAGE };
  },
);
