/**
 * Definição central dos planos e limites do FIVI360.
 * Fonte única de verdade para enforcement e UI.
 *
 * Formato persistido em `users.plan` (padrão):
 *   { id: "starter" | "professional" | "studio" | "enterprise", status, source, ... }
 *
 * Formato legado (compatível):
 *   "starter" | "professional" | "studio" | "enterprise"
 */

export const PLAN_IDS = {
  STARTER: "starter",
  PROFESSIONAL: "professional",
  STUDIO: "studio",
  ENTERPRISE: "enterprise",
};

/** @typedef {'starter' | 'professional' | 'studio' | 'enterprise'} PlanId */

/**
 * @typedef {Object} UserPlan
 * @property {string} [id]
 * @property {string} [status]
 * @property {string} [source]
 * @property {boolean} [cancelAtPeriodEnd]
 * @property {import("firebase/firestore").Timestamp | null} [updatedAt]
 */

/** @typedef {string | UserPlan | null | undefined} UserPlanRaw */

/**
 * @typedef {Object} PlanLimits
 * @property {string} name
 * @property {string} displayName
 * @property {string} tagline
 * @property {string} description
 * @property {string | null} [badge]
 * @property {number | null} maxProjects — null = ilimitado
 * @property {number | null} maxTotalImages — null = ilimitado
 * @property {number} maxStorageBytes
 * @property {boolean} hotspotsEnabled
 * @property {boolean} publicPortfolioEnabled
 * @property {boolean} publicVisibilityEnabled
 * @property {boolean} analyticsEnabled
 * @property {boolean} advancedAnalytics
 * @property {boolean} prioritySupport
 * @property {boolean} multiuserEnabled
 * @property {boolean} customDomainEnabled
 * @property {boolean} whiteLabelEnabled
 * @property {string | null} [status]
 * @property {string} priceLabel
 * @property {string} [periodLabel]
 * @property {string[]} featureBullets
 */

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

/** @type {Record<PlanId, PlanLimits>} */
export const PLAN_LIMITS = {
  [PLAN_IDS.STARTER]: {
    name: PLAN_IDS.STARTER,
    displayName: "Starter",
    tagline: "Experimente o FIVI360",
    description:
      "Ideal para conhecer a plataforma e criar suas primeiras apresentações em 360°.",
    badge: null,
    maxProjects: 2,
    maxTotalImages: 10,
    maxStorageBytes: 25 * MB,
    hotspotsEnabled: false,
    publicPortfolioEnabled: false,
    publicVisibilityEnabled: false,
    analyticsEnabled: false,
    advancedAnalytics: false,
    prioritySupport: false,
    multiuserEnabled: false,
    customDomainEnabled: false,
    whiteLabelEnabled: false,
    status: null,
    priceLabel: "Grátis",
    periodLabel: "",
    featureBullets: [
      "2 projetos",
      "10 imagens",
      "25 MB de armazenamento",
      "Links compartilhados",
      // "Sem portfólio público",
      // "Sem hotspots",
      // "Sem analytics",
    ],
  },
  [PLAN_IDS.PROFESSIONAL]: {
    name: PLAN_IDS.PROFESSIONAL,
    displayName: "Professional",
    tagline: "Para arquitetos e designers independentes",
    description:
      "Transforme suas apresentações em uma experiência profissional e compartilhe seus projetos com clientes de forma imersiva.",
    badge: "Mais popular",
    maxProjects: null,
    maxTotalImages: null,
    maxStorageBytes: 500 * MB,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    analyticsEnabled: true,
    advancedAnalytics: false,
    prioritySupport: false,
    multiuserEnabled: false,
    customDomainEnabled: false,
    whiteLabelEnabled: false,
    status: null,
    priceLabel: "R$ 49",
    periodLabel: "/mês",
    featureBullets: [
      "Projetos ilimitados",
      "Imagens ilimitadas",
      "500 MB de armazenamento",
      "Portfólio público",
      "Informações interativas",
      "Navegação entre imagens",
      "Hotspots",
      "Analytics básico",
    ],
  },
  [PLAN_IDS.STUDIO]: {
    name: PLAN_IDS.STUDIO,
    displayName: "Studio",
    tagline: "Para escritórios em crescimento",
    description:
      "Mais espaço, mais capacidade e recursos preparados para equipes que gerenciam múltiplos projetos simultaneamente.",
    badge: "Recomendado",
    maxProjects: null,
    maxTotalImages: null,
    maxStorageBytes: 2 * GB,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    analyticsEnabled: true,
    advancedAnalytics: true,
    prioritySupport: true,
    multiuserEnabled: false,
    customDomainEnabled: false,
    whiteLabelEnabled: false,
    status: null,
    priceLabel: "R$ 199",
    periodLabel: "/mês",
    featureBullets: [
      "Tudo do Professional",
      "2 GB de armazenamento",
      // "Projetos ilimitados",
      // "Imagens ilimitadas",
      // "Informações interativas (hotspots — info)",
      // "Navegação entre imagens (hotspot — scene)",
      "Analytics avançado",
      "Suporte prioritário",
      "White label parcial (em breve)",
    ],
  },
  [PLAN_IDS.ENTERPRISE]: {
    name: PLAN_IDS.ENTERPRISE,
    displayName: "Enterprise",
    tagline: "Para incorporadoras e construtoras",
    description:
      "Uma solução corporativa para equipes, empreendimentos e operações em escala.",
    badge: "Em breve",
    maxProjects: null,
    maxTotalImages: null,
    maxStorageBytes: 10 * GB,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    analyticsEnabled: true,
    advancedAnalytics: true,
    prioritySupport: true,
    multiuserEnabled: true,
    customDomainEnabled: true,
    whiteLabelEnabled: true,
    status: "coming_soon",
    priceLabel: "R$ 499",
    periodLabel: "/mês",
    featureBullets: [
      "Tudo do Studio",
      "10 GB de armazenamento",
      "Multiusuário",
      "Workspaces compartilhados",
      "Permissões e equipe",
      "Domínio personalizado",
      // "White-label parcial",
      // "Suporte prioritário",
    ],
  },
};

/** Ordem de exibição na página de planos e landing */
export const PLAN_ORDER = [
  PLAN_IDS.STARTER,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.STUDIO,
  PLAN_IDS.ENTERPRISE,
];

/** Hierarquia de planos (maior = mais recursos). */
export const PLAN_TIER = {
  [PLAN_IDS.STARTER]: 0,
  [PLAN_IDS.PROFESSIONAL]: 1,
  [PLAN_IDS.STUDIO]: 2,
  [PLAN_IDS.ENTERPRISE]: 3,
};

const LEGACY_PLAN_ALIASES = {
  free: PLAN_IDS.STARTER,
  pro: PLAN_IDS.PROFESSIONAL,
  starter: PLAN_IDS.STARTER,
  professional: PLAN_IDS.PROFESSIONAL,
  studio: PLAN_IDS.STUDIO,
  enterprise: PLAN_IDS.ENTERPRISE,
};

/** Statuses que mantêm os limites do plano pago (objeto `users.plan`). */
export const ACTIVE_PLAN_STATUSES = new Set(["active", "trialing"]);

/**
 * Normaliza um ID de plano bruto (string).
 *
 * @param {string | undefined | null} planId
 * @returns {PlanId}
 */
export function normalizePlanIdFromString(planId) {
  const key = (planId ?? "").toLowerCase().trim();
  return LEGACY_PLAN_ALIASES[key] ?? PLAN_IDS.STARTER;
}

/**
 * Resolve o plano efetivo do usuário a partir de `users.plan`.
 * Aceita o objeto `{ id, status, source }` (padrão) ou string legada.
 *
 * Regras:
 * - Objeto com `status` diferente de `active` / `trialing` → Starter
 * - Objeto com `id` válido e status ativo → limites do `id`
 * - String legada → limites do alias (sem checagem de status)
 *
 * @param {UserPlanRaw} raw
 * @returns {PlanId}
 */
export function normalizeUserPlan(raw) {
  if (typeof raw === "string") {
    return normalizePlanIdFromString(raw);
  }

  if (raw && typeof raw === "object") {
    const status =
      typeof raw.status === "string" ? raw.status.toLowerCase().trim() : "";

    if (status && !ACTIVE_PLAN_STATUSES.has(status)) {
      return PLAN_IDS.STARTER;
    }

    return normalizePlanIdFromString(raw.id);
  }

  return PLAN_IDS.STARTER;
}

/**
 * @param {UserPlanRaw} raw — `users.plan` ou ID legado
 * @returns {PlanId}
 */
export function normalizePlanId(raw) {
  return normalizeUserPlan(raw);
}

/**
 * @param {UserPlanRaw} raw
 * @returns {PlanLimits}
 */
export function getPlanLimits(raw) {
  const normalized = normalizeUserPlan(raw);
  return PLAN_LIMITS[normalized];
}

/**
 * @param {PlanId} planId
 * @returns {number}
 */
export function getPlanTier(planId) {
  return PLAN_TIER[planId] ?? 0;
}

/**
 * @param {PlanId} currentPlanId
 * @param {PlanId} targetPlanId
 * @returns {boolean}
 */
export function isPlanAtOrAbove(currentPlanId, targetPlanId) {
  return getPlanTier(currentPlanId) >= getPlanTier(targetPlanId);
}

/**
 * @param {number | null} value
 * @returns {boolean}
 */
export function isUnlimited(value) {
  return value === null || value === undefined;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatStorageBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * @param {number} current
 * @param {number | null} limit
 * @returns {number} 0–100
 */
export function usagePercentage(current, limit) {
  if (isUnlimited(limit) || limit <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((current / limit) * 100));
}
