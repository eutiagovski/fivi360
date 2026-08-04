/**
 * Extração de período de assinatura compatível com Stripe Basil/Dahlia
 * (current_period_* em subscription items) e APIs anteriores (top-level).
 */

/**
 * @param {import("stripe").Stripe.Subscription | null | undefined} stripeSubscription
 * @returns {{
 *   currentPeriodStart: number | null,
 *   currentPeriodEnd: number | null,
 *   cancelAtPeriodEnd: boolean,
 * }}
 */
function extractSubscriptionPeriodUnix(stripeSubscription) {
  if (!stripeSubscription || typeof stripeSubscription !== "object") {
    return {
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  let currentPeriodStart = null;
  let currentPeriodEnd = null;

  const items = stripeSubscription.items?.data;
  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item || typeof item !== "object") {
        continue;
      }

      if (typeof item.current_period_end === "number") {
        if (
          currentPeriodEnd == null
          || item.current_period_end > currentPeriodEnd
        ) {
          currentPeriodEnd = item.current_period_end;
          currentPeriodStart =
            typeof item.current_period_start === "number"
              ? item.current_period_start
              : currentPeriodStart;
        }
      } else if (
        currentPeriodStart == null
        && typeof item.current_period_start === "number"
      ) {
        currentPeriodStart = item.current_period_start;
      }
    }
  }

  // Fallback pré-Basil (subscription.current_period_*)
  if (
    currentPeriodEnd == null
    && typeof stripeSubscription.current_period_end === "number"
  ) {
    currentPeriodEnd = stripeSubscription.current_period_end;
  }

  if (
    currentPeriodStart == null
    && typeof stripeSubscription.current_period_start === "number"
  ) {
    currentPeriodStart = stripeSubscription.current_period_start;
  }

  return {
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end === true,
  };
}

module.exports = {
  extractSubscriptionPeriodUnix,
};
