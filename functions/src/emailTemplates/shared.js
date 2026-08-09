/**
 * FIVI360 transactional email design system.
 *
 * Table-based layout, inline styles, Gmail/Outlook/Apple Mail oriented.
 * No flex/grid for structure, no CSS variables, no external fonts required.
 *
 * Brand decision (RC-EMAIL-TEMPLATE-1):
 * - Logo: textual wordmark only — no stable public HTTPS logo URL exists
 *   (webpack-hashed asset). Avoid broken <img>.
 * - Tagline: official early-access footer copy
 *   "Apresentações 360° para arquitetura e interiores."
 *   (not "Apresente. Explore. Compartilhe." — not an official tagline).
 * - Dark mode: light-first solid colors; no complex dual-theme CSS.
 */

const BRAND = "FIVI360";
/** Marketing site (footer / legal / public marketing CTAs). Never localhost. */
const APP_URL = "https://fivi360.com.br";
const PRIVACY_URL = `${APP_URL}/privacidade`;
const TERMS_URL = `${APP_URL}/termos`;
/** Official product tagline (early-access footer). */
const TAGLINE = "Apresentações 360° para arquitetura e interiores.";

const FONT_STACK =
  "Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const STATUS_MARKS = {
  success: "&#10003;",
  warning: "!",
  neutral: "&#8212;",
};

/**
 * Escape text for HTML body / attributes (prevents injection via name, plan, etc.).
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a URL for use in href. Rejects non-http(s) schemes.
 * @param {unknown} url
 * @returns {string}
 */
function escapeHref(url) {
  const raw = String(url ?? "").trim();
  if (!/^https?:\/\//i.test(raw)) {
    return "";
  }
  return escapeHtml(raw);
}

/**
 * Full-width primary CTA (black button, white text, centered).
 * Uses a 100% width table so the control does not left-align in Gmail/Outlook.
 *
 * @param {string} label
 * @param {string} url
 * @returns {string}
 */
function buildPrimaryButton(label, url) {
  const safeUrl = escapeHref(url);
  const safeLabel = escapeHtml(label);

  if (!safeUrl || !safeLabel) {
    return "";
  }

  return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin: 0;">
          <tr>
            <td align="center" bgcolor="#1a1a1a" style="background-color: #1a1a1a; border-radius: 8px; mso-padding-alt: 14px 24px;">
              <a href="${safeUrl}"
                 style="display: block; width: 100%; box-sizing: border-box; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; line-height: 1.4; padding: 14px 24px; border-radius: 8px; text-align: center; border: 1px solid #1a1a1a;">
                ${safeLabel}
              </a>
            </td>
          </tr>
        </table>`;
}

/**
 * Brand header — textual wordmark, centered, elevated presence.
 * @returns {string}
 */
function buildBrandHeader() {
  return `
          <tr>
            <td align="center" style="padding: 40px 32px 8px;">
              <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #1a1a1a;">
                ${BRAND}
              </p>
            </td>
          </tr>`;
}

/**
 * Status + heading block.
 * @param {{ title: string, subtitle?: string, status?: 'success'|'warning'|'neutral'|null }} params
 * @returns {string}
 */
function buildStatusHeader({ title, subtitle = "", status = null }) {
  const mark =
    status && STATUS_MARKS[status] != null ? STATUS_MARKS[status] : null;

  const statusBlock = mark
    ? `
          <tr>
            <td align="center" style="padding: 28px 32px 0;">
              <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 26px; font-weight: 600; line-height: 1; color: #1a1a1a;">
                ${mark}
              </p>
            </td>
          </tr>`
    : "";

  const subtitleBlock = subtitle
    ? `
              <p style="margin: 10px 0 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 400; line-height: 1.5; color: #666666;">
                ${escapeHtml(subtitle)}
              </p>`
    : "";

  return `
          ${statusBlock}
          <tr>
            <td align="center" style="padding: ${mark ? "16px" : "28px"} 32px 8px;">
              <h1 style="margin: 0; font-family: ${FONT_STACK}; font-size: 22px; font-weight: 600; line-height: 1.35; color: #1a1a1a;">
                ${escapeHtml(title)}
              </h1>
              ${subtitleBlock}
            </td>
          </tr>`;
}

/**
 * Summary / detail card — light bordered block, label left / value right.
 *
 * @param {string} heading
 * @param {Array<{ label: string, value: string }>} rows
 * @returns {string}
 */
function buildSummaryCard(heading, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "";
  }

  const rowHtml = rows
    .map((row, index) => {
      const isLast = index === rows.length - 1;
      const padBottom = isLast ? "0" : "12px";
      return `
              <tr>
                <td style="padding: 0 0 ${padBottom}; font-family: ${FONT_STACK}; font-size: 14px; line-height: 1.4; color: #777777; vertical-align: top;">
                  ${escapeHtml(row.label)}
                </td>
                <td align="right" style="padding: 0 0 ${padBottom}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; line-height: 1.4; color: #1a1a1a; vertical-align: top;">
                  ${escapeHtml(row.value)}
                </td>
              </tr>`;
    })
    .join("");

  return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin: 8px 0 28px; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #fafafa;">
          <tr>
            <td style="padding: 20px 20px 16px;">
              <p style="margin: 0 0 16px; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888888;">
                ${escapeHtml(heading)}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%;">
                ${rowHtml}
              </table>
            </td>
          </tr>
        </table>`;
}

/**
 * Shared transactional footer.
 * Brand link, legal links, copyright.
 * @returns {string}
 */
function buildEmailFooter() {
  const year = new Date().getFullYear();

  return `
          <tr>
            <td align="center" style="padding: 32px 32px 40px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 20px; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
                <a href="${APP_URL}" style="color: #1a1a1a; text-decoration: none;">${BRAND}</a>
              </p>
              <p style="margin: 0 0 16px; font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.5; color: #888888;">
                <a href="${TERMS_URL}" style="color: #666666; text-decoration: underline;">Termos de Uso</a>
                &nbsp;&middot;&nbsp;
                <a href="${PRIVACY_URL}" style="color: #666666; text-decoration: underline;">Política de Privacidade</a>
              </p>
              <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 11px; line-height: 1.5; color: #999999;">
                &copy; ${year} ${BRAND} - Todos os direitos reservados
              </p>
            </td>
          </tr>`;
}

/**
 * @param {{
 *   preheader?: string,
 *   title: string,
 *   subtitle?: string,
 *   bodyHtml: string,
 *   ctaLabel?: string,
 *   ctaUrl?: string,
 *   status?: 'success'|'warning'|'neutral'|null,
 * }} params
 * @returns {string}
 */
function wrapEmailHtml({
  preheader = "",
  title,
  subtitle = "",
  bodyHtml,
  ctaLabel,
  ctaUrl,
  status = null,
}) {
  const ctaHtml =
    ctaLabel && ctaUrl ? buildPrimaryButton(ctaLabel, ctaUrl) : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: ${FONT_STACK}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <span style="display: none; max-height: 0; overflow: hidden; mso-hide: all; opacity: 0; color: transparent; visibility: hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f0f0; width: 100%;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e5e5;">
          ${buildBrandHeader()}
          ${buildStatusHeader({ title, subtitle, status })}
          <tr>
            <td style="padding: 24px 32px 8px; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.6; color: #333333;">
              ${bodyHtml}
            </td>
          </tr>
          ${
            ctaHtml
              ? `<tr>
            <td style="padding: 16px 32px 8px;">
              ${ctaHtml}
            </td>
          </tr>`
              : ""
          }
          ${buildEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * @param {string} title
 * @param {string[]} paragraphs
 * @param {{ label?: string, url?: string }} [cta]
 * @returns {string}
 */
function buildPlainText(title, paragraphs, cta) {
  const year = new Date().getFullYear();
  const lines = [title, "", ...paragraphs];

  if (cta?.label && cta?.url) {
    lines.push("", `${cta.label}: ${cta.url}`);
  }

  lines.push(
    "",
    "—",
    `${BRAND}: ${APP_URL}`,
    `Termos de Uso: ${TERMS_URL}`,
    `Política de Privacidade: ${PRIVACY_URL}`,
    `© ${year} ${BRAND} - Todos os direitos reservados`,
  );

  return lines.join("\n");
}

module.exports = {
  APP_URL,
  BRAND,
  FONT_STACK,
  PRIVACY_URL,
  TAGLINE,
  TERMS_URL,
  buildEmailFooter,
  buildPlainText,
  buildPrimaryButton,
  buildStatusHeader,
  buildSummaryCard,
  escapeHtml,
  escapeHref,
  wrapEmailHtml,
};
