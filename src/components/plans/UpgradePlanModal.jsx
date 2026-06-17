import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getBillingPlanChosenMessage,
  UPGRADE_PLAN_PRICES,
} from "@/config/billing";
import { PLAN_IDS, PLAN_LIMITS } from "@/config/planLimits";

const UPGRADE_PLAN_IDS = [PLAN_IDS.PROFESSIONAL, PLAN_IDS.ENTERPRISE];

/**
 * Modal de upgrade / alteração de plano.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSubscribe?: (planId: string) => void | Promise<void>,
 *   highlightedPlanId?: string | null,
 * }} props
 */
export function UpgradePlanModal({
  open,
  onOpenChange,
  onSubscribe,
  highlightedPlanId = null,
}) {
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);

  const chosenMessage = highlightedPlanId
    ? getBillingPlanChosenMessage(highlightedPlanId)
    : "";

  const handleSubscribe = async (planId) => {
    if (subscribingPlanId) {
      return;
    }

    setSubscribingPlanId(planId);

    try {
      await onSubscribe?.(planId);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-2xl"
        data-testid="upgrade-plan-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-medium">
            Escolha seu plano
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-left">
            Compare os benefícios e assine o plano Professional via checkout seguro.
          </DialogDescription>
        </DialogHeader>

        {chosenMessage ? (
          <p
            className="text-sm text-zinc-300 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3"
            data-testid="upgrade-modal-chosen-plan"
          >
            {chosenMessage}
          </p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {UPGRADE_PLAN_IDS.map((planId) => {
            const plan = PLAN_LIMITS[planId];
            const pricing = UPGRADE_PLAN_PRICES[planId];
            const isHighlighted =
              highlightedPlanId === planId ||
              (highlightedPlanId == null && planId === PLAN_IDS.PROFESSIONAL);

            const isSubscribing = subscribingPlanId === planId;
            const isBusy = subscribingPlanId != null;

            return (
              <div
                key={planId}
                data-testid={`upgrade-modal-card-${planId}`}
                className={`
                  rounded-2xl p-6 border relative transition-shadow
                  ${
                    isHighlighted
                      ? "border-2 border-white bg-zinc-900/80 ring-1 ring-white/20"
                      : "border border-zinc-800 bg-zinc-900/50"
                  }
                `}
              >
                {planId === PLAN_IDS.PROFESSIONAL && highlightedPlanId == null && (
                  <div className="absolute -top-3 right-4">
                    <div className="px-3 py-0.5 bg-white text-black text-xs font-medium rounded-full">
                      Recomendado
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-medium text-white mb-3">
                  {plan.displayName}
                </h3>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-light text-white">
                    {pricing.priceLabel}
                  </span>
                  <span className="text-sm text-zinc-400">{pricing.periodLabel}</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.featureBullets.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                      <div className="mt-0.5 p-0.5 bg-white rounded-full flex-shrink-0">
                        <Check size={12} className="text-black" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  data-testid={`upgrade-modal-subscribe-${planId}`}
                  onClick={() => handleSubscribe(planId)}
                  disabled={isBusy}
                  className={`
                    w-full py-2.5 rounded-full text-sm font-medium btn-scale transition-colors
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${
                      isHighlighted
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700"
                    }
                  `}
                >
                  {isSubscribing ? "Redirecionando..." : "Assinar plano"}
                </button>
              </div>
            );
          })}
        </div>

        <p
          className="text-center text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3"
          data-testid="upgrade-modal-billing-notice"
        >
          Checkout seguro via Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
