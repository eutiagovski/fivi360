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
  CHECKOUT_LOADING_MESSAGE,
  getBillingPlanChosenMessage,
  getUpgradePlanButtonState,
  UPGRADE_PLAN_PRICES,
} from "@/config/billing";
import {
  PLAN_IDS,
  PLAN_LIMITS,
  PLAN_ORDER,
  STORAGE_IMAGE_ESTIMATE_NOTE,
} from "@/config/planLimits";

/**
 * Modal de upgrade / alteração de plano.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSubscribe?: (planId: string) => void | Promise<void>,
 *   highlightedPlanId?: string | null,
 *   currentPlanId?: import("@/config/planLimits").PlanId,
 * }} props
 */
export function UpgradePlanModal({
  open,
  onOpenChange,
  onSubscribe,
  highlightedPlanId = null,
  currentPlanId = PLAN_IDS.STARTER,
}) {
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);

  const chosenMessage = highlightedPlanId
    ? getBillingPlanChosenMessage(highlightedPlanId)
    : "";

  const handleSubscribe = async (planId) => {
    const buttonState = getUpgradePlanButtonState(planId, currentPlanId);

    if (buttonState.disabled || subscribingPlanId) {
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
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-5xl max-h-[90vh] overflow-y-auto"
        data-testid="upgrade-plan-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-medium">
            Escolha seu plano
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-left">
            Compare os benefícios e assine o plano ideal para o seu momento.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 py-2">
          {PLAN_ORDER.map((planId) => {
            const plan = PLAN_LIMITS[planId];
            const pricing = UPGRADE_PLAN_PRICES[planId];
            const isHighlighted =
              highlightedPlanId === planId ||
              (highlightedPlanId == null && planId === PLAN_IDS.PROFESSIONAL);
            const buttonState = getUpgradePlanButtonState(planId, currentPlanId);
            const isEnterprise = planId === PLAN_IDS.ENTERPRISE;
            const isStarter = planId === PLAN_IDS.STARTER;
            const isSubscribing = subscribingPlanId === planId;
            const isBusy = subscribingPlanId != null;
            const isDisabled = buttonState.disabled || isBusy;
            const showCheckoutNotice =
              !isStarter && !isEnterprise && !buttonState.disabled;

            return (
              <div
                key={planId}
                data-testid={`upgrade-modal-card-${planId}`}
                className={`
                  rounded-2xl p-5 border relative transition-shadow flex flex-col
                  ${
                    isHighlighted
                      ? "border-2 border-white bg-zinc-900/80 ring-1 ring-white/20"
                      : "border border-zinc-800 bg-zinc-900/50"
                  }
                `}
              >
                {plan.badge ? (
                  <div className="absolute -top-3 right-4">
                    <div className="px-3 py-0.5 bg-white text-black text-xs font-medium rounded-full">
                      {plan.badge}
                    </div>
                  </div>
                ) : null}

                <h3 className="text-lg font-medium text-white mb-1">
                  {plan.displayName}
                </h3>

                <p className="text-xs text-zinc-400 mb-3 leading-relaxed min-h-[2.5rem]">
                  {plan.tagline}
                </p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-light text-white">
                    {pricing.priceLabel}
                  </span>
                  {pricing.periodLabel ? (
                    <span className="text-sm text-zinc-400">
                      {pricing.periodLabel}
                    </span>
                  ) : null}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.featureBullets.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-zinc-300"
                    >
                      <div className="mt-0.5 p-0.5 bg-white rounded-full flex-shrink-0">
                        <Check size={10} className="text-black" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {buttonState.contactHref ? (
                  <a
                    href={buttonState.contactHref}
                    data-testid={`upgrade-modal-subscribe-${planId}`}
                    className="w-full py-2.5 rounded-full text-sm font-medium text-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    {buttonState.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    data-testid={`upgrade-modal-subscribe-${planId}`}
                    onClick={() => handleSubscribe(planId)}
                    disabled={isDisabled}
                    className={`
                      w-full py-2.5 rounded-full text-sm font-medium btn-scale transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${
                        isHighlighted && !buttonState.disabled
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700"
                      }
                    `}
                  >
                    {isSubscribing
                      ? CHECKOUT_LOADING_MESSAGE
                      : isStarter && currentPlanId === PLAN_IDS.STARTER
                        ? "Plano atual"
                        : isStarter
                          ? "Começar gratuitamente"
                          : buttonState.label}
                  </button>
                )}

                {showCheckoutNotice ? (
                  <p className="text-[10px] text-zinc-500 text-center mt-2">
                    Checkout seguro via Stripe
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <p
          className="text-center text-xs text-zinc-500 max-w-3xl mx-auto"
          data-testid="upgrade-modal-estimate-note"
        >
          {STORAGE_IMAGE_ESTIMATE_NOTE}
        </p>

        <p
          className="text-center text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3"
          data-testid="upgrade-modal-billing-notice"
        >
          Planos pagos são processados via checkout seguro Stripe. O Enterprise
          é sob consulta — fale conosco para uma proposta personalizada.
        </p>
      </DialogContent>
    </Dialog>
  );
}
