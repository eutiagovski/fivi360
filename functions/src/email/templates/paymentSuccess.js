const {
  buildPlainText,
  buildSummaryCard,
  escapeHtml,
  wrapEmailHtml,
} = require("../../emailTemplates/shared");
const { getAppBaseUrl } = require("../../config/app");
const { normalizeToDate, formatBillingDatePtBr } = require("../dateUtils");

const PLAN_DISPLAY_NAMES = {
  professional: "Professional",
  studio: "Studio",
  enterprise: "Enterprise",
  starter: "Starter",
};

function getSubscriptionSettingsUrl() {
  return `${getAppBaseUrl()}/plan`;
}

/**
 * @param {string | null | undefined} planId
 * @returns {string}
 */
function resolvePlanDisplayName(planId) {
  if (!planId || typeof planId !== "string") {
    return "Professional";
  }

  const normalized = planId.trim().toLowerCase();
  return PLAN_DISPLAY_NAMES[normalized] || planId.charAt(0).toUpperCase() + planId.slice(1);
}

/**
 * @param {number | null | undefined} amountCents
 * @param {string | null | undefined} currency
 * @returns {string}
 */
function formatAmount(amountCents, currency) {
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    return "—";
  }

  const code = (currency || "brl").toUpperCase();

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: code,
  }).format(amountCents / 100);
}

/**
 * @param {unknown} value
 * @param {{ includeTime?: boolean }} [options]
 * @returns {string}
 */
function formatBillingDate(value, options = {}) {
  return formatBillingDatePtBr(value, options) ?? "—";
}

/**
 * @param {number | null | undefined} unixSeconds
 * @returns {string}
 */
function formatPaymentDate(unixSeconds) {
  return formatBillingDate(unixSeconds, { includeTime: true });
}

/**
 * E-mail de confirmação de pagamento (invoice.paid).
 *
 * @param {{
 *   planId?: string | null,
 *   amount?: number | null,
 *   currency?: string | null,
 *   paidAt?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   paidAtUnix?: number | null,
 *   currentPeriodEnd?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   nextBillingAt?: import("firebase-admin/firestore").Timestamp | Date | number | null,
 *   name?: string,
 * }} payload
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildPaymentSuccessEmail(payload = {}) {
  const planDisplayName = resolvePlanDisplayName(payload.planId);
  const amountLabel = formatAmount(payload.amount, payload.currency);
  const paidAtLabel = formatBillingDate(payload.paidAt ?? payload.paidAtUnix, {
    includeTime: true,
  });

  const currentPeriodEndDate = normalizeToDate(payload.currentPeriodEnd);
  const nextBillingAtDate =
    normalizeToDate(payload.nextBillingAt) ?? currentPeriodEndDate;

  const currentPeriodEndLabel = currentPeriodEndDate
    ? formatBillingDatePtBr(currentPeriodEndDate)
    : null;
  const nextBillingAtLabel = nextBillingAtDate
    ? formatBillingDatePtBr(nextBillingAtDate)
    : null;

  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const greetingText = name ? `Olá, ${name}.` : "Olá.";

  const summaryRows = [
    { label: "Plano", value: planDisplayName },
    { label: "Valor", value: amountLabel },
    { label: "Data", value: paidAtLabel },
  ];

  if (currentPeriodEndLabel) {
    summaryRows.push({
      label: "Validade da assinatura",
      value: currentPeriodEndLabel,
    });
  }

  if (nextBillingAtLabel) {
    summaryRows.push({
      label: "Próxima cobrança",
      value: nextBillingAtLabel,
    });
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Seu pagamento foi confirmado e sua assinatura FIVI360 <strong>${escapeHtml(planDisplayName)}</strong> está ativa.
    </p>
    <p style="margin: 0 0 24px; color: #555555; font-size: 15px;">
      Você pode continuar criando, apresentando e compartilhando suas experiências 360° normalmente.
    </p>
    ${buildSummaryCard("Resumo da cobrança", summaryRows)}
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Você pode consultar suas cobranças e gerenciar sua assinatura a qualquer momento.
    </p>`;

  const subject = `Pagamento confirmado — FIVI360 ${planDisplayName}`;

  const textLines = [
    greetingText,
    `Seu pagamento foi confirmado e sua assinatura FIVI360 ${planDisplayName} está ativa.`,
    "Você pode continuar criando, apresentando e compartilhando suas experiências 360° normalmente.",
    "",
    "Resumo da cobrança",
    `Plano: ${planDisplayName}`,
    `Valor: ${amountLabel}`,
    `Data: ${paidAtLabel}`,
  ];

  if (currentPeriodEndLabel) {
    textLines.push(`Validade da assinatura: ${currentPeriodEndLabel}`);
  }

  if (nextBillingAtLabel) {
    textLines.push(`Próxima cobrança: ${nextBillingAtLabel}`);
  }

  textLines.push(
    "",
    "Você pode consultar suas cobranças e gerenciar sua assinatura a qualquer momento.",
  );

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Pagamento de ${amountLabel} confirmado para o plano ${planDisplayName}.`,
      title: "Pagamento confirmado",
      subtitle: "Sua assinatura está ativa.",
      bodyHtml,
      ctaLabel: "Gerenciar assinatura",
      ctaUrl: getSubscriptionSettingsUrl(),
      status: "success",
    }),
    text: buildPlainText(subject, textLines, {
      label: "Gerenciar assinatura",
      url: getSubscriptionSettingsUrl(),
    }),
  };
}

module.exports = {
  buildPaymentSuccessEmail,
  formatAmount,
  formatPaymentDate,
  resolvePlanDisplayName,
};
