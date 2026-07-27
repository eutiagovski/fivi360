/**
 * Resolver puro de entitlement de portfólio público (RC-P0.5A).
 *
 * Fonte de verdade: `users.plan` (gravado pelo webhook Stripe / Admin SDK).
 * Não usa workspaces.planId, payload do cliente, nem billing IDs.
 */

const PUBLIC_PORTFOLIO_PLAN_IDS = new Set(["professional", "studio", "enterprise"]);
const ACTIVE_PLAN_STATUSES = new Set(["active", "trialing"]);

/**
 * @param {unknown} plan — `users.plan` (string legada ou objeto)
 * @returns {"starter" | "professional" | "studio" | "enterprise"}
 */
function normalizePlanId(plan) {
  if (typeof plan === "string") {
    const key = plan.toLowerCase().trim();
    if (key === "professional" || key === "studio" || key === "enterprise") {
      return key;
    }
    return "starter";
  }

  if (plan && typeof plan === "object" && typeof plan.id === "string") {
    const status =
      typeof plan.status === "string" ? plan.status.toLowerCase().trim() : "";

    // Status presente e fora de active/trialing → Starter (plano pago inativo).
    if (status && !ACTIVE_PLAN_STATUSES.has(status)) {
      return "starter";
    }

    const id = plan.id.toLowerCase().trim();
    if (id === "professional" || id === "studio" || id === "enterprise") {
      return id;
    }
  }

  return "starter";
}

/**
 * @param {boolean} portfolioEnabled — preferência em publicProfiles
 * @param {unknown} plan — users.plan
 * @returns {boolean}
 */
function computePortfolioAvailable(portfolioEnabled, plan) {
  if (portfolioEnabled !== true) {
    return false;
  }

  return PUBLIC_PORTFOLIO_PLAN_IDS.has(normalizePlanId(plan));
}

/**
 * Resolve entitlement a partir do estado servidor (sem payload do cliente).
 *
 * @param {{
 *   userExists: boolean,
 *   plan: unknown,
 *   portfolioEnabled: unknown,
 * }} input
 * @returns {{
 *   ok: true,
 *   portfolioAvailable: boolean,
 *   planId: "starter" | "professional" | "studio" | "enterprise",
 * } | { ok: false, code: "user-not-found" }}
 */
function resolvePortfolioAvailableFromServerState(input) {
  if (!input.userExists) {
    return { ok: false, code: "user-not-found" };
  }

  const planId = normalizePlanId(input.plan);
  const portfolioEnabled = input.portfolioEnabled === true;
  const portfolioAvailable = computePortfolioAvailable(portfolioEnabled, input.plan);

  return {
    ok: true,
    portfolioAvailable,
    planId,
  };
}

module.exports = {
  PUBLIC_PORTFOLIO_PLAN_IDS,
  ACTIVE_PLAN_STATUSES,
  normalizePlanId,
  computePortfolioAvailable,
  resolvePortfolioAvailableFromServerState,
};
