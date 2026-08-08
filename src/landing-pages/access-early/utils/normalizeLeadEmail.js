/**
 * Normalização de e-mail para leads (espelho do helper da Function).
 * Apenas trim + lowercase.
 *
 * @param {unknown} email
 * @returns {string}
 */
export function normalizeLeadEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}
