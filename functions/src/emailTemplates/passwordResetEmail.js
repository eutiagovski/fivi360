const { buildPlainText, wrapEmailHtml } = require("./shared");

/**
 * E-mail de redefinição de senha.
 *
 * @param {{ resetLink?: string }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function passwordResetEmail(payload = {}) {
  const resetLink = (payload.resetLink || "").trim();

  if (!resetLink) {
    throw new Error("passwordResetEmail template requires resetLink in payload");
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">Olá.</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Se você não solicitou esta alteração, ignore este e-mail.
    </p>`;

  const subject = "Redefina sua senha no FIVI360";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: "Redefina sua senha para acessar o FIVI360.",
      title: "Redefinir senha",
      bodyHtml,
      ctaLabel: "Redefinir senha",
      ctaUrl: resetLink,
      status: "neutral",
    }),
    text: buildPlainText(
      subject,
      [
        "Olá.",
        "Recebemos uma solicitação para redefinir a senha da sua conta.",
        "Se você não solicitou esta alteração, ignore este e-mail.",
      ],
      { label: "Redefinir senha", url: resetLink },
    ),
  };
}

module.exports = { passwordResetEmail };
