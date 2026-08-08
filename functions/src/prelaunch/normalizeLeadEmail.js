/**
 * Normalização de e-mail para leads de pré-lançamento.
 *
 * Apenas trim + lowercase — sem remover pontos do Gmail ou +alias
 * (evita colisões indevidas).
 *
 * @param {unknown} email
 * @returns {string}
 */
function normalizeLeadEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

/**
 * @param {string} emailNormalized
 * @returns {boolean}
 */
function isValidLeadEmail(emailNormalized) {
  if (!emailNormalized || emailNormalized.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized);
}

module.exports = {
  normalizeLeadEmail,
  isValidLeadEmail,
};
