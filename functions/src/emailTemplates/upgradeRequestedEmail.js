const { APP_URL, buildPlainText, wrapEmailHtml } = require("./shared");

/**
 * Confirmação de solicitação de upgrade (checkout ainda não ativo).
 *
 * @param {{ name?: string, planId?: string, planName?: string }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function upgradeRequestedEmail(payload = {}) {
  const name = (payload.name || "").trim();
  const planName = payload.planName || payload.planId || "Professional";
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Recebemos sua solicitação de upgrade para o plano <strong>${planName}</strong>.
    </p>
    <p style="margin: 0 0 16px; color: #555555; font-size: 15px;">
      Nossa equipe está preparando a cobrança online. Em breve você poderá concluir a assinatura diretamente pelo painel.
    </p>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Enquanto isso, continue usando o FIVI360 normalmente. Avisaremos assim que o checkout estiver disponível.
    </p>`;

  const subject = `Upgrade para ${planName} — solicitação recebida`;

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Solicitação de upgrade para ${planName} registrada.`,
      title: "Solicitação de upgrade recebida",
      bodyHtml,
      ctaLabel: "Ver planos",
      ctaUrl: `${APP_URL}/plan`,
    }),
    text: buildPlainText(
      subject,
      [
        greeting,
        `Recebemos sua solicitação de upgrade para o plano ${planName}.`,
        "Nossa equipe está preparando a cobrança online.",
        "Em breve você poderá concluir a assinatura diretamente pelo painel.",
      ],
      { label: "Ver planos", url: `${APP_URL}/plan` },
    ),
  };
}

module.exports = { upgradeRequestedEmail };
