/**
 * Configuração e modelo de billing — Stripe (único provedor).
 * Fonte de plano / entitlement: `users.plan`.
 * `users.billing` guarda metadados Stripe gerenciados pelo backend.
 */

import {
  isManualPlanSource,
  isPlanAtOrAbove,
  PLAN_IDS,
  PLAN_LIMITS,
  PLAN_SOURCES,
} from "@/config/planLimits";
import { toAppDate } from "@/services/firebase/dates";

/** Único provedor de billing suportado. */
export const BILLING_PROVIDER = "stripe";

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
    id: PLAN_IDS.PROFESSIONAL,
    name: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].displayName,
    price: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].monthlyPrice,
    currency: "BRL",
    interval: "month",
  },
  studio: {
    id: PLAN_IDS.STUDIO,
    name: PLAN_LIMITS[PLAN_IDS.STUDIO].displayName,
    price: PLAN_LIMITS[PLAN_IDS.STUDIO].monthlyPrice,
    currency: "BRL",
    interval: "month",
  },
  enterprise: {
    id: PLAN_IDS.ENTERPRISE,
    name: PLAN_LIMITS[PLAN_IDS.ENTERPRISE].displayName,
    price: PLAN_LIMITS[PLAN_IDS.ENTERPRISE].monthlyPrice,
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
 * @property {Date | null} currentPeriodStart
 * @property {Date | null} currentPeriodEnd
 * @property {Date | null} nextInvoiceDate
 * @property {boolean} cancelAtPeriodEnd
 * @property {string} lastInvoiceUrl
 * @property {string} lastPaymentStatus
 * @property {Date | null} updatedAt
 */

/**
 * Bootstrap mínimo de billing para novos usuários Starter.
 * Sem IDs Stripe vazios. Campos de UI ausentes são preenchidos em `normalizeBilling`.
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

/** Valores exibidos no modal de upgrade (derivados de PLAN_LIMITS). */
export const UPGRADE_PLAN_PRICES = {
  [PLAN_IDS.STARTER]: {
    priceLabel: PLAN_LIMITS[PLAN_IDS.STARTER].priceLabel,
    periodLabel: PLAN_LIMITS[PLAN_IDS.STARTER].periodLabel ?? "",
  },
  [PLAN_IDS.PROFESSIONAL]: {
    priceLabel: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].priceLabel,
    periodLabel: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].periodLabel ?? "",
  },
  [PLAN_IDS.STUDIO]: {
    priceLabel: PLAN_LIMITS[PLAN_IDS.STUDIO].priceLabel,
    periodLabel: PLAN_LIMITS[PLAN_IDS.STUDIO].periodLabel ?? "",
  },
  [PLAN_IDS.ENTERPRISE]: {
    priceLabel: PLAN_LIMITS[PLAN_IDS.ENTERPRISE].priceLabel,
    periodLabel: PLAN_LIMITS[PLAN_IDS.ENTERPRISE].periodLabel ?? "",
  },
};

/** Rótulos mensais na seção Gerenciar assinatura (derivados de PLAN_LIMITS). */
export const PLAN_MONTHLY_PRICE_LABELS = {
  [PLAN_IDS.STARTER]: PLAN_LIMITS[PLAN_IDS.STARTER].priceLabel,
  [PLAN_IDS.PROFESSIONAL]: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].priceLabel,
  [PLAN_IDS.STUDIO]: PLAN_LIMITS[PLAN_IDS.STUDIO].priceLabel,
  [PLAN_IDS.ENTERPRISE]: PLAN_LIMITS[PLAN_IDS.ENTERPRISE].priceLabel,
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

/** CTA quando checkout pago está desabilitado (Professional / Studio). */
export const PAID_PLAN_UNAVAILABLE_LABEL = "Em breve";

/** @deprecated Use PAID_PLAN_UNAVAILABLE_LABEL — mantido por compatibilidade. */
export const STUDIO_PLAN_UNAVAILABLE_LABEL = PAID_PLAN_UNAVAILABLE_LABEL;

export const BILLING_PORTAL_COMING_SOON_MESSAGE = "Disponível em breve.";

export const MANUAL_PLAN_ACCESS_STATUS_LABEL = "Acesso concedido";

export const CANCEL_AT_PERIOD_END_MESSAGE =
  "Sua assinatura está programada para cancelamento ao fim do período atual.";

export const NEXT_BILLING_UNAVAILABLE_LABEL = "Próxima cobrança indisponível";

/**
 * Mensagem de acesso restante quando o cancelamento está agendado.
 *
 * @param {string | null | undefined} formattedDate
 * @returns {string}
 */
export function getCancelAtPeriodEndAccessMessage(formattedDate) {
  if (!formattedDate || formattedDate === "—" || formattedDate === NEXT_BILLING_UNAVAILABLE_LABEL) {
    return CANCEL_AT_PERIOD_END_MESSAGE;
  }

  return `Seu acesso permanece disponível até ${formattedDate}.`;
}

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
 * Studio no Beta: habilitado no frontend por padrão (quando pagamentos globais on).
 * Opt-out explícito: `REACT_APP_STRIPE_STUDIO_CHECKOUT=false` (ex.: ambiente sem
 * `STRIPE_PRICE_STUDIO` no backend). Fonte de verdade do preço continua no backend.
 * @returns {boolean}
 */
export function isStudioCheckoutConfigured() {
  return process.env.REACT_APP_STRIPE_STUDIO_CHECKOUT !== "false";
}

/**
 * Gate global de checkout pago (Professional / Studio).
 * Opt-out: `REACT_APP_PAID_CHECKOUT_ENABLED=false` (go-live inicial).
 * Backend `PAID_CHECKOUT_ENABLED` é a autoridade — não confiar só no frontend.
 * @returns {boolean}
 */
export function isPaidCheckoutEnabled() {
  return process.env.REACT_APP_PAID_CHECKOUT_ENABLED !== "false";
}

/**
 * @param {string | null | undefined} provider
 * @returns {boolean}
 */
export function isActiveStripeBillingProvider(provider) {
  return (provider ?? "").toLowerCase().trim() === BILLING_PROVIDER;
}

/**
 * Indica se o usuário pode cancelar uma assinatura Stripe ativa.
 * Exige evidência real de assinatura (subscriptionId) e source stripe quando conhecido.
 * Plano manual / sem subscriptionId → nunca.
 *
 * @param {UserBilling} billing
 * @param {{ planSource?: string | null }} [options]
 * @returns {boolean}
 */
export function canCancelStripeSubscription(billing, options = {}) {
  const planSource = (options.planSource ?? "").toLowerCase().trim();

  if (isManualPlanSource(planSource) || planSource === PLAN_SOURCES.SYSTEM) {
    return false;
  }

  const subscriptionId =
    typeof billing?.subscriptionId === "string" ? billing.subscriptionId.trim() : "";

  if (!subscriptionId) {
    return false;
  }

  if (planSource && planSource !== PLAN_SOURCES.STRIPE) {
    return false;
  }

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
 * Backend rejeita se flag off ou priceId correspondente não estiver configurado.
 * @returns {Set<import("@/config/planLimits").PlanId>}
 */
export function getStripeCheckoutPlanIds() {
  if (!isPaidCheckoutEnabled()) {
    return new Set();
  }

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
 * Normaliza o plano solicitado no retorno do checkout (`?plan=`).
 * Aceita apenas planos contratáveis via Stripe Checkout.
 * @param {unknown} planId
 * @returns {import("@/config/planLimits").PlanId | null}
 */
export function normalizeCheckoutRequestedPlanId(planId) {
  if (typeof planId !== "string") {
    return null;
  }

  const normalized = planId.toLowerCase().trim();

  if (
    normalized === PLAN_IDS.PROFESSIONAL
    || normalized === PLAN_IDS.STUDIO
  ) {
    return /** @type {import("@/config/planLimits").PlanId} */ (normalized);
  }

  return null;
}

/**
 * Normaliza `session_id` do retorno do Stripe Checkout.
 * @param {unknown} sessionId
 * @returns {string | null}
 */
export function normalizeCheckoutSessionId(sessionId) {
  if (typeof sessionId !== "string") {
    return null;
  }

  const trimmed = sessionId.trim();

  if (!trimmed || trimmed === "{CHECKOUT_SESSION_ID}") {
    return null;
  }

  return trimmed;
}

/**
 * Confirma se o plano atual satisfaz o plano solicitado no checkout.
 * Sem `requestedPlan` válido, nunca confirma (fail-safe).
 * @param {string | null | undefined} currentPlan
 * @param {string | null | undefined} requestedPlan
 * @returns {boolean}
 */
export function doesPlanSatisfyRequestedPlan(currentPlan, requestedPlan) {
  if (!currentPlan || !isPaidPlan(currentPlan)) {
    return false;
  }

  const normalizedRequested = normalizeCheckoutRequestedPlanId(requestedPlan);
  if (!normalizedRequested) {
    return false;
  }

  return (
    currentPlan === normalizedRequested
    || isPlanAtOrAbove(
      /** @type {import("@/config/planLimits").PlanId} */ (currentPlan),
      normalizedRequested,
    )
  );
}

/**
 * Avalia se o retorno de `refreshPlan` confirma assinatura pós-checkout.
 * Exige `requestedPlanId` válido — não confirma “qualquer plano pago”.
 * @param {{
 *   planId?: string | null,
 *   billing?: { subscriptionStatus?: string | null, provider?: string | null } | null,
 * } | null | undefined} context
 * @param {string | null | undefined} [requestedPlanId]
 * @returns {boolean}
 */
export function isCheckoutSuccessConfirmed(context, requestedPlanId = null) {
  const normalizedRequested = normalizeCheckoutRequestedPlanId(requestedPlanId);
  if (!normalizedRequested) {
    return false;
  }

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

  const provider = context.billing?.provider;
  if (provider && !isActiveStripeBillingProvider(provider)) {
    return false;
  }

  return doesPlanSatisfyRequestedPlan(context.planId, normalizedRequested);
}

/**
 * Decide se o retorno do checkout pode ser tratado como sucesso confirmado.
 * Query string só indica o que aguardar — entitlement continua em `users.plan`.
 * @param {{
 *   checkoutStatus?: string | null,
 *   sessionId?: string | null,
 *   requestedPlanId?: string | null,
 *   context?: {
 *     planId?: string | null,
 *     billing?: { subscriptionStatus?: string | null, provider?: string | null } | null,
 *   } | null,
 * }} params
 * @returns {boolean}
 */
export function shouldFinalizeCheckoutSuccess({
  checkoutStatus,
  sessionId,
  requestedPlanId,
  context,
}) {
  if (checkoutStatus !== "success") {
    return false;
  }

  if (!normalizeCheckoutSessionId(sessionId)) {
    return false;
  }

  return isCheckoutSuccessConfirmed(context, requestedPlanId);
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

    if (!isPaidCheckoutEnabled() || !isStudioCheckoutConfigured()) {
      return { disabled: true, label: PAID_PLAN_UNAVAILABLE_LABEL };
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

    if (!isPaidCheckoutEnabled()) {
      return { disabled: true, label: PAID_PLAN_UNAVAILABLE_LABEL };
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
  const rawProvider =
    typeof data.provider === "string" ? data.provider.toLowerCase().trim() : "";

  // Provider ausente é tolerado (doc parcial); provider inválido → defaults Stripe/free.
  if (rawProvider && rawProvider !== BILLING_PROVIDER) {
    return { ...BILLING_UI_DEFAULTS };
  }

  return {
    provider: BILLING_PROVIDER,
    customerId: typeof data.customerId === "string" ? data.customerId : "",
    subscriptionId:
      typeof data.subscriptionId === "string" ? data.subscriptionId : "",
    planId: typeof data.planId === "string" ? data.planId : "",
    subscriptionStatus:
      typeof data.subscriptionStatus === "string"
        ? data.subscriptionStatus
        : BILLING_UI_DEFAULTS.subscriptionStatus,
    currentPeriodStart: toAppDate(data.currentPeriodStart),
    currentPeriodEnd:
      toAppDate(data.currentPeriodEnd) ?? toAppDate(data.nextBillingAt),
    nextInvoiceDate:
      toAppDate(data.nextInvoiceDate)
      ?? toAppDate(data.nextBillingAt)
      ?? toAppDate(data.currentPeriodEnd),
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    lastInvoiceUrl:
      typeof data.lastInvoiceUrl === "string" ? data.lastInvoiceUrl : "",
    lastPaymentStatus:
      typeof data.lastPaymentStatus === "string" ? data.lastPaymentStatus : "",
    updatedAt: toAppDate(data.updatedAt),
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
 * @param {unknown} value
 * @returns {string}
 */
export function formatBillingDate(value) {
  const date = toAppDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/**
 * Fonte de verdade da próxima cobrança na UI: `currentPeriodEnd` da assinatura
 * (com alias `nextInvoiceDate` / `nextBillingAt` já normalizados no DTO).
 *
 * @param {UserBilling} billing
 * @returns {Date | null}
 */
export function getSubscriptionPeriodEndDate(billing) {
  if (!billing || typeof billing !== "object") {
    return null;
  }

  return (
    toAppDate(billing.nextInvoiceDate)
    ?? toAppDate(billing.currentPeriodEnd)
  );
}

/**
 * Apresentação da data de período conforme status / cancelAtPeriodEnd.
 *
 * @param {UserBilling} billing
 * @returns {{
 *   visible: boolean,
 *   label: string,
 *   value: string,
 *   periodEnd: Date | null,
 * }}
 */
export function getSubscriptionPeriodDisplay(billing) {
  const status = (billing?.subscriptionStatus ?? BILLING_STATUS.FREE).toLowerCase();
  const periodEnd = getSubscriptionPeriodEndDate(billing);
  const formatted = periodEnd ? formatBillingDate(periodEnd) : null;
  const value = formatted ?? NEXT_BILLING_UNAVAILABLE_LABEL;

  if (status === BILLING_STATUS.CANCELED) {
    return {
      visible: false,
      label: "Próxima cobrança",
      value: NEXT_BILLING_UNAVAILABLE_LABEL,
      periodEnd,
    };
  }

  if (
    status === BILLING_STATUS.PAST_DUE
    || status === BILLING_STATUS.UNPAID
  ) {
    return {
      visible: true,
      label: "Próxima cobrança",
      value: NEXT_BILLING_UNAVAILABLE_LABEL,
      periodEnd,
    };
  }

  if (billing?.cancelAtPeriodEnd) {
    return {
      visible: true,
      label: "Acesso disponível até",
      value,
      periodEnd,
    };
  }

  if (status === BILLING_STATUS.TRIALING) {
    return {
      visible: true,
      label: "Período de teste até",
      value,
      periodEnd,
    };
  }

  return {
    visible: true,
    label: "Próxima cobrança",
    value,
    periodEnd,
  };
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
