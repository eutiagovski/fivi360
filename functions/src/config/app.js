/**
 * URL base do app web (links de ação do Firebase Auth, CTAs de e-mail).
 *
 * Fonte: process.env.APP_BASE_URL (carregado pelo Emulator de .env / .env.local).
 * Precedência local: .env.local sobrescreve .env.
 * Produção: parâmetro/configuração de deploy — não depende de .env.local.
 *
 * @see docs/RC-FUNCTIONS-ENV-CLEANUP-1.md
 */

/**
 * Resolve at call time so templates/tests always see the current env.
 * @returns {string}
 */
function getAppBaseUrl() {
  const value = process.env.APP_BASE_URL;
  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

/** Snapshot at module load (existing callers). Prefer getAppBaseUrl() for CTAs. */
const APP_BASE_URL = getAppBaseUrl();

module.exports = {
  APP_BASE_URL,
  getAppBaseUrl,
};
