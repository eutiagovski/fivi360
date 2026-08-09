const {
  APP_URL,
  buildPlainText,
  escapeHtml,
  wrapEmailHtml,
} = require("./shared");

/**
 * Confirmação de solicitação de upgrade (checkout ainda não ativo).
 *
 * @param {{ name?: string, planId?: string, planName?: string }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function upgradeRequestedEmail(payload = {}) {
  const name = (payload.name || "").trim();
  const planNameRaw = payload.planName || payload.planId || "Professional";
  const planName = String(planNameRaw);
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const greetingText = name ? `Olá, ${name}.` : "Olá.";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Recebemos sua solicitação de upgrade para o plano <strong>${escapeHtml(planName)}</strong>.
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
      status: "neutral",
    }),
    text: buildPlainText(
      subject,
      [
        greetingText,
        `Recebemos sua solicitação de upgrade para o plano ${planName}.`,
        "Nossa equipe está preparando a cobrança online.",
        "Em breve você poderá concluir a assinatura diretamente pelo painel.",
      ],
      { label: "Ver planos", url: `${APP_URL}/plan` },
    ),
  };
}

module.exports = { upgradeRequestedEmail };
