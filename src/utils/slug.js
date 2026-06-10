/**
 * Utilitários de slug para o portfólio público (/u/:slug).
 *
 * @see docs/business-rules.md — Portfólio Público
 */

const SLUG_FORMAT_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Normaliza texto para formato de slug.
 * - minúsculas
 * - espaços → hífen
 * - remove caracteres inválidos (mantém a-z, 0-9, -)
 * - colapsa hífens consecutivos
 * - remove hífens das extremidades
 *
 * @param {string} input
 * @returns {string}
 */
export function normalizeSlug(input) {
  if (!input) {
    return "";
  }

  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Valida se o slug está no formato permitido (a-z, 0-9, hífen).
 *
 * @param {string} slug — já normalizado
 * @returns {boolean}
 */
export function isValidSlugFormat(slug) {
  return slug.length > 0 && SLUG_FORMAT_REGEX.test(slug);
}

/**
 * Monta a URL completa de preview do portfólio público.
 *
 * @param {string} slug — slug normalizado (ou vazio)
 * @returns {string}
 */
export function buildPortfolioUrl(slug) {
  return `${window.location.origin}/u/${slug || "seu-slug"}`;
}
