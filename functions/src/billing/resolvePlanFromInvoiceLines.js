/**
 * Resolução de planId a partir de linhas de invoice Stripe (pura).
 * Usada pelo webhook; testável sem Firebase/Stripe SDK.
 */

/**
 * @param {object} line
 * @returns {string | null}
 */
function getStripePriceIdFromInvoiceLine(line) {
  if (line.price && typeof line.price === "object" && typeof line.price.id === "string") {
    return line.price.id;
  }

  if (
    line.pricing?.type === "price_details"
    && line.pricing.price_details?.price
  ) {
    const price = line.pricing.price_details.price;
    return typeof price === "string" ? price : price?.id ?? null;
  }

  if (line.plan && typeof line.plan === "object" && typeof line.plan.id === "string") {
    return line.plan.id;
  }

  return null;
}

/**
 * @param {(stripePriceId: string) => string | null} resolvePlanIdFromStripePriceId
 * @returns {(invoice: { lines?: { data?: unknown[] } }) => { planId: string | null, source: string | null }}
 */
function createGetPlanIdFromInvoiceLines(resolvePlanIdFromStripePriceId) {
  return function getPlanIdFromInvoiceLines(invoice) {
    const lines = invoice.lines?.data;
    if (!Array.isArray(lines) || lines.length === 0) {
      return { planId: null, source: null };
    }

    for (const line of lines) {
      if (!line || typeof line !== "object") {
        continue;
      }

      const price = line.price;
      if (price && typeof price === "object") {
        const fromPriceMetadata = price.metadata?.planId?.trim();
        if (fromPriceMetadata) {
          return { planId: fromPriceMetadata, source: "invoice_line_price_metadata" };
        }
      }

      const stripePriceId = getStripePriceIdFromInvoiceLine(line);
      if (stripePriceId) {
        const fromConfiguredPrice = resolvePlanIdFromStripePriceId(stripePriceId);
        if (fromConfiguredPrice) {
          return { planId: fromConfiguredPrice, source: "invoice_line_stripe_price_id" };
        }
      }

      const plan = line.plan;
      if (plan && typeof plan === "object") {
        const fromPlanMetadata = plan.metadata?.planId?.trim();
        if (fromPlanMetadata) {
          return { planId: fromPlanMetadata, source: "invoice_line_plan_metadata" };
        }
      }
    }

    return { planId: null, source: null };
  };
}

/**
 * Ordem de resolução espelhando o webhook (metadata → lines → fallbacks).
 * @param {{
 *   subscriptionMetaPlanId?: string | null,
 *   invoiceLinePlanId?: string | null,
 *   subscriptionItemPlanId?: string | null,
 *   firestoreSubscriptionPlanId?: string | null,
 *   usersPlanFallback?: string | null,
 * }} sources
 * @returns {{ planId: string, source: string }}
 */
function resolvePlanIdFromSources(sources) {
  if (sources.subscriptionMetaPlanId) {
    return {
      planId: sources.subscriptionMetaPlanId,
      source: "stripe_subscription_metadata",
    };
  }
  if (sources.invoiceLinePlanId) {
    return {
      planId: sources.invoiceLinePlanId,
      source: "invoice_line",
    };
  }
  if (sources.subscriptionItemPlanId) {
    return {
      planId: sources.subscriptionItemPlanId,
      source: "stripe_subscription_item_price_id",
    };
  }
  if (sources.firestoreSubscriptionPlanId) {
    return {
      planId: sources.firestoreSubscriptionPlanId,
      source: "firestore_subscriptions",
    };
  }
  if (sources.usersPlanFallback) {
    return {
      planId: sources.usersPlanFallback,
      source: "users_plan_fallback",
    };
  }
  return { planId: "starter", source: "default_starter" };
}

module.exports = {
  getStripePriceIdFromInvoiceLine,
  createGetPlanIdFromInvoiceLines,
  resolvePlanIdFromSources,
};
