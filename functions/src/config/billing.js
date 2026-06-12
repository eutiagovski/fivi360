/**
 * Configuração de billing no backend — Mercado Pago.
 *
 * IDs de plano MP: MP_PLAN_PROFESSIONAL e MP_PLAN_ENTERPRISE
 * (functions/.secret.local no emulador; Firebase Secrets em produção).
 * Não usar variáveis REACT_APP_* — IDs ficam somente no backend.
 */

const BILLING_UPGRADE_PLAN_IDS = ["professional", "enterprise"];

const BILLING_PLANS = {
  professional: {
    id: "professional",
    name: "Professional",
    price: 49,
    currency: "BRL",
    interval: "month",
    mpPlanEnv: "MP_PLAN_PROFESSIONAL",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    currency: "BRL",
    interval: "month",
    mpPlanEnv: "MP_PLAN_ENTERPRISE",
  },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/**
 * @param {string | null | undefined} planId
 * @returns {planId is "professional" | "enterprise"}
 */
function isBillingUpgradePlanId(planId) {
  return BILLING_UPGRADE_PLAN_IDS.includes(planId);
}

/**
 * @param {"professional" | "enterprise"} planId
 * @returns {typeof BILLING_PLANS["professional"] | null}
 */
function getBillingPlanConfig(planId) {
  return BILLING_PLANS[planId] ?? null;
}

/**
 * @param {"professional" | "enterprise"} planId
 * @returns {string}
 */
function getMercadoPagoPlanId(planId) {
  const config = getBillingPlanConfig(planId);
  if (!config?.mpPlanEnv) {
    return "";
  }

  return process.env[config.mpPlanEnv]?.trim() ?? "";
}

/**
 * @param {"professional" | "enterprise"} planId
 * @returns {string | null} Mensagem de erro se o ID do plano MP não estiver configurado.
 */
function getMercadoPagoPlanConfigError(planId) {
  const config = getBillingPlanConfig(planId);
  if (!config?.mpPlanEnv) {
    return null;
  }

  if (!getMercadoPagoPlanId(planId)) {
    return `${config.mpPlanEnv} não configurado`;
  }

  return null;
}

/**
 * @param {"professional" | "enterprise"} planId
 * @returns {boolean}
 */
function hasMercadoPagoPlanConfiguration(planId) {
  return getMercadoPagoPlanConfigError(planId) === null;
}

/**
 * @param {"professional" | "enterprise"} planId
 * @returns {string}
 */
function requireMercadoPagoPlanId(planId) {
  const error = getMercadoPagoPlanConfigError(planId);
  if (error) {
    throw new Error(error);
  }

  return getMercadoPagoPlanId(planId);
}

/**
 * Resolve plano interno a partir do ID do plano Mercado Pago.
 * @param {string | null | undefined} mpPlanId
 * @returns {"professional" | "enterprise" | null}
 */
function resolvePlanIdFromMpPlanId(mpPlanId) {
  const normalized = String(mpPlanId || "").trim();
  if (!normalized) {
    return null;
  }

  for (const planId of BILLING_UPGRADE_PLAN_IDS) {
    if (getMercadoPagoPlanId(planId) === normalized) {
      return planId;
    }
  }

  return null;
}

/**
 * Status MP de preapproval → status interno de assinatura.
 * @param {string | null | undefined} mpStatus
 * @returns {"inactive" | "active" | "trialing" | "past_due" | "canceled" | "unpaid"}
 */
function mapMercadoPagoPreapprovalStatus(mpStatus) {
  const normalized = String(mpStatus || "").trim().toLowerCase();

  switch (normalized) {
    case "authorized":
    case "approved":
      return "active";
    case "pending":
      return "inactive";
    case "paused":
      return "past_due";
    case "cancelled":
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

/**
 * @param {string | null | undefined} mpStatus
 * @returns {boolean}
 */
function isMercadoPagoPaymentApproved(mpStatus) {
  return String(mpStatus || "").trim().toLowerCase() === "approved";
}

module.exports = {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BILLING_UPGRADE_PLAN_IDS,
  getBillingPlanConfig,
  getMercadoPagoPlanConfigError,
  getMercadoPagoPlanId,
  hasMercadoPagoPlanConfiguration,
  isBillingUpgradePlanId,
  isMercadoPagoPaymentApproved,
  mapMercadoPagoPreapprovalStatus,
  requireMercadoPagoPlanId,
  resolvePlanIdFromMpPlanId,
};
