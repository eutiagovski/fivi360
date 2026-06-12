const { logger } = require("firebase-functions");
const { MP_API_BASE } = require("./client");

const IS_DEVELOPMENT =
  process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV !== "production";

/**
 * @param {string} email
 * @returns {string}
 */
function maskEmailForLog(email) {
  const trimmed = String(email || "").trim();
  const at = trimmed.indexOf("@");

  if (at <= 0) {
    return "***";
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedLocal = local.length <= 1 ? "*" : `${local[0]}***`;

  return `${maskedLocal}@${domain}`;
}

/**
 * @param {string} accessToken
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
async function mercadoPagoApiRequest(accessToken, path, options = {}) {
  return fetch(`${MP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Cria assinatura (preapproval) no Mercado Pago e retorna a URL de checkout.
 *
 * @param {{
 *   accessToken: string,
 *   planConfig: { name: string },
 *   mpPlanId: string,
 *   userId: string,
 *   planId: string,
 *   payerEmail: string,
 *   backUrl: string,
 * }} params
 * @returns {Promise<{ checkoutUrl: string, preapprovalId: string }>}
 */
async function createSubscriptionPreapproval({
  accessToken,
  planConfig,
  mpPlanId,
  userId,
  planId,
  payerEmail,
  backUrl,
}) {
  const metadata = { userId, planId };
  const externalReference = JSON.stringify(metadata);
  const reason = `FIVI360 — Plano ${planConfig.name}`;

  /** @type {Record<string, unknown>} */
  const body = {
    preapproval_plan_id: mpPlanId,
    reason,
    external_reference: externalReference,
    payer_email: payerEmail,
    back_url: backUrl,
    status: "pending",
    metadata,
  };

  if (IS_DEVELOPMENT) {
    logger.info("Mercado Pago preapproval payload (sanitized)", {
      planId,
      hasMpPlanId: Boolean(mpPlanId),
      back_url: backUrl,
      payer_email: maskEmailForLog(payerEmail),
      external_reference: externalReference,
      reason,
      status: "pending",
    });
  }

  const response = await mercadoPagoApiRequest(accessToken, "/preapproval", {
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

  const checkoutUrl =
    typeof payload.init_point === "string" ? payload.init_point : "";
  const preapprovalId = typeof payload.id === "string" ? payload.id : "";

  if (!checkoutUrl) {
    throw new Error("Mercado Pago não retornou URL de checkout.");
  }

  return { checkoutUrl, preapprovalId };
}

module.exports = {
  createSubscriptionPreapproval,
  maskEmailForLog,
  mercadoPagoApiRequest,
};
