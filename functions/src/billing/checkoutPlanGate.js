/**
 * Validação pura de planId para createStripeCheckoutSession.
 * priceId é sempre resolvido no backend — nunca confiar em priceId do cliente.
 */

/**
 * @param {unknown} planId
 * @returns {{ ok: true, planId: string } | { ok: false, code: string, message: string }}
 */
function normalizeCheckoutPlanId(planId) {
  if (typeof planId !== "string") {
    return { ok: false, code: "invalid-argument", message: "planId inválido." };
  }

  const normalized = planId.toLowerCase().trim();

  if (!normalized) {
    return { ok: false, code: "invalid-argument", message: "planId inválido." };
  }

  return { ok: true, planId: normalized };
}

/**
 * @param {string} normalizedPlanId
 * @param {Set<string>} allowedCheckoutPlanIds
 * @param {(planKey: string) => string} getStripePriceId
 * @returns {{ ok: true, planId: string, priceId: string } | { ok: false, code: string, message: string }}
 */
function resolveCheckoutPriceForPlan(
  normalizedPlanId,
  allowedCheckoutPlanIds,
  getStripePriceId,
) {
  if (normalizedPlanId === "enterprise" || normalizedPlanId === "starter") {
    return {
      ok: false,
      code: "invalid-argument",
      message: "Checkout indisponível para este plano.",
    };
  }

  if (!allowedCheckoutPlanIds.has(normalizedPlanId)) {
    return {
      ok: false,
      code: "invalid-argument",
      message: "planId inválido ou preço Stripe não configurado.",
    };
  }

  const priceId = getStripePriceId(normalizedPlanId);
  if (!priceId) {
    return {
      ok: false,
      code: "failed-precondition",
      message: "Preço Stripe não configurado.",
    };
  }

  return { ok: true, planId: normalizedPlanId, priceId };
}

/**
 * Valida planId do request e resolve priceId no backend.
 * Ignora qualquer priceId enviado pelo cliente.
 *
 * @param {{ planId?: unknown, priceId?: unknown }} data
 * @param {{
 *   getAllowedCheckoutPlanIds: () => Set<string>,
 *   getStripePriceId: (planKey: string) => string,
 * }} deps
 * @returns {{ ok: true, planId: string, priceId: string } | { ok: false, code: string, message: string }}
 */
function resolveCheckoutPlanFromRequest(data, deps) {
  const normalized = normalizeCheckoutPlanId(data?.planId);
  if (!normalized.ok) {
    return normalized;
  }

  return resolveCheckoutPriceForPlan(
    normalized.planId,
    deps.getAllowedCheckoutPlanIds(),
    deps.getStripePriceId,
  );
}

module.exports = {
  normalizeCheckoutPlanId,
  resolveCheckoutPriceForPlan,
  resolveCheckoutPlanFromRequest,
};
