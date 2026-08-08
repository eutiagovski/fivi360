const ATTRIBUTION_VALUE_MAX = 200;
const REFERRER_MAX = 500;
const LANDING_PATH_MAX = 200;

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
 * Captura UTMs + referrer + pathname para atribuição da campanha.
 *
 * `campaignId` interno NÃO vem da URL — use ACCESS_EARLY_CAMPAIGN.id.
 * Query params não são removidos da URL.
 *
 * @param {{
 *   search?: string,
 *   pathname?: string,
 *   referrer?: string,
 * }} [input]
 * @returns {{
 *   source: string | null,
 *   medium: string | null,
 *   utmCampaign: string | null,
 *   content: string | null,
 *   term: string | null,
 *   referrer: string | null,
 *   landingPath: string,
 * }}
 */
export function getPrelaunchAttribution(input = {}) {
  const search =
    input.search ??
    (typeof window !== "undefined" ? window.location.search : "");
  const pathname =
    input.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  const referrer =
    input.referrer ??
    (typeof document !== "undefined" ? document.referrer : "");

  const params = new URLSearchParams(search);

  return {
    source: sanitizeOptionalString(params.get("utm_source"), ATTRIBUTION_VALUE_MAX),
    medium: sanitizeOptionalString(params.get("utm_medium"), ATTRIBUTION_VALUE_MAX),
    utmCampaign: sanitizeOptionalString(
      params.get("utm_campaign"),
      ATTRIBUTION_VALUE_MAX,
    ),
    content: sanitizeOptionalString(params.get("utm_content"), ATTRIBUTION_VALUE_MAX),
    term: sanitizeOptionalString(params.get("utm_term"), ATTRIBUTION_VALUE_MAX),
    referrer: sanitizeOptionalString(referrer, REFERRER_MAX),
    landingPath:
      sanitizeOptionalString(pathname, LANDING_PATH_MAX) || "/lp/acesso-antecipado",
  };
}
