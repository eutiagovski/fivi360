/**
 * Máscara visual BR para WhatsApp no formulário da LP.
 * Backend continua responsável por phoneNormalized.
 *
 * @param {string} value
 * @returns {string}
 */
export function formatBrazilPhoneMask(value) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function extractPhoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Validação leve de UX — backend é a fonte de verdade.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isPlausibleBrazilPhone(value) {
  const digits = extractPhoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}
