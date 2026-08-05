/**
 * URL base do app web (links de ação do Firebase Auth, CTAs de e-mail).
 *
 * Fonte: process.env.APP_BASE_URL (carregado pelo Emulator de .env / .env.local).
 * Precedência local: .env.local sobrescreve .env.
 * Produção: parâmetro/configuração de deploy — não depende de .env.local.
 *
 * @see docs/RC-FUNCTIONS-ENV-CLEANUP-1.md
 */

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

module.exports = {
  APP_BASE_URL,
};
