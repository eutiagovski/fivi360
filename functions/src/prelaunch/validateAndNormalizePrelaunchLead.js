const {
  ALLOWED_PRELAUNCH_CAMPAIGNS,
  PRELAUNCH_FIELD_LIMITS,
} = require("../config/prelaunch");
const {
  normalizeLeadEmail,
  isValidLeadEmail,
} = require("./normalizeLeadEmail");
const {
  normalizeLeadPhone,
  isValidLeadPhoneNormalized,
} = require("./normalizeLeadPhone");

/**
 * @param {unknown} value
 * @param {number} maxLen
 * @returns {string | null}
 */
function sanitizeOptionalString(value, maxLen) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLen);
}

/**
 * @param {unknown} value
 * @param {number} maxLen
 * @returns {string}
 */
function requireTrimmedString(value, maxLen) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLen);
}

/**
 * Valida e normaliza o payload do cliente (allowlist).
 * Campos extras são ignorados.
 *
 * @param {unknown} raw
 * @returns {{
 *   ok: true,
 *   value: {
 *     name: string,
 *     email: string,
 *     emailNormalized: string,
 *     phone: string,
 *     phoneNormalized: string,
 *     profession: string,
 *     marketingConsent: boolean,
 *     campaignId: string,
 *     attribution: {
 *       source: string | null,
 *       medium: string | null,
 *       utmCampaign: string | null,
 *       content: string | null,
 *       term: string | null,
 *       referrer: string | null,
 *       landingPath: string,
 *     },
 *   },
 * } | { ok: false, reason: string, message: string }}
 */
function validateAndNormalizePrelaunchLead(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      reason: "invalid_payload",
      message: "Dados inválidos.",
    };
  }

  /** @type {Record<string, unknown>} */
  const data = raw;

  const name = requireTrimmedString(data.name, PRELAUNCH_FIELD_LIMITS.name);
  if (!name) {
    return {
      ok: false,
      reason: "name_required",
      message: "Nome é obrigatório.",
    };
  }

  const emailRaw = requireTrimmedString(data.email, PRELAUNCH_FIELD_LIMITS.email);
  const emailNormalized = normalizeLeadEmail(emailRaw);

  if (!isValidLeadEmail(emailNormalized)) {
    return {
      ok: false,
      reason: "email_invalid",
      message: "E-mail inválido.",
    };
  }

  const { phone, phoneNormalized } = normalizeLeadPhone(data.phone);

  if (!phone) {
    return {
      ok: false,
      reason: "phone_required",
      message: "WhatsApp/telefone é obrigatório.",
    };
  }

  if (
    phone.length > PRELAUNCH_FIELD_LIMITS.phone ||
    !isValidLeadPhoneNormalized(phoneNormalized) ||
    phoneNormalized.length > PRELAUNCH_FIELD_LIMITS.phoneNormalized
  ) {
    return {
      ok: false,
      reason: "phone_invalid",
      message: "WhatsApp/telefone inválido.",
    };
  }

  const profession = requireTrimmedString(
    data.profession,
    PRELAUNCH_FIELD_LIMITS.profession,
  );

  if (!profession) {
    return {
      ok: false,
      reason: "profession_required",
      message: "Profissão é obrigatória.",
    };
  }

  if (typeof data.marketingConsent !== "boolean") {
    return {
      ok: false,
      reason: "marketing_consent_required",
      message: "Consentimento de marketing inválido.",
    };
  }

  const campaignId =
    typeof data.campaignId === "string" ? data.campaignId.trim() : "";

  if (!campaignId || !ALLOWED_PRELAUNCH_CAMPAIGNS.has(campaignId)) {
    return {
      ok: false,
      reason: "campaign_invalid",
      message: "Campanha inválida.",
    };
  }

  const attributionRaw =
    data.attribution != null &&
    typeof data.attribution === "object" &&
    !Array.isArray(data.attribution)
      ? /** @type {Record<string, unknown>} */ (data.attribution)
      : {};

  const landingPath = requireTrimmedString(
    attributionRaw.landingPath ?? data.landingPath,
    PRELAUNCH_FIELD_LIMITS.landingPath,
  );

  if (!landingPath) {
    return {
      ok: false,
      reason: "landing_path_required",
      message: "Caminho da landing é obrigatório.",
    };
  }

  const limits = PRELAUNCH_FIELD_LIMITS;

  return {
    ok: true,
    value: {
      name,
      email: emailRaw,
      emailNormalized,
      phone,
      phoneNormalized,
      profession,
      marketingConsent: data.marketingConsent,
      campaignId,
      attribution: {
        source: sanitizeOptionalString(attributionRaw.source, limits.attributionValue),
        medium: sanitizeOptionalString(attributionRaw.medium, limits.attributionValue),
        utmCampaign: sanitizeOptionalString(
          attributionRaw.utmCampaign,
          limits.attributionValue,
        ),
        content: sanitizeOptionalString(attributionRaw.content, limits.attributionValue),
        term: sanitizeOptionalString(attributionRaw.term, limits.attributionValue),
        referrer: sanitizeOptionalString(attributionRaw.referrer, limits.referrer),
        landingPath,
      },
    },
  };
}

module.exports = {
  validateAndNormalizePrelaunchLead,
  sanitizeOptionalString,
};
