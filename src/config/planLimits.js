/**
 * Definição central dos planos e limites do FIVI360.
 * Fonte única de verdade para enforcement e UI.
 *
 * Formato persistido em `users.plan` (padrão):
 *   { id: "starter" | "professional" | "enterprise", status, source, ... }
 *
 * Formato legado (compatível):
 *   "starter" | "professional" | "enterprise"
 */

export const PLAN_IDS = {
  STARTER: "starter",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
};

/** @typedef {'starter' | 'professional' | 'enterprise'} PlanId */

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
 * @property {number | null} maxProjects — null = ilimitado
 * @property {number | null} maxTotalImages — null = ilimitado
 * @property {number} maxStorageBytes
 * @property {boolean} hotspotsEnabled
 * @property {boolean} publicPortfolioEnabled
 * @property {boolean} publicVisibilityEnabled
 * @property {string} priceLabel
 * @property {string[]} featureBullets
 */

/** @type {Record<PlanId, PlanLimits>} */
export const PLAN_LIMITS = {
  [PLAN_IDS.STARTER]: {
    name: PLAN_IDS.STARTER,
    displayName: "Starter",
    maxProjects: 3,
    maxTotalImages: 10,
    maxStorageBytes: 10 * 1024 * 1024,
    hotspotsEnabled: false,
    publicPortfolioEnabled: false,
    publicVisibilityEnabled: false,
    priceLabel: "R$ 0",
    featureBullets: [
      "3 projetos",
      "10 imagens no total",
      "10 MB de armazenamento",
      "Links compartilhados",
      "Sem hotspots",
      "Sem portfólio público",
    ],
  },
  [PLAN_IDS.PROFESSIONAL]: {
    name: PLAN_IDS.PROFESSIONAL,
    displayName: "Professional",
    maxProjects: null,
    maxTotalImages: null,
    maxStorageBytes: 100 * 1024 * 1024,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    priceLabel: "Em breve",
    featureBullets: [
      "Projetos ilimitados",
      "Imagens ilimitadas",
      "100 MB de armazenamento",
      "Hotspots no viewer 360°",
      "Portfólio público",
      "Links compartilhados",
    ],
  },
  [PLAN_IDS.ENTERPRISE]: {
    name: PLAN_IDS.ENTERPRISE,
    displayName: "Enterprise",
    maxProjects: null,
    maxTotalImages: null,
    maxStorageBytes: 1 * 1024 * 1024 * 1024,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    priceLabel: "Em breve",
    featureBullets: [
      "Tudo liberado",
      "1 GB de armazenamento",
      "Suporte prioritário",
      "Recursos avançados (em breve)",
    ],
  },
};

/** Ordem de exibição na página de planos */
export const PLAN_ORDER = [
  PLAN_IDS.STARTER,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
];

const LEGACY_PLAN_ALIASES = {
  free: PLAN_IDS.STARTER,
  pro: PLAN_IDS.PROFESSIONAL,
  starter: PLAN_IDS.STARTER,
  professional: PLAN_IDS.PROFESSIONAL,
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
