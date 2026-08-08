const { FieldValue } = require("firebase-admin/firestore");
const { buildPrelaunchLeadId } = require("./buildPrelaunchLeadId");
const {
  validateAndNormalizePrelaunchLead,
} = require("./validateAndNormalizePrelaunchLead");

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isAlreadyExistsError(err) {
  if (!err || typeof err !== "object") {
    return false;
  }

  const code = /** @type {{ code?: unknown }} */ (err).code;

  return (
    code === 6 ||
    code === "already-exists" ||
    code === "ALREADY_EXISTS"
  );
}

/**
 * Núcleo testável da criação de lead (Admin SDK).
 *
 * Usa doc.create() no ID determinístico para atomicidade sob concorrência.
 *
 * @param {{
 *   collection: (name: string) => {
 *     doc: (id: string) => {
 *       create: (data: object) => Promise<unknown>,
 *     },
 *   },
 * }} db
 * @param {unknown} rawPayload
 * @param {{ serverTimestamp?: () => unknown }} [deps]
 * @returns {Promise<
 *   | { ok: true, result: { success: true, alreadyRegistered: boolean }, leadId: string }
 *   | { ok: false, reason: string, message: string }
 * >}
 */
async function submitPrelaunchLeadCore(db, rawPayload, deps = {}) {
  const timestampFn = deps.serverTimestamp || (() => FieldValue.serverTimestamp());
  const validated = validateAndNormalizePrelaunchLead(rawPayload);

  if (!validated.ok) {
    return {
      ok: false,
      reason: validated.reason,
      message: validated.message,
    };
  }

  const lead = validated.value;
  const leadId = buildPrelaunchLeadId(lead.emailNormalized, lead.campaignId);
  const ref = db.collection("prelaunchLeads").doc(leadId);

  const document = {
    name: lead.name,
    email: lead.email,
    emailNormalized: lead.emailNormalized,
    phone: lead.phone,
    phoneNormalized: lead.phoneNormalized,
    profession: lead.profession,
    marketingConsent: lead.marketingConsent,
    campaignId: lead.campaignId,
    attribution: lead.attribution,
    status: "waiting",
    createdAt: timestampFn(),
    updatedAt: timestampFn(),
  };

  try {
    await ref.create(document);
    return {
      ok: true,
      result: { success: true, alreadyRegistered: false },
      leadId,
    };
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      return {
        ok: true,
        result: { success: true, alreadyRegistered: true },
        leadId,
      };
    }

    throw err;
  }
}

module.exports = {
  submitPrelaunchLeadCore,
  isAlreadyExistsError,
};
