const { buildPlainText, wrapEmailHtml } = require("../../emailTemplates/shared");
const { APP_BASE_URL } = require("../../config/app");
const { normalizeToDate, formatBillingDatePtBr } = require("../dateUtils");

const PLAN_DISPLAY_NAMES = {
  professional: "Professional",
  studio: "Studio",
  enterprise: "Enterprise",
  starter: "Starter",
};

const SUBSCRIPTION_SETTINGS_URL = `${APP_BASE_URL}/plan`;

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
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function buildDetailRow(label, value) {
  return `
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666; width: 40%;">${label}</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${value}</td>
      </tr>`;
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
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const optionalRows = [
    currentPeriodEndLabel
      ? buildDetailRow("Validade da assinatura", currentPeriodEndLabel)
      : "",
    nextBillingAtLabel ? buildDetailRow("Próxima cobrança", nextBillingAtLabel) : "",
  ].join("");

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Confirmamos o recebimento do seu pagamento. Sua assinatura <strong>${planDisplayName}</strong> está ativa.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; margin: 0 0 20px; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
      ${buildDetailRow("Valor", amountLabel)}
      ${buildDetailRow("Data", paidAtLabel)}
      ${buildDetailRow("Plano", planDisplayName)}
      ${optionalRows}
    </table>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Obrigado por confiar no FIVI360. Você pode consultar detalhes da assinatura em
      <strong>Configurações → Assinatura</strong> no painel.
    </p>`;

  const subject = `Pagamento confirmado — FIVI360 ${planDisplayName}`;

  const textLines = [
    greeting,
    "Confirmamos o recebimento do seu pagamento.",
    `Valor: ${amountLabel}`,
    `Data: ${paidAtLabel}`,
    `Plano: ${planDisplayName}`,
  ];

  if (currentPeriodEndLabel) {
    textLines.push(`Validade da assinatura: ${currentPeriodEndLabel}`);
  }

  if (nextBillingAtLabel) {
    textLines.push(`Próxima cobrança: ${nextBillingAtLabel}`);
  }

  textLines.push(
    "Obrigado por confiar no FIVI360.",
    "Consulte detalhes da assinatura em Configurações → Assinatura no painel.",
  );

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Pagamento de ${amountLabel} confirmado para o plano ${planDisplayName}.`,
      title: "Pagamento confirmado",
      bodyHtml,
      ctaLabel: "Gerenciar assinatura",
      ctaUrl: SUBSCRIPTION_SETTINGS_URL,
    }),
    text: buildPlainText(subject, textLines, {
      label: "Gerenciar assinatura",
      url: SUBSCRIPTION_SETTINGS_URL,
    }),
  };
}

module.exports = {
  buildPaymentSuccessEmail,
  formatAmount,
  formatPaymentDate,
  resolvePlanDisplayName,
};
