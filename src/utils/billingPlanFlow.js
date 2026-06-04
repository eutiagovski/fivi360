import {
  BILLING_UPGRADE_PLAN_IDS,
  isBillingUpgradePlanId,
} from "@/config/billing";

/**
 * Destino após login/cadastro quando há intenção de assinar um plano pago.
 * @param {string | null | undefined} plan
 * @returns {string}
 */
export function getPostAuthRedirectPath(plan) {
  if (isBillingUpgradePlanId(plan)) {
    return `/plan?upgrade=${plan}`;
  }
  return "/dashboard";
}

/**
 * URL da central de assinatura com modal de upgrade.
 * @param {string} plan
 * @returns {string}
 */
export function getPlanUpgradePath(plan) {
  return `/plan?upgrade=${plan}`;
}

/**
 * URL de cadastro com plano desejado preservado.
 * @param {string} plan
 * @returns {string}
 */
export function getRegisterWithPlanPath(plan) {
  return `/register?plan=${plan}`;
}

/**
 * Anexa `?plan=` ou `&plan=` a rotas de auth quando aplicável.
 * @param {string} path
 * @param {string | null | undefined} plan
 * @returns {string}
 */
export function appendPlanQueryToPath(path, plan) {
  if (!plan || !isBillingUpgradePlanId(plan)) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}plan=${encodeURIComponent(plan)}`;
}

export { BILLING_UPGRADE_PLAN_IDS, isBillingUpgradePlanId };
