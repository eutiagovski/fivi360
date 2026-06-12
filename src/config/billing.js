/**
 * Configuração e modelo de billing — Mercado Pago.
 */

import { PLAN_IDS, normalizePlanId } from "@/config/planLimits";

export const BILLING_PROVIDER = "mercado_pago";

export const PLAN_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
};

export const PLAN_SOURCE = {
  SYSTEM: "system",
  MERCADO_PAGO: "mercado_pago",
  MANUAL_ADMIN: "manual_admin",
};

export const SUBSCRIPTION_STATUS = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
};

export const INVOICE_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELED: "canceled",
};

export const BILLING_PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    currency: "BRL",
    interval: "month",
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 49,
    currency: "BRL",
    interval: "month",
    mercadoPagoPlanEnv: "REACT_APP_MP_PLAN_PROFESSIONAL",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    currency: "BRL",
    interval: "month",
    mercadoPagoPlanEnv: "REACT_APP_MP_PLAN_ENTERPRISE",
  },
};

/**
 * @typedef {typeof PLAN_STATUS[keyof typeof PLAN_STATUS]} PlanStatus
 * @typedef {typeof PLAN_SOURCE[keyof typeof PLAN_SOURCE]} PlanSource
 * @typedef {typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]} SubscriptionStatus
 * @typedef {typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS]} InvoiceStatus
 */

/**
 * @typedef {Object} UserPlan
 * @property {import("@/config/planLimits").PlanId} id
 * @property {PlanStatus} status
 * @property {PlanSource} source
 * @property {import("firebase/firestore").Timestamp | Date | string | null} startedAt
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodEnd
 * @property {import("firebase/firestore").Timestamp | Date | string | null} updatedAt
 */

/**
 * @typedef {Object} Subscription
 * @property {string} userId
 * @property {string} provider
 * @property {import("@/config/planLimits").PlanId} planId
 * @property {SubscriptionStatus} status
 * @property {string | null} providerSubscriptionId
 * @property {string | null} payerId
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodStart
 * @property {import("firebase/firestore").Timestamp | Date | string | null} currentPeriodEnd
 * @property {boolean} cancelAtPeriodEnd
 * @property {import("firebase/firestore").Timestamp | Date | string | null} canceledAt
 * @property {import("firebase/firestore").Timestamp | Date | string | null} createdAt
 * @property {import("firebase/firestore").Timestamp | Date | string | null} updatedAt
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} userId
 * @property {string | null} subscriptionId
 * @property {string} provider
 * @property {string | null} providerPaymentId
 * @property {import("@/config/planLimits").PlanId} planId
 * @property {number} amount
 * @property {string} currency
 * @property {InvoiceStatus} status
 * @property {import("firebase/firestore").Timestamp | Date | string | null} paidAt
 * @property {string | null} invoiceUrl
 * @property {import("firebase/firestore").Timestamp | Date | string | null} createdAt
 * @property {import("firebase/firestore").Timestamp | Date | string | null} updatedAt
 */

export const DEFAULT_USER_PLAN = {
  id: PLAN_IDS.STARTER,
  status: PLAN_STATUS.ACTIVE,
  source: PLAN_SOURCE.SYSTEM,
  startedAt: null,
  currentPeriodEnd: null,
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
  [SUBSCRIPTION_STATUS.INACTIVE]: "Sem assinatura ativa",
  [SUBSCRIPTION_STATUS.ACTIVE]: "Ativa",
  [SUBSCRIPTION_STATUS.TRIALING]: "Período de teste",
  [SUBSCRIPTION_STATUS.PAST_DUE]: "Pagamento pendente",
  [SUBSCRIPTION_STATUS.CANCELED]: "Cancelada",
  [SUBSCRIPTION_STATUS.UNPAID]: "Não paga",
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.PENDING]: "Pendente",
  [INVOICE_STATUS.PAID]: "Pago",
  [INVOICE_STATUS.FAILED]: "Falhou",
  [INVOICE_STATUS.REFUNDED]: "Reembolsado",
  [INVOICE_STATUS.CANCELED]: "Cancelado",
};

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
 * Normaliza `users.plan` — aceita string legada ou objeto.
 *
 * @param {unknown} raw — string ("starter") ou objeto UserPlan
 * @returns {UserPlan}
 */
export function normalizeUserPlan(raw) {
  if (typeof raw === "string") {
    return {
      ...DEFAULT_USER_PLAN,
      id: normalizePlanId(raw),
    };
  }

  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_USER_PLAN };
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  return {
    id: normalizePlanId(
      typeof data.id === "string" ? data.id : DEFAULT_USER_PLAN.id,
    ),
    status:
      typeof data.status === "string" &&
      Object.values(PLAN_STATUS).includes(
        /** @type {PlanStatus} */ (data.status),
      )
        ? /** @type {PlanStatus} */ (data.status)
        : DEFAULT_USER_PLAN.status,
    source:
      typeof data.source === "string" &&
      Object.values(PLAN_SOURCE).includes(
        /** @type {PlanSource} */ (data.source),
      )
        ? /** @type {PlanSource} */ (data.source)
        : DEFAULT_USER_PLAN.source,
    startedAt: data.startedAt ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {UserPlan | import("@/config/planLimits").PlanId | string | null | undefined} plan
 * @returns {boolean}
 */
export function isPaidPlan(plan) {
  const planId =
    typeof plan === "object" && plan !== null && "id" in plan
      ? plan.id
      : normalizePlanId(
          typeof plan === "string" ? plan : DEFAULT_USER_PLAN.id,
        );

  return planId !== PLAN_IDS.STARTER;
}

/**
 * @param {Subscription | null | undefined} subscription
 * @returns {boolean}
 */
export function isSubscriptionActive(subscription) {
  if (!subscription) {
    return false;
  }

  return (
    subscription.status === SUBSCRIPTION_STATUS.ACTIVE ||
    subscription.status === SUBSCRIPTION_STATUS.TRIALING
  );
}

/**
 * Resolve o ID do plano de assinatura no Mercado Pago (env no build).
 * @param {keyof typeof BILLING_PLANS} planKey
 * @returns {string}
 */
export function getMercadoPagoPlanId(planKey) {
  const config = BILLING_PLANS[planKey];
  if (!config || !("mercadoPagoPlanEnv" in config)) {
    return "";
  }

  return process.env[config.mercadoPagoPlanEnv] ?? "";
}

/**
 * @param {unknown} raw
 * @returns {Subscription | null}
 */
export function normalizeSubscription(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  return {
    userId: typeof data.userId === "string" ? data.userId : "",
    provider:
      typeof data.provider === "string" && data.provider
        ? data.provider
        : BILLING_PROVIDER,
    planId: normalizePlanId(
      typeof data.planId === "string" ? data.planId : PLAN_IDS.STARTER,
    ),
    status:
      typeof data.status === "string"
        ? /** @type {SubscriptionStatus} */ (data.status)
        : SUBSCRIPTION_STATUS.INACTIVE,
    providerSubscriptionId:
      typeof data.providerSubscriptionId === "string"
        ? data.providerSubscriptionId
        : null,
    payerId: typeof data.payerId === "string" ? data.payerId : null,
    currentPeriodStart: data.currentPeriodStart ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    canceledAt: data.canceledAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {string} id
 * @param {unknown} raw
 * @returns {Invoice}
 */
export function normalizeInvoice(id, raw) {
  const data =
    raw && typeof raw === "object"
      ? /** @type {Record<string, unknown>} */ (raw)
      : {};

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    subscriptionId:
      typeof data.subscriptionId === "string" ? data.subscriptionId : null,
    provider:
      typeof data.provider === "string" && data.provider
        ? data.provider
        : BILLING_PROVIDER,
    providerPaymentId:
      typeof data.providerPaymentId === "string"
        ? data.providerPaymentId
        : null,
    planId: normalizePlanId(
      typeof data.planId === "string" ? data.planId : PLAN_IDS.STARTER,
    ),
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: typeof data.currency === "string" ? data.currency : "BRL",
    status:
      typeof data.status === "string"
        ? /** @type {InvoiceStatus} */ (data.status)
        : INVOICE_STATUS.PENDING,
    paidAt: data.paidAt ?? null,
    invoiceUrl:
      typeof data.invoiceUrl === "string" ? data.invoiceUrl : null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {SubscriptionStatus | PlanStatus | undefined | null} status
 * @returns {string}
 */
export function getSubscriptionStatusLabel(status) {
  const key = (status ?? SUBSCRIPTION_STATUS.INACTIVE).toLowerCase();
  return (
    SUBSCRIPTION_STATUS_LABELS[key] ??
    status ??
    SUBSCRIPTION_STATUS_LABELS[SUBSCRIPTION_STATUS.INACTIVE]
  );
}

/**
 * @param {InvoiceStatus | undefined | null} status
 * @returns {string}
 */
export function getInvoiceStatusLabel(status) {
  const key = (status ?? INVOICE_STATUS.PENDING).toLowerCase();
  return (
    INVOICE_STATUS_LABELS[key] ??
    status ??
    INVOICE_STATUS_LABELS[INVOICE_STATUS.PENDING]
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
 * @param {number} amount
 * @param {string} [currency="BRL"]
 * @returns {string}
 */
export function formatInvoiceAmount(amount, currency = "BRL") {
  if (currency === "BRL") {
    return `R$ ${amount.toFixed(2).replace(".", ",")}`;
  }

  return `${currency} ${amount.toFixed(2)}`;
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

/**
 * @param {Invoice} invoice
 * @returns {{ date: string, plan: string, status: string, amount: string, invoiceUrl?: string }}
 */
export function mapInvoiceToDisplayRow(invoice) {
  const planConfig = BILLING_PLANS[invoice.planId];

  return {
    date: formatBillingDate(invoice.paidAt ?? invoice.createdAt),
    plan: planConfig?.name ?? invoice.planId,
    status: getInvoiceStatusLabel(invoice.status),
    amount: formatInvoiceAmount(invoice.amount, invoice.currency),
    invoiceUrl: invoice.invoiceUrl ?? undefined,
  };
}
