/**
 * Definição central dos planos e limites do FIVI360.
 * Fonte única de verdade para enforcement e UI.
 *
 * IDs persistidos em `users.plan`: starter | professional | enterprise
 */

export const PLAN_IDS = {
  STARTER: "starter",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
};

/** @typedef {'starter' | 'professional' | 'enterprise'} PlanId */

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
    maxStorageBytes: 50 * 1024 * 1024,
    hotspotsEnabled: false,
    publicPortfolioEnabled: false,
    publicVisibilityEnabled: false,
    priceLabel: "R$ 0",
    featureBullets: [
      "3 projetos",
      "10 imagens no total",
      "50 MB de armazenamento",
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
    maxStorageBytes: 500 * 1024 * 1024,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    priceLabel: "Em breve",
    featureBullets: [
      "Projetos ilimitados",
      "Imagens ilimitadas",
      "500 MB de armazenamento",
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
    maxStorageBytes: 5 * 1024 * 1024 * 1024,
    hotspotsEnabled: true,
    publicPortfolioEnabled: true,
    publicVisibilityEnabled: true,
    priceLabel: "Em breve",
    featureBullets: [
      "Tudo liberado",
      "5 GB de armazenamento",
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

/**
 * @param {string | undefined | null} planId
 * @returns {PlanId}
 */
export function normalizePlanId(planId) {
  const key = (planId ?? "").toLowerCase().trim();
  return LEGACY_PLAN_ALIASES[key] ?? PLAN_IDS.STARTER;
}

/**
 * @param {string | undefined | null} planId
 * @returns {PlanLimits}
 */
export function getPlanLimits(planId) {
  const normalized = normalizePlanId(planId);
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
