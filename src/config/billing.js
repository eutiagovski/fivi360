/**
 * Configuração e modelo de billing — Stripe (único provedor ativo).
 * Usuários antigos com `billing.provider === "mercado_pago"` são só leitura
 * (não liberam entitlement; fonte de plano continua sendo `users.plan`).
 */

import {
  isPlanAtOrAbove,
  PLAN_IDS,
  PLAN_LIMITS,
} from "@/config/planLimits";

/** Provedor ativo de billing. */
export const BILLING_PROVIDER = "stripe";

/** Provider legado — nunca usar para entitlement ou checkout. */
export const LEGACY_BILLING_PROVIDER = "mercado_pago";

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
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 199,
    currency: "BRL",
    interval: "month",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    currency: "BRL",
    interval: "month",
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

/**
 * Bootstrap mínimo de billing para novos usuários Starter.
 * Sem IDs Stripe vazios e sem provider legado.
 * Campos de UI ausentes são preenchidos em `normalizeBilling`.
 */
export const DEFAULT_BILLING = Object.freeze({
  provider: BILLING_PROVIDER,
  subscriptionStatus: BILLING_STATUS.FREE,
});

/** Shape completo usado pela UI após normalização. */
const BILLING_UI_DEFAULTS = Object.freeze({
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
});

export const CONTACT_EMAIL = "contato@fivi360.com.br";

/** Valores exibidos no modal de upgrade (checkout). */
export const UPGRADE_PLAN_PRICES = {
  [PLAN_IDS.STARTER]: {
    priceLabel: PLAN_LIMITS[PLAN_IDS.STARTER].priceLabel,
    periodLabel: "",
  },
  [PLAN_IDS.PROFESSIONAL]: {
    priceLabel: "R$ 49",
    periodLabel: "/mês",
  },
  [PLAN_IDS.STUDIO]: {
    priceLabel: "R$ 199",
    periodLabel: "/mês",
  },
  [PLAN_IDS.ENTERPRISE]: {
    priceLabel: "A partir de R$ 499",
    periodLabel: "/mês",
  },
};

/** Rótulos mensais na seção Gerenciar assinatura. */
export const PLAN_MONTHLY_PRICE_LABELS = {
  [PLAN_IDS.STARTER]: "Grátis",
  [PLAN_IDS.PROFESSIONAL]: "R$ 49",
  [PLAN_IDS.STUDIO]: "R$ 199",
  [PLAN_IDS.ENTERPRISE]: "A partir de R$ 499",
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

export const CHECKOUT_LOADING_MESSAGE = "Preparando seu link seguro...";

export const CHECKOUT_ALREADY_SUBSCRIBED_MESSAGE =
  "Você já possui uma assinatura ativa neste plano ou superior.";

export const ENTERPRISE_PLAN_UNAVAILABLE_LABEL = "Em breve";

export const ENTERPRISE_CONTACT_LABEL = "Fale conosco";

export const STUDIO_PLAN_UNAVAILABLE_LABEL = "Em breve";

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
 * Planos pagos (incluindo Enterprise futuro).
 * @param {string | null | undefined} planId
 * @returns {boolean}
 */
export function isPaidPlan(planId) {
  return (
    planId === PLAN_IDS.PROFESSIONAL
    || planId === PLAN_IDS.STUDIO
    || planId === PLAN_IDS.ENTERPRISE
  );
}

/**
 * @param {string | null | undefined} status
 * @returns {boolean}
 */
export function isActiveSubscriptionStatus(status) {
  return ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.has(
    (status ?? "").toLowerCase().trim(),
  );
}

/**
 * Studio no Beta: habilitado no frontend por padrão.
 * Opt-out explícito: `REACT_APP_STRIPE_STUDIO_CHECKOUT=false` (ex.: ambiente sem
 * `STRIPE_PRICE_STUDIO` no backend). Fonte de verdade do preço continua no backend.
 * @returns {boolean}
 */
export function isStudioCheckoutConfigured() {
  return process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT !== "false";
}

/**
 * @param {string | null | undefined} provider
 * @returns {boolean}
 */
export function isLegacyBillingProvider(provider) {
  return (provider ?? "").toLowerCase().trim() === LEGACY_BILLING_PROVIDER;
}

/**
 * Provider Stripe ativo (ignora Mercado Pago legado).
 * @param {string | null | undefined} provider
 * @returns {boolean}
 */
export function isActiveStripeBillingProvider(provider) {
  return (provider ?? "").toLowerCase().trim() === BILLING_PROVIDER;
}

/**
 * Indica se o usuário pode cancelar uma assinatura Stripe ativa.
 * Billing legado Mercado Pago nunca habilita cancelamento Stripe.
 * @param {UserBilling} billing
 * @returns {boolean}
 */
export function canCancelStripeSubscription(billing) {
  const status = (billing.subscriptionStatus ?? "").toLowerCase();

  return (
    isActiveStripeBillingProvider(billing.provider)
    && ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.has(status)
    && !billing.cancelAtPeriodEnd
  );
}

/**
 * IDs de plano pagos usados no fluxo de upgrade/checkout (exceto Enterprise).
 * @type {import("@/config/planLimits").PlanId[]}
 */
export const BILLING_UPGRADE_PLAN_IDS = [
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.STUDIO,
];

export const PAYMENTS_COMING_SOON_MESSAGE =
  "Pagamentos serão ativados em breve.";

/**
 * Planos com checkout Stripe habilitado no frontend.
 * Backend rejeita se o priceId correspondente não estiver configurado.
 * @returns {Set<import("@/config/planLimits").PlanId>}
 */
export function getStripeCheckoutPlanIds() {
  const ids = new Set([PLAN_IDS.PROFESSIONAL]);

  if (isStudioCheckoutConfigured()) {
    ids.add(PLAN_IDS.STUDIO);
  }

  return ids;
}

/**
 * @param {string | null | undefined} planId
 * @returns {boolean}
 */
export function isCheckoutEnabledPlan(planId) {
  return getStripeCheckoutPlanIds().has(
    /** @type {import("@/config/planLimits").PlanId} */ (planId),
  );
}

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
 * Confirma se o plano atual satisfaz o plano solicitado no checkout.
 * Sem `requestedPlan`, qualquer plano pago elegível conta.
 * @param {string | null | undefined} currentPlan
 * @param {string | null | undefined} requestedPlan
 * @returns {boolean}
 */
export function doesPlanSatisfyRequestedPlan(currentPlan, requestedPlan) {
  if (!currentPlan || !isPaidPlan(currentPlan)) {
    return false;
  }

  if (!requestedPlan) {
    return true;
  }

  return (
    currentPlan === requestedPlan
    || isPlanAtOrAbove(
      /** @type {import("@/config/planLimits").PlanId} */ (currentPlan),
      /** @type {import("@/config/planLimits").PlanId} */ (requestedPlan),
    )
  );
}

/**
 * Avalia se o retorno de `refreshPlan` confirma assinatura pós-checkout.
 * @param {{
 *   planId?: string | null,
 *   billing?: { subscriptionStatus?: string | null, provider?: string | null } | null,
 * } | null | undefined} context
 * @param {string | null | undefined} [requestedPlanId]
 * @returns {boolean}
 */
export function isCheckoutSuccessConfirmed(context, requestedPlanId = null) {
  if (!context?.planId || !isPaidPlan(context.planId)) {
    return false;
  }

  // Enterprise futuro: reconhecer se já estiver ativo; Beta sem checkout.
  if (
    context.planId !== PLAN_IDS.ENTERPRISE
    && !isCheckoutEnabledPlan(context.planId)
  ) {
    return false;
  }

  const status = context.billing?.subscriptionStatus;
  if (status && !isActiveSubscriptionStatus(status)) {
    return false;
  }

  // Billing legado Mercado Pago não confirma sucesso de checkout Stripe.
  if (isLegacyBillingProvider(context.billing?.provider)) {
    return false;
  }

  return doesPlanSatisfyRequestedPlan(context.planId, requestedPlanId);
}

/**
 * Estado do botão de assinatura no modal de upgrade.
 * @param {import("@/config/planLimits").PlanId} targetPlanId
 * @param {import("@/config/planLimits").PlanId} currentPlanId
 * @returns {{ disabled: boolean, label: string, contactHref?: string }}
 */
export function getUpgradePlanButtonState(targetPlanId, currentPlanId) {
  if (targetPlanId === PLAN_IDS.STARTER) {
    if (currentPlanId === PLAN_IDS.STARTER) {
      return { disabled: true, label: "Plano atual" };
    }

    return { disabled: true, label: "Começar gratuitamente" };
  }

  if (targetPlanId === PLAN_IDS.ENTERPRISE) {
    return {
      disabled: true,
      label: ENTERPRISE_CONTACT_LABEL,
      contactHref: `mailto:${CONTACT_EMAIL}?subject=Plano%20Enterprise%20FIVI360`,
    };
  }

  if (targetPlanId === PLAN_IDS.STUDIO) {
    if (currentPlanId === PLAN_IDS.STUDIO) {
      return { disabled: true, label: "Plano atual" };
    }

    if (isPlanAtOrAbove(currentPlanId, PLAN_IDS.STUDIO)) {
      return { disabled: true, label: "Incluído no seu plano" };
    }

    if (!isStudioCheckoutConfigured()) {
      return { disabled: true, label: STUDIO_PLAN_UNAVAILABLE_LABEL };
    }

    return { disabled: false, label: "Assinar Studio" };
  }

  if (targetPlanId === PLAN_IDS.PROFESSIONAL) {
    if (currentPlanId === PLAN_IDS.PROFESSIONAL) {
      return { disabled: true, label: "Plano atual" };
    }

    if (isPlanAtOrAbove(currentPlanId, PLAN_IDS.PROFESSIONAL)) {
      return { disabled: true, label: "Incluído no seu plano" };
    }

    return { disabled: false, label: "Assinar Professional" };
  }

  return { disabled: false, label: "Assinar plano" };
}

/**
 * @param {import("@/config/planLimits").PlanId} targetPlanId
 * @param {import("@/config/planLimits").PlanId} currentPlanId
 * @returns {boolean}
 */
export function canStartStripeCheckoutForPlan(targetPlanId, currentPlanId) {
  if (!isCheckoutEnabledPlan(targetPlanId)) {
    return false;
  }

  return !getUpgradePlanButtonState(targetPlanId, currentPlanId).disabled;
}

/**
 * @param {unknown} raw
 * @returns {UserBilling}
 */
export function normalizeBilling(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...BILLING_UI_DEFAULTS };
  }

  const data = /** @type {Record<string, unknown>} */ (raw);

  // Preserva provider legado para leitura; default de novos docs é Stripe.
  const provider =
    typeof data.provider === "string" && data.provider
      ? data.provider
      : BILLING_PROVIDER;

  return {
    provider,
    customerId: typeof data.customerId === "string" ? data.customerId : "",
    subscriptionId:
      typeof data.subscriptionId === "string" ? data.subscriptionId : "",
    planId: typeof data.planId === "string" ? data.planId : "",
    subscriptionStatus:
      typeof data.subscriptionStatus === "string"
        ? data.subscriptionStatus
        : BILLING_UI_DEFAULTS.subscriptionStatus,
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
  if (planId === PLAN_IDS.STUDIO) {
    return "Você escolheu o plano Studio.";
  }
  if (planId === PLAN_IDS.ENTERPRISE) {
    return "Você escolheu o plano Enterprise.";
  }
  return "";
}
