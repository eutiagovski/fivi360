const {
  APP_URL,
  buildPlainText,
  escapeHtml,
  wrapEmailHtml,
} = require("./shared");

/**
 * E-mail de boas-vindas após cadastro.
 *
 * @param {{ name?: string, companyName?: string }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function welcomeEmail(payload = {}) {
  const name = (payload.name || "").trim();
  const companyName =
    typeof payload.companyName === "string" ? payload.companyName.trim() : "";
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const greetingText = name ? `Olá, ${name}.` : "Olá.";
  const companyLine = companyName
    ? `<p style="margin: 0 0 16px; color: #333333;">Sua conta para <strong>${escapeHtml(companyName)}</strong> está pronta.</p>`
    : "";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    ${companyLine}
    <p style="margin: 0 0 16px; color: #333333;">
      Bem-vindo ao FIVI360 — a forma mais elegante de apresentar projetos imobiliários em 360°.
    </p>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Crie seu primeiro projeto, envie panoramas e compartilhe experiências imersivas com clientes.
    </p>`;

  const subject = "Bem-vindo ao FIVI360";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: "Sua conta FIVI360 está pronta. Comece seu primeiro projeto.",
      title: "Bem-vindo ao FIVI360",
      subtitle: "Sua conta está pronta.",
      bodyHtml,
      ctaLabel: "Acessar meu painel",
      ctaUrl: `${APP_URL}/dashboard`,
      status: "success",
    }),
    text: buildPlainText(
      subject,
      [
        greetingText,
        companyName
          ? `Sua conta para ${companyName} está pronta.`
          : "Sua conta está pronta.",
        "Bem-vindo ao FIVI360 — apresente projetos imobiliários em 360°.",
        "Crie seu primeiro projeto e compartilhe experiências imersivas com clientes.",
      ],
      { label: "Acessar meu painel", url: `${APP_URL}/dashboard` },
    ),
  };
}

module.exports = { welcomeEmail };
