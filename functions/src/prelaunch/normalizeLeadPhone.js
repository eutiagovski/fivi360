/**
 * Normalização básica de telefone/WhatsApp para leads (campanha BR).
 *
 * - Remove +, espaços, parênteses, hífen
 * - Se for número local BR (10–11 dígitos) e assumeBrazilLocal, prefixa 55
 * - Não inventa DDI quando o formato é ambíguo/internacional longo
 */

const BRAZIL_COUNTRY_CODE = "55";

/**
 * @param {unknown} value
 * @returns {string}
 */
function extractPhoneDigits(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const waMeMatch = trimmed.match(/^https?:\/\/(?:api\.)?wa\.me\/(\d+)/i);
  if (waMeMatch) {
    return waMeMatch[1];
  }

  const telMatch = trimmed.match(/^tel:\+?(\d+)/i);
  if (telMatch) {
    return telMatch[1];
  }

  return trimmed.replace(/\D/g, "");
}

/**
 * @param {unknown} input
 * @param {{ assumeBrazilLocal?: boolean }} [options]
 * @returns {{ phone: string, phoneNormalized: string }}
 */
function normalizeLeadPhone(input, options = {}) {
  const { assumeBrazilLocal = true } = options;
  const phone = typeof input === "string" ? input.trim() : "";
  let digits = extractPhoneDigits(phone);

  if (
    assumeBrazilLocal &&
    digits &&
    !digits.startsWith(BRAZIL_COUNTRY_CODE) &&
    (digits.length === 10 || digits.length === 11)
  ) {
    digits = `${BRAZIL_COUNTRY_CODE}${digits}`;
  }

  return {
    phone,
    phoneNormalized: digits,
  };
}

/**
 * @param {string} phoneNormalized
 * @returns {boolean}
 */
function isValidLeadPhoneNormalized(phoneNormalized) {
  if (typeof phoneNormalized !== "string") {
    return false;
  }

  // E.164 sem +: tipicamente 10–15 dígitos; BR com 55 = 12–13.
  return /^\d{10,15}$/.test(phoneNormalized);
}

module.exports = {
  BRAZIL_COUNTRY_CODE,
  extractPhoneDigits,
  normalizeLeadPhone,
  isValidLeadPhoneNormalized,
};
