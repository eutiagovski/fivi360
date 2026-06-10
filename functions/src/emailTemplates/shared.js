/**
 * Layout compartilhado — cores neutras, legível em clientes dark/light.
 * Estilos inline (compatibilidade com Gmail, Outlook, etc.).
 */

const BRAND = "FIVI360";
const APP_URL = "https://fivi360.com.br";

/**
 * @param {{
 *   preheader?: string,
 *   title: string,
 *   bodyHtml: string,
 *   ctaLabel?: string,
 *   ctaUrl?: string,
 * }} params
 * @returns {string}
 */
function wrapEmailHtml({ preheader = "", title, bodyHtml, ctaLabel, ctaUrl }) {
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td style="padding: 28px 0 8px;">
            <a href="${ctaUrl}"
               style="display: inline-block; background-color: #1a1a1a; color: #f5f5f5; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px; border: 1px solid #333333;">
              ${ctaLabel}
            </a>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ececec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <span style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ececec; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #d4d4d4; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 16px; border-bottom: 1px solid #e8e8e8;">
              <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #666666;">${BRAND}</p>
              <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 600; line-height: 1.35; color: #1a1a1a;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px; font-size: 16px; line-height: 1.6; color: #333333;">
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #f7f7f7; border-top: 1px solid #e8e8e8; font-size: 12px; line-height: 1.5; color: #777777;">
              Este é um e-mail transacional do ${BRAND}. Você o recebeu porque possui uma conta conosco.
            </td>
          </tr>
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
  const lines = [title, "", ...paragraphs];

  if (cta?.label && cta?.url) {
    lines.push("", `${cta.label}: ${cta.url}`);
  }

  lines.push("", `— ${BRAND}`, APP_URL);
  return lines.join("\n");
}

module.exports = {
  APP_URL,
  BRAND,
  buildPlainText,
  wrapEmailHtml,
};
