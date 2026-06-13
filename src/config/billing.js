/**
 * Configuração e modelo de billing — Mercado Pago.
 */

import { PLAN_IDS } from "@/config/planLimits";

export const BILLING_PROVIDER = "mercado_pago";

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
    mercadoPagoPlanIdEnv: "REACT_APP_MP_PLAN_PROFESSIONAL",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    currency: "BRL",
    interval: "month",
    mercadoPagoPlanIdEnv: "REACT_APP_MP_PLAN_ENTERPRISE",
  },
};

/** @typedef {typeof BILLING_STATUS[keyof typeof BILLING_STATUS] | string} SubscriptionStatus */

/**
 * @typedef {Object} UserBilling
 * @property {string} provider
 * @property {string} customerId
 * @property {string} subscriptionId
 * @property {string} planId
 * @property {SubscriptionStatus} subscriptionStatus
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodStart
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodEnd
 * @property {import("firebase/firestore").Timestamp | Date | string | null} nextInvoiceDate
 * @property {boolean} cancelAtPeriodEnd
 * @property {string} lastInvoiceUrl
 * @property {string} lastPaymentStatus
 * @property {import("firebase/firestore").Timestamp | Date | string | null} updatedAt
 */

export const DEFAULT_BILLING = {
  provider: BILLING_PROVIDER,
  customerId: "",
  subscriptionId: "",
  planId: "",
  subscriptionStatus: BILLING_STATUS.FREE,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  nextInvoiceDate: null,
  cancelAtPeriodEnd: false,
  lastInvoiceUrl: "",
  lastPaymentStatus: "",
  updatedAt: null,
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

export const CANCEL_AT_PERIOD_END_MESSAGE =
  "Sua assinatura está programada para cancelamento ao fim do período atual.";

export const CANCEL_SUBSCRIPTION_SUCCESS_MESSAGE =
  "Sua assinatura será cancelada ao fim do período atual.";

export const CANCEL_SUBSCRIPTION_ERROR_MESSAGE =
  "Não foi possível cancelar a assinatura. Tente novamente.";

const ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set([
  BILLING_STATUS.ACTIVE,
  BILLING_STATUS.TRIALING,
]);

/**
 * Indica se o usuário pode cancelar uma assinatura Stripe ativa.
 * @param {UserBilling} billing
 * @returns {boolean}
 */
export function canCancelStripeSubscription(billing) {
  const status = (billing.subscriptionStatus ?? "").toLowerCase();

  return (
    billing.provider === "stripe" &&
    ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.has(status) &&
    !billing.cancelAtPeriodEnd
  );
}

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
 * Resolve o ID do plano de assinatura no Mercado Pago (env no build).
 * @param {keyof typeof BILLING_PLANS} planKey
 * @returns {string}
 */
export function getMercadoPagoPlanId(planKey) {
  const config = BILLING_PLANS[planKey];
  if (!config) {
    return "";
  }

  return process.env[config.mercadoPagoPlanIdEnv] ?? "";
}

/**
 * @param {unknown} raw
 * @returns {UserBilling}
 */
export function normalizeBilling(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_BILLING };
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  return {
    provider:
      typeof data.provider === "string" && data.provider
        ? data.provider
        : BILLING_PROVIDER,
    customerId: typeof data.customerId === "string" ? data.customerId : "",
    subscriptionId:
      typeof data.subscriptionId === "string" ? data.subscriptionId : "",
    planId: typeof data.planId === "string" ? data.planId : "",
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

export const INVOICE_STATUS_LABELS = {
  paid: "Pago",
  failed: "Falhou",
};

/**
 * @param {string | null | undefined} status
 * @returns {string}
 */
export function getInvoiceStatusLabel(status) {
  if (!status) {
    return "—";
  }

  const key = status.toLowerCase();
  const label = INVOICE_STATUS_LABELS[key];

  if (label) {
    return label;
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Converte centavos Stripe para moeda legível (padrão BRL).
 *
 * @param {number | null | undefined} amountCents
 * @param {string | null | undefined} currency
 * @returns {string}
 */
export function formatInvoiceAmount(amountCents, currency = "brl") {
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    return "—";
  }

  const normalizedCurrency = (currency ?? "brl").toUpperCase();

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: normalizedCurrency === "BRL" ? "BRL" : normalizedCurrency,
  }).format(amountCents / 100);
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
