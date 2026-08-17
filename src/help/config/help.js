/**
 * Configuração da Central de Ajuda (bounded context).
 *
 * Hoje: fivi360.com.br/ajuda
 * Futuro: ajuda.fivi360.com.br  →  apps/help/ no monorepo
 *
 * Não importar dashboard, billing, auth, project management ou Firebase.
 */

export const HELP_BASE_PATH = "/ajuda";

export const HELP_CONTACT_EMAIL = "contato@fivi360.com.br";

export const HELP_CONTENT_UPDATED_AT = "17 de agosto de 2026";

export const HELP_SEO = Object.freeze({
  homeTitle: "Central de Ajuda | FIVI360",
  homeDescription:
    "Tutoriais e orientações para criar projetos, enviar imagens 360°, configurar hotspots e compartilhar apresentações no FIVI360.",
  titleSuffix: " | Central de Ajuda FIVI360",
});

export const HELP_PLANS_PUBLIC_PATH = "/#precos";

export const HELP_APP_HOME_PATH = "/";

export const HELP_LOGIN_PATH = "/login";

export const HELP_REGISTER_PATH = "/register";

export const HELP_FORGOT_PASSWORD_PATH = "/forgot-password";

export const HELP_TERMS_PATH = "/termos";

export const HELP_PRIVACY_PATH = "/privacidade";
