const { createHash } = require("crypto");

/**
 * ID determinístico do lead — sha256(emailNormalized|campaignId).
 * Não inclui PII em claro no path.
 *
 * @param {string} emailNormalized
 * @param {string} campaignId
 * @returns {string}
 */
function buildPrelaunchLeadId(emailNormalized, campaignId) {
  const material = `${emailNormalized}|${campaignId}`;
  return createHash("sha256").update(material, "utf8").digest("hex");
}

module.exports = {
  buildPrelaunchLeadId,
};
