/**
 * Configuração e modelo de billing agnóstico ao provedor de pagamento.
 * Compatível com usuários antigos (campos legados stripe* migrados na leitura).
 */

import { PLAN_IDS } from "@/config/planLimits";

export const BILLING_PROVIDER = {
  STRIPE: "stripe",
  MERCADO_PAGO: "mercado_pago",
};

export const ACTIVE_BILLING_PROVIDER =
  process.env.REACT_APP_BILLING_PROVIDER || BILLING_PROVIDER.MERCADO_PAGO;

export const BILLING_STATUS = {
  FREE: "free",
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
};

export const BILLING_PLANS = {
  professional: {
    id: "professional",
    name: "Professional",
    price: 49,
    currency: "BRL",
    interval: "month",
    stripePriceIdEnv: "REACT_APP_STRIPE_PRICE_PROFESSIONAL",
    mercadoPagoPlanIdEnv: "REACT_APP_MP_PLAN_PROFESSIONAL",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    currency: "BRL",
    interval: "month",
    stripePriceIdEnv: "REACT_APP_STRIPE_PRICE_ENTERPRISE",
    mercadoPagoPlanIdEnv: "REACT_APP_MP_PLAN_ENTERPRISE",
  },
};

/** @typedef {typeof BILLING_STATUS[keyof typeof BILLING_STATUS] | string} SubscriptionStatus */

/**
 * @typedef {Object} BillingProviderData
 * @property {Record<string, unknown>} [stripe]
 * @property {Record<string, unknown>} [mercadoPago]
 */

/**
 * @typedef {Object} UserBilling
 * @property {string} provider
 * @property {string} customerId
 * @property {string} subscriptionId
 * @property {string} planId
 * @property {string} priceId
 * @property {SubscriptionStatus} subscriptionStatus
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodStart
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodEnd
 * @property {import("firebase/firestore").Timestamp | Date | string | null} nextInvoiceDate
 * @property {boolean} cancelAtPeriodEnd
 * @property {string} lastInvoiceUrl
 * @property {string} lastPaymentStatus
 * @property {import("firebase/firestore").Timestamp | Date | string | null} updatedAt
 * @property {BillingProviderData} billingProviderData
 */

export const DEFAULT_BILLING = {
  provider: "",
  customerId: "",
  subscriptionId: "",
  planId: "",
  priceId: "",
  subscriptionStatus: BILLING_STATUS.FREE,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  nextInvoiceDate: null,
  cancelAtPeriodEnd: false,
  lastInvoiceUrl: "",
  lastPaymentStatus: "",
  updatedAt: null,
  billingProviderData: {
    stripe: {},
    mercadoPago: {},
  },
};

/** Valores exibidos no modal de upgrade (checkout futuro). */
export const UPGRADE_PLAN_PRICES = {
  [PLAN_IDS.PROFESSIONAL]: {
    priceLabel: "R$ 49",
    periodLabel: "/mês",
  },
  [PLAN_IDS.ENTERPRISE]: {
    priceLabel: "R$ 149",
    periodLabel: "/mês",
  },
};

/** Rótulos mensais na seção Gerenciar assinatura. */
export const PLAN_MONTHLY_PRICE_LABELS = {
  [PLAN_IDS.STARTER]: "R$ 0",
  [PLAN_IDS.PROFESSIONAL]: "R$ 49",
  [PLAN_IDS.ENTERPRISE]: "R$ 149",
};

export const SUBSCRIPTION_STATUS_LABELS = {
  [BILLING_STATUS.FREE]: "Sem assinatura ativa",
  [BILLING_STATUS.ACTIVE]: "Ativa",
  [BILLING_STATUS.TRIALING]: "Período de teste",
  [BILLING_STATUS.PAST_DUE]: "Pagamento pendente",
  [BILLING_STATUS.CANCELED]: "Cancelada",
  [BILLING_STATUS.UNPAID]: "Não paga",
};

export const BILLING_NOT_ACTIVE_MESSAGE = "Billing ainda não está ativo.";

export const PAYMENTS_COMING_SOON_MESSAGE =
  "Pagamentos serão ativados em breve.";

export const BILLING_PORTAL_COMING_SOON_MESSAGE = "Disponível em breve.";

/**
 * IDs de plano pagos usados no fluxo de upgrade/checkout.
 * @type {import("@/config/planLimits").PlanId[]}
 */
export const BILLING_UPGRADE_PLAN_IDS = [
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
];

/**
 * @param {string | null | undefined} planId
 * @returns {planId is import("@/config/planLimits").PlanId}
 */
export function isBillingUpgradePlanId(planId) {
  return BILLING_UPGRADE_PLAN_IDS.includes(
    /** @type {import("@/config/planLimits").PlanId} */ (planId),
  );
}

/**
 * Resolve o ID de preço/plano no provedor ativo (env no build).
 * @param {keyof typeof BILLING_PLANS} planKey
 * @param {string} [provider]
 * @returns {string}
 */
export function getProviderPriceOrPlanId(planKey, provider = ACTIVE_BILLING_PROVIDER) {
  const config = BILLING_PLANS[planKey];
  if (!config) {
    return "";
  }

  if (provider === BILLING_PROVIDER.STRIPE) {
    return process.env[config.stripePriceIdEnv] ?? "";
  }

  if (provider === BILLING_PROVIDER.MERCADO_PAGO) {
    return process.env[config.mercadoPagoPlanIdEnv] ?? "";
  }

  return "";
}

/**
 * @param {unknown} raw
 * @returns {BillingProviderData}
 */
function normalizeBillingProviderData(raw) {
  if (!raw || typeof raw !== "object") {
    return { stripe: {}, mercadoPago: {} };
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  return {
    stripe:
      data.stripe && typeof data.stripe === "object"
        ? /** @type {Record<string, unknown>} */ (data.stripe)
        : {},
    mercadoPago:
      data.mercadoPago && typeof data.mercadoPago === "object"
        ? /** @type {Record<string, unknown>} */ (data.mercadoPago)
        : {},
  };
}

/**
 * @param {unknown} raw
 * @returns {UserBilling}
 */
export function normalizeBilling(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_BILLING, billingProviderData: { stripe: {}, mercadoPago: {} } };
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  const legacyCustomerId =
    typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : "";
  const legacySubscriptionId =
    typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId : "";
  const legacyPriceId =
    typeof data.stripePriceId === "string" ? data.stripePriceId : "";

  return {
    provider: typeof data.provider === "string" ? data.provider : "",
    customerId:
      typeof data.customerId === "string" && data.customerId
        ? data.customerId
        : legacyCustomerId,
    subscriptionId:
      typeof data.subscriptionId === "string" && data.subscriptionId
        ? data.subscriptionId
        : legacySubscriptionId,
    planId: typeof data.planId === "string" ? data.planId : "",
    priceId:
      typeof data.priceId === "string" && data.priceId
        ? data.priceId
        : legacyPriceId,
    subscriptionStatus:
      typeof data.subscriptionStatus === "string"
        ? data.subscriptionStatus
        : DEFAULT_BILLING.subscriptionStatus,
    currentPeriodStart: data.currentPeriodStart ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    nextInvoiceDate: data.nextInvoiceDate ?? null,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    lastInvoiceUrl:
      typeof data.lastInvoiceUrl === "string" ? data.lastInvoiceUrl : "",
    lastPaymentStatus:
      typeof data.lastPaymentStatus === "string" ? data.lastPaymentStatus : "",
    updatedAt: data.updatedAt ?? null,
    billingProviderData: normalizeBillingProviderData(data.billingProviderData),
  };
}

/**
 * @param {SubscriptionStatus | undefined | null} status
 * @returns {string}
 */
export function getSubscriptionStatusLabel(status) {
  const key = (status ?? BILLING_STATUS.FREE).toLowerCase();
  return (
    SUBSCRIPTION_STATUS_LABELS[key] ?? status ?? SUBSCRIPTION_STATUS_LABELS.free
  );
}

/**
 * @param {import("firebase/firestore").Timestamp | Date | string | number | null | undefined} value
 * @returns {string}
 */
export function formatBillingDate(value) {
  if (value == null) {
    return "—";
  }

  let date;

  if (typeof value === "object" && value !== null && "toDate" in value) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {import("@/config/planLimits").PlanId} planId
 * @returns {string}
 */
export function getPlanMonthlyPriceLabel(planId) {
  return PLAN_MONTHLY_PRICE_LABELS[planId] ?? "—";
}

/**
 * @param {import("@/config/planLimits").PlanId} planId
 * @returns {string}
 */
export function getBillingPlanChosenMessage(planId) {
  if (planId === PLAN_IDS.PROFESSIONAL) {
    return "Você escolheu o plano Professional.";
  }
  if (planId === PLAN_IDS.ENTERPRISE) {
    return "Você escolheu o plano Enterprise.";
  }
  return "";
}
