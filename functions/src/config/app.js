/**
 * URL base do app web (links de ação do Firebase Auth, CTAs de e-mail).
 *
 * Produção: https://fivi360.web.app
 * Desenvolvimento local: defina APP_BASE_URL=http://localhost:3000
 */

// const APP_BASE_URL = process.env.APP_BASE_URL || "https://fivi360.com.br";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

module.exports = {
  APP_BASE_URL,
};
