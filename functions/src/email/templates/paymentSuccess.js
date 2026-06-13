const { buildPlainText, wrapEmailHtml } = require("../../emailTemplates/shared");
const { APP_BASE_URL } = require("../../config/app");

const PLAN_DISPLAY_NAMES = {
  professional: "Professional",
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
  const currentPeriodEndLabel = formatBillingDate(payload.currentPeriodEnd);
  const nextBillingAtLabel = formatBillingDate(payload.nextBillingAt);
  const name = (payload.name || "").trim();
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Confirmamos o recebimento do seu pagamento. Sua assinatura <strong>${planDisplayName}</strong> está ativa.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; margin: 0 0 20px; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666; width: 40%;">Valor</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a; font-weight: 600;">${amountLabel}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Data</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${paidAtLabel}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Plano</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${planDisplayName}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Validade da assinatura</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${currentPeriodEndLabel}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Próxima cobrança</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${nextBillingAtLabel}</td>
      </tr>
    </table>
    <p style="margin: 0; color: #555555; font-size: 15px;">
      Obrigado por confiar no FIVI360. Você pode consultar detalhes da assinatura em
      <strong>Configurações → Assinatura</strong> no painel.
    </p>`;

  const subject = `Pagamento confirmado — FIVI360 ${planDisplayName}`;

  return {
    subject,
    html: wrapEmailHtml({
      preheader: `Pagamento de ${amountLabel} confirmado para o plano ${planDisplayName}.`,
      title: "Pagamento confirmado",
      bodyHtml,
      ctaLabel: "Gerenciar assinatura",
      ctaUrl: SUBSCRIPTION_SETTINGS_URL,
    }),
    text: buildPlainText(
      subject,
      [
        greeting,
        "Confirmamos o recebimento do seu pagamento.",
        `Valor: ${amountLabel}`,
        `Data: ${paidAtLabel}`,
        `Plano: ${planDisplayName}`,
        `Validade da assinatura: ${currentPeriodEndLabel}`,
        `Próxima cobrança: ${nextBillingAtLabel}`,
        "Obrigado por confiar no FIVI360.",
        "Consulte detalhes da assinatura em Configurações → Assinatura no painel.",
      ],
      { label: "Gerenciar assinatura", url: SUBSCRIPTION_SETTINGS_URL },
    ),
  };
}

module.exports = {
  buildPaymentSuccessEmail,
  formatAmount,
  formatPaymentDate,
  resolvePlanDisplayName,
};
