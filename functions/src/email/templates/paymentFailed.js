const { buildPlainText, wrapEmailHtml } = require("../../emailTemplates/shared");
const { APP_BASE_URL } = require("../../config/app");
const {
  formatAmount,
  resolvePlanDisplayName,
} = require("./paymentSuccess");

const SUBSCRIPTION_SETTINGS_URL = `${APP_BASE_URL}/plan`;

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
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: #333333;">${greeting}</p>
    <p style="margin: 0 0 16px; color: #333333;">
      Não foi possível processar a cobrança da sua assinatura <strong>${planDisplayName}</strong>.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; margin: 0 0 20px; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666; width: 40%;">Valor</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a; font-weight: 600;">${amountLabel}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Plano</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${planDisplayName}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Próxima tentativa</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${nextRetryLabel}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; background-color: #f7f7f7; font-size: 13px; color: #666666;">Validade da assinatura</td>
        <td style="padding: 12px 16px; font-size: 15px; color: #1a1a1a;">${currentPeriodEndLabel}</td>
      </tr>
    </table>
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
      bodyHtml,
      ctaLabel: "Atualizar forma de pagamento",
      ctaUrl: SUBSCRIPTION_SETTINGS_URL,
    }),
    text: buildPlainText(
      subject,
      [
        greeting,
        `Não foi possível processar a cobrança da sua assinatura ${planDisplayName}.`,
        `Valor: ${amountLabel}`,
        `Plano: ${planDisplayName}`,
        `Próxima tentativa: ${nextRetryLabel}`,
        `Validade da assinatura: ${currentPeriodEndLabel}`,
        "Seu acesso não foi interrompido neste momento. A Stripe poderá realizar novas tentativas de cobrança automaticamente.",
        "Atualize sua forma de pagamento para evitar interrupções futuras.",
      ],
      { label: "Atualizar forma de pagamento", url: SUBSCRIPTION_SETTINGS_URL },
    ),
  };
}

module.exports = {
  buildPaymentFailedEmail,
};
