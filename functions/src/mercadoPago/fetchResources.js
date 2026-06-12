const { mercadoPagoApiRequest } = require("./preapproval");

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * @param {string} accessToken
 * @param {string} paymentId
 * @returns {Promise<{
 *   id: string,
 *   status: string,
 *   payerEmail: string,
 *   transactionAmount: number | null,
 *   currencyId: string,
 *   dateApproved: string | null,
 *   externalReference: string,
 *   metadata: Record<string, unknown> | null,
 * }>}
 */
async function fetchMercadoPagoPayment(accessToken, paymentId) {
  const response = await mercadoPagoApiRequest(
    accessToken,
    `/v1/payments/${encodeURIComponent(paymentId)}`,
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Mercado Pago payment API returned ${response.status}`;
    throw new Error(message);
  }

  const payer =
    payload.payer && typeof payload.payer === "object"
      ? /** @type {{ email?: unknown }} */ (payload.payer)
      : null;

  const metadata =
    payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? /** @type {Record<string, unknown>} */ (payload.metadata)
      : null;

  return {
    id: asString(payload.id) || paymentId,
    status: asString(payload.status),
    payerEmail: asString(payer?.email),
    transactionAmount: asNumber(payload.transaction_amount),
    currencyId: asString(payload.currency_id) || "BRL",
    dateApproved: asString(payload.date_approved) || null,
    externalReference: asString(payload.external_reference),
    metadata,
  };
}

/**
 * @param {string} accessToken
 * @param {string} preapprovalId
 * @returns {Promise<{
 *   id: string,
 *   status: string,
 *   payerEmail: string,
 *   preapprovalPlanId: string,
 *   reason: string,
 *   externalReference: string,
 *   nextPaymentDate: string | null,
 *   dateCreated: string | null,
 *   metadata: Record<string, unknown> | null,
 * }>}
 */
async function fetchMercadoPagoPreapproval(accessToken, preapprovalId) {
  const response = await mercadoPagoApiRequest(
    accessToken,
    `/preapproval/${encodeURIComponent(preapprovalId)}`,
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Mercado Pago preapproval API returned ${response.status}`;
    throw new Error(message);
  }

  const metadata =
    payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? /** @type {Record<string, unknown>} */ (payload.metadata)
      : null;

  return {
    id: asString(payload.id) || preapprovalId,
    status: asString(payload.status),
    payerEmail: asString(payload.payer_email),
    preapprovalPlanId: asString(payload.preapproval_plan_id),
    reason: asString(payload.reason),
    externalReference: asString(payload.external_reference),
    nextPaymentDate: asString(payload.next_payment_date) || null,
    dateCreated: asString(payload.date_created) || null,
    metadata,
  };
}

module.exports = {
  fetchMercadoPagoPayment,
  fetchMercadoPagoPreapproval,
};
