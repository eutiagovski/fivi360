const { buildPlainText, wrapEmailHtml } = require("../../emailTemplates/shared");
const { APP_BASE_URL } = require("../../config/app");
const { resolvePlanDisplayName } = require("./paymentSuccess");

const REACTIVATE_SUBSCRIPTION_URL = `${APP_BASE_URL}/plan`;

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
function formatCanceledDate(value) {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/**
 * E-mail de assinatura encerrada (customer.subscription.deleted).
 *
 * @param {{
 *   planIdAnterior?: string | null,
 *   canceledAt?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   name?: string,
 * }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildSubscriptionCanceledEmail(payload = {}) {
  const planDisplayName = resolvePlanDisplayName(payload.planIdAnterior);
  const canceledAtLabel = formatCanceledDate(payload.canceledAt);
  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Sua assinatura <strong>${planDisplayName}</strong> foi encerrada em <strong>${canceledAtLabel}</strong>.
    </p>
    <p style="margin: 0 0 16px; color: #333333;">
      Seu plano voltou para <strong>Starter</strong>.
    </p>
    <p style="margin: 0 0 8px; color: #333333; font-weight: 600;">O que foi preservado:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333;">
      <li style="margin-bottom: 6px;">Projetos foram preservados</li>
      <li style="margin-bottom: 6px;">Imagens foram preservadas</li>
      <li style="margin-bottom: 0;">Hotspots existentes foram preservados</li>
    </ul>
    <p style="margin: 0 0 8px; color: #333333; font-weight: 600;">O que mudou no Starter:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #555555;">
      <li style="margin-bottom: 6px;">Portfólio público foi desativado</li>
      <li style="margin-bottom: 0;">Novos hotspots não podem ser criados</li>
    </ul>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Você pode reativar sua assinatura a qualquer momento para recuperar todos os recursos do plano pago.
    </p>`;

  const subject = "Sua assinatura FIVI360 foi encerrada";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Sua assinatura ${planDisplayName} foi encerrada. Seu plano voltou para Starter.`,
      title: "Assinatura encerrada",
      bodyHtml,
      ctaLabel: "Reativar assinatura",
      ctaUrl: REACTIVATE_SUBSCRIPTION_URL,
    }),
    text: buildPlainText(
      subject,
      [
        greeting,
        `Sua assinatura ${planDisplayName} foi encerrada em ${canceledAtLabel}.`,
        "Seu plano voltou para Starter.",
        "",
        "O que foi preservado:",
        "✓ Projetos foram preservados",
        "✓ Imagens foram preservadas",
        "✓ Hotspots existentes foram preservados",
        "",
        "O que mudou no Starter:",
        "• Portfólio público foi desativado",
        "• Novos hotspots não podem ser criados",
        "",
        "Você pode reativar sua assinatura a qualquer momento para recuperar todos os recursos do plano pago.",
      ],
      { label: "Reativar assinatura", url: REACTIVATE_SUBSCRIPTION_URL },
    ),
  };
}

module.exports = {
  buildSubscriptionCanceledEmail,
};
