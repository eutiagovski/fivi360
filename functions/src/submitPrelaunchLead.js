const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const {
  submitPrelaunchLeadCore,
} = require("./prelaunch/submitPrelaunchLeadCore");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Captação pública de leads de pré-lançamento.
 * Funciona autenticado ou não; não vincula auth.uid ao lead.
 *
 * @see docs/RC-LP-PRELAUNCH-DATA-1.md
 */
exports.submitPrelaunchLead = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const db = getFirestore();

    let outcome;

    try {
      outcome = await submitPrelaunchLeadCore(db, request.data);
    } catch (err) {
      logger.error("[Prelaunch] write failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError("internal", "Não foi possível concluir o pré-cadastro.");
    }

    if (!outcome.ok) {
      logger.info("[Prelaunch] validation rejected", {
        reason: outcome.reason,
      });
      throw new HttpsError("invalid-argument", outcome.message);
    }

    const leadIdPrefix = outcome.leadId.slice(0, 8);

    if (outcome.result.alreadyRegistered) {
      logger.info("[Prelaunch] duplicate submission", { leadIdPrefix });
    } else {
      logger.info("[Prelaunch] lead created", { leadIdPrefix });
    }

    // Resposta mínima — sem leadId, hash, e-mail ou demais PII.
    return {
      success: true,
      alreadyRegistered: outcome.result.alreadyRegistered,
    };
  },
);
