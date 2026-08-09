const {
  buildPlainText,
  escapeHtml,
  wrapEmailHtml,
} = require("../../emailTemplates/shared");
const { getAppBaseUrl } = require("../../config/app");
const { resolvePlanDisplayName } = require("./paymentSuccess");

function getSubscriptionSettingsUrl() {
  return `${getAppBaseUrl()}/plan`;
}

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object" && value !== null && typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatPeriodEndDate(value) {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/**
 * E-mail de cancelamento agendado (cancel_at_period_end).
 *
 * @param {{
 *   planId?: string | null,
 *   currentPeriodEnd?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   name?: string,
 * }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildSubscriptionCancellationScheduledEmail(payload = {}) {
  const planDisplayName = resolvePlanDisplayName(payload.planId);
  const currentPeriodEndLabel = formatPeriodEndDate(payload.currentPeriodEnd);
  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const greetingText = name ? `Olá, ${name}.` : "Olá.";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Recebemos sua solicitação de cancelamento da assinatura FIVI360 <strong>${escapeHtml(planDisplayName)}</strong>.
    </p>
    <p style="margin: 0 0 8px; color: #333333;">
      Sua assinatura continuará ativa normalmente até:
    </p>
    <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
      ${escapeHtml(currentPeriodEndLabel)}
    </p>
    <p style="margin: 0 0 8px; color: #333333; font-weight: 600;">Até essa data você continuará tendo acesso a:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333;">
      <li style="margin-bottom: 6px;">Hotspots</li>
      <li style="margin-bottom: 6px;">Portfólio público</li>
      <li style="margin-bottom: 0;">Recursos ${escapeHtml(planDisplayName)}</li>
    </ul>
    <p style="margin: 0 0 8px; color: #333333; font-weight: 600;">Após essa data:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #555555;">
      <li style="margin-bottom: 6px;">Sua conta retornará para o plano Starter</li>
      <li style="margin-bottom: 6px;">O portfólio público será desativado</li>
      <li style="margin-bottom: 0;">Novos hotspots não poderão ser criados</li>
    </ul>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Se mudar de ideia antes do encerramento, você poderá reativar sua assinatura a qualquer momento.
    </p>`;

  const subject = "Sua assinatura será cancelada ao final do período atual";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Cancelamento agendado. Acesso ${planDisplayName} até ${currentPeriodEndLabel}.`,
      title: "Cancelamento agendado",
      subtitle: "Seu acesso continua até o fim do período.",
      bodyHtml,
      ctaLabel: "Gerenciar assinatura",
      ctaUrl: getSubscriptionSettingsUrl(),
      status: "neutral",
    }),
    text: buildPlainText(
      subject,
      [
        greetingText,
        `Recebemos sua solicitação de cancelamento da assinatura FIVI360 ${planDisplayName}.`,
        "Sua assinatura continuará ativa normalmente até:",
        currentPeriodEndLabel,
        "",
        "Até essa data você continuará tendo acesso a:",
        "✓ Hotspots",
        "✓ Portfólio público",
        `✓ Recursos ${planDisplayName}`,
        "",
        "Após essa data:",
        "• Sua conta retornará para o plano Starter",
        "• O portfólio público será desativado",
        "• Novos hotspots não poderão ser criados",
        "",
        "Se mudar de ideia antes do encerramento, você poderá reativar sua assinatura a qualquer momento.",
      ],
      { label: "Gerenciar assinatura", url: getSubscriptionSettingsUrl() },
    ),
  };
}

module.exports = {
  buildSubscriptionCancellationScheduledEmail,
};
