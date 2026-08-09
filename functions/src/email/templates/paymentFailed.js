const {
  buildPlainText,
  buildSummaryCard,
  escapeHtml,
  wrapEmailHtml,
} = require("../../emailTemplates/shared");
const { getAppBaseUrl } = require("../../config/app");
const {
  formatAmount,
  resolvePlanDisplayName,
} = require("./paymentSuccess");

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
 * @param {{ includeTime?: boolean }} [options]
 * @returns {string}
 */
function formatBillingDate(value, options = {}) {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    ...(options.includeTime ? { timeStyle: "short" } : {}),
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/**
 * E-mail de falha de cobrança (invoice.payment_failed).
 *
 * @param {{
 *   planId?: string | null,
 *   amount?: number | null,
 *   currency?: string | null,
 *   currentPeriodEnd?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   nextBillingAt?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   nextPaymentAttempt?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   name?: string,
 * }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildPaymentFailedEmail(payload = {}) {
  const planDisplayName = resolvePlanDisplayName(payload.planId);
  const amountLabel = formatAmount(payload.amount, payload.currency);
  const nextRetryLabel = formatBillingDate(payload.nextPaymentAttempt, { includeTime: true });
  const currentPeriodEndLabel = formatBillingDate(payload.currentPeriodEnd);
  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const greetingText = name ? `Olá, ${name}.` : "Olá.";

  const summaryRows = [
    { label: "Plano", value: planDisplayName },
    { label: "Valor", value: amountLabel },
    { label: "Próxima tentativa", value: nextRetryLabel },
    { label: "Validade da assinatura", value: currentPeriodEndLabel },
  ];

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 24px; color: #333333;">
      Não foi possível processar a cobrança da sua assinatura <strong>${escapeHtml(planDisplayName)}</strong>.
    </p>
    ${buildSummaryCard("Detalhes da cobrança", summaryRows)}
    <p style="margin: 0 0 16px; color: #555555; font-size: 15px;">
      <strong>Seu acesso não foi interrompido neste momento.</strong> A Stripe poderá realizar novas tentativas de cobrança automaticamente.
    </p>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Atualize sua forma de pagamento para evitar interrupções futuras.
    </p>`;

  const subject = "Falha na cobrança da sua assinatura FIVI360";

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Não foi possível processar a cobrança de ${amountLabel} do plano ${planDisplayName}.`,
      title: "Falha na cobrança",
      subtitle: "Atualize sua forma de pagamento.",
      bodyHtml,
      ctaLabel: "Atualizar forma de pagamento",
      ctaUrl: getSubscriptionSettingsUrl(),
      status: "warning",
    }),
    text: buildPlainText(
      subject,
      [
        greetingText,
        `Não foi possível processar a cobrança da sua assinatura ${planDisplayName}.`,
        "",
        "Detalhes da cobrança",
        `Plano: ${planDisplayName}`,
        `Valor: ${amountLabel}`,
        `Próxima tentativa: ${nextRetryLabel}`,
        `Validade da assinatura: ${currentPeriodEndLabel}`,
        "",
        "Seu acesso não foi interrompido neste momento. A Stripe poderá realizar novas tentativas de cobrança automaticamente.",
        "Atualize sua forma de pagamento para evitar interrupções futuras.",
      ],
      { label: "Atualizar forma de pagamento", url: getSubscriptionSettingsUrl() },
    ),
  };
}

module.exports = {
  buildPaymentFailedEmail,
};
