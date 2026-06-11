const { buildPlainText, wrapEmailHtml } = require("./shared");

/**
 * E-mail de confirmação de cadastro (verificação de e-mail).
 *
 * @param {{ name?: string, verificationLink?: string }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function verifyEmail(payload = {}) {
  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${name}!` : "Olá!";
  const verificationLink = (payload.verificationLink || "").trim();

  if (!verificationLink) {
    throw new Error("verifyEmail template requires verificationLink in payload");
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Obrigado por se cadastrar no FIVI360. Para ativar sua conta, confirme seu endereço de e-mail.
    </p>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Se você não criou uma conta no FIVI360, ignore este e-mail.
    </p>`;

  const subject = "Confirme seu cadastro no FIVI360";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: "Confirme seu e-mail para ativar sua conta FIVI360.",
      title: "Confirme seu e-mail",
      bodyHtml,
      ctaLabel: "Confirmar e-mail",
      ctaUrl: verificationLink,
    }),
    text: buildPlainText(
      subject,
      [
        greeting,
        "Obrigado por se cadastrar no FIVI360. Para ativar sua conta, confirme seu endereço de e-mail.",
        "Se você não criou uma conta no FIVI360, ignore este e-mail.",
      ],
      { label: "Confirmar e-mail", url: verificationLink },
    ),
  };
}

module.exports = { verifyEmail };
