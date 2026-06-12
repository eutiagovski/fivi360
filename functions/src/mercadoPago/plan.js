const { mercadoPagoApiRequest } = require("./preapproval");

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/**
 * Consulta GET /preapproval_plan/{id} e normaliza dados do plano.
 *
 * @param {string} accessToken
 * @param {string} mpPlanId
 * @returns {Promise<{
 *   mpPlanId: string,
 *   collectorId: string,
 *   reason: string,
 *   status: string,
 *   initPoint: string,
 *   dateCreated: string,
 *   autoRecurring: {
 *     frequency: number | null,
 *     frequencyType: string,
 *     transactionAmount: number | null,
 *     currencyId: string,
 *   },
 *   paymentMethodsAllowed: unknown,
 *   liveMode: boolean | null,
 *   looksLikeProduction: boolean,
 * }>}
 */
async function fetchMercadoPagoPreapprovalPlan(accessToken, mpPlanId) {
  const response = await mercadoPagoApiRequest(
    accessToken,
    `/preapproval_plan/${encodeURIComponent(mpPlanId)}`,
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Mercado Pago API returned ${response.status}`;
    throw new Error(message);
  }

  const liveMode = typeof payload.live_mode === "boolean" ? payload.live_mode : null;
  const autoRecurringRaw =
    payload.auto_recurring && typeof payload.auto_recurring === "object"
      ? payload.auto_recurring
      : null;
  const transactionAmount =
    autoRecurringRaw && typeof autoRecurringRaw.transaction_amount === "number"
      ? autoRecurringRaw.transaction_amount
      : null;
  const frequency =
    autoRecurringRaw && typeof autoRecurringRaw.frequency === "number"
      ? autoRecurringRaw.frequency
      : null;

  return {
    mpPlanId: asString(payload.id) || mpPlanId,
    collectorId: asString(payload.collector_id),
    reason: asString(payload.reason),
    status: asString(payload.status),
    initPoint: asString(payload.init_point),
    dateCreated: asString(payload.date_created),
    autoRecurring: {
      frequency,
      frequencyType: asString(autoRecurringRaw?.frequency_type),
      transactionAmount,
      currencyId: asString(autoRecurringRaw?.currency_id),
    },
    paymentMethodsAllowed: payload.payment_methods_allowed ?? null,
    liveMode,
    looksLikeProduction: liveMode === true,
  };
}

/**
 * Cria plano de assinatura recorrente via POST /preapproval_plan.
 *
 * @param {{
 *   accessToken: string,
 *   name: string,
 *   amount: number,
 *   backUrl: string,
 * }} params
 * @returns {Promise<{ planId: string, initPoint: string, rawResponse: unknown }>}
 */
async function createMercadoPagoPreapprovalPlan({ accessToken, name, amount, backUrl }) {
  /** @type {Record<string, unknown>} */
  const body = {
    reason: name,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "BRL",
    },
    back_url: backUrl,
  };

  const response = await mercadoPagoApiRequest(accessToken, "/preapproval_plan", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Mercado Pago API returned ${response.status}`;
    throw new Error(message);
  }

  return {
    planId: typeof payload.id === "string" ? payload.id : "",
    initPoint: typeof payload.init_point === "string" ? payload.init_point : "",
    rawResponse: payload,
  };
}

module.exports = {
  createMercadoPagoPreapprovalPlan,
  fetchMercadoPagoPreapprovalPlan,
};
