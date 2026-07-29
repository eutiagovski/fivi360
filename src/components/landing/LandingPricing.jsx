import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  LANDING_PRICING_MARKETING,
  LANDING_PRICING_SECTION,
} from "@/config/landingContent";
import { PLAN_IDS, PLAN_LIMITS, PLAN_ORDER } from "@/config/planLimits";
import { isStudioCheckoutConfigured } from "@/config/billing";
import { useAuth } from "@/hooks/useAuth";
import {
  getPlanUpgradePath,
  getRegisterWithPlanPath,
} from "@/utils/billingPlanFlow";
import { trackEvent } from "@/services/analytics/analyticsService";

const primaryBtnClass =
  "w-full py-3 rounded-full font-medium btn-scale transition-colors bg-white text-black hover:bg-zinc-200";

const disabledBtnClass =
  "w-full py-3 rounded-full font-medium bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed";

/**
 * @param {string} planId
 * @param {boolean} isAuthenticated
 * @returns {{ href: string, disabled: boolean }}
 */
function getPlanCta(planId, isAuthenticated) {
  const marketing = LANDING_PRICING_MARKETING[planId];

  if (planId === PLAN_IDS.ENTERPRISE || marketing.ctaDisabled) {
    return { href: marketing.ctaTo, disabled: true };
  }

  if (planId === PLAN_IDS.STARTER) {
    return { href: marketing.ctaTo, disabled: false };
  }

  if (planId === PLAN_IDS.STUDIO && !isStudioCheckoutConfigured()) {
    return { href: "#", disabled: true };
  }

  if (isAuthenticated) {
    return { href: getPlanUpgradePath(planId), disabled: false };
  }

  return { href: getRegisterWithPlanPath(planId), disabled: false };
}

/**
 * @param {string} planId
 * @returns {string}
 */
function getCtaLabel(planId) {
  const marketing = LANDING_PRICING_MARKETING[planId];

  if (planId === PLAN_IDS.STUDIO && !isStudioCheckoutConfigured()) {
    return "Em breve";
  }

  return marketing.ctaLabel;
}

export function LandingPricing() {
  const { user } = useAuth();

  return (
    <section id="precos" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_PRICING_SECTION.title}
            subtitle={LANDING_PRICING_SECTION.subtitle}
            dataTestId="landing-pricing-title"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLAN_ORDER.map((id) => {
            const plan = PLAN_LIMITS[id];
            const marketing = LANDING_PRICING_MARKETING[id];
            const isHighlighted = marketing.highlighted;
            const { href, disabled } = getPlanCta(id, Boolean(user));
            const ctaLabel = getCtaLabel(id);

            return (
              <div
                key={id}
                data-testid={`landing-pricing-card-${id}`}
                className={`
                  bg-zinc-900/50 rounded-2xl p-8 card-hover relative flex flex-col
                  ${
                    isHighlighted
                      ? "border-2 border-white"
                      : "border border-zinc-800"
                  }
                `}
              >
                {marketing.badge ? (
                  <div className="absolute -top-3 right-6">
                    <div className="px-4 py-1 bg-white text-black text-xs font-medium rounded-full">
                      {marketing.badge}
                    </div>
                  </div>
                ) : null}

                <div className="mb-4">
                  <h3 className="text-xl font-medium text-white mb-2">
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4 min-h-[2.75rem]">
                    {marketing.headline}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-light text-white">
                      {marketing.priceLabel}
                    </span>
                    {marketing.periodLabel ? (
                      <span className="text-base text-zinc-400">
                        {marketing.periodLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {marketing.featureBullets.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 p-0.5 bg-white rounded-full flex-shrink-0">
                        <Check size={14} className="text-black" />
                      </div>
                      <span className="text-sm text-zinc-300 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {disabled ? (
                  id === PLAN_IDS.ENTERPRISE ? (
                    <a
                      href={href}
                      data-testid={`landing-pricing-btn-${id}`}
                      className={`${disabledBtnClass} inline-flex items-center justify-center text-center hover:text-zinc-400`}
                    >
                      {ctaLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      data-testid={`landing-pricing-btn-${id}`}
                      className={disabledBtnClass}
                    >
                      {ctaLabel}
                    </button>
                  )
                ) : (
                  <Button className={primaryBtnClass} asChild>
                    <Link
                      to={href}
                      data-testid={`landing-pricing-btn-${id}`}
                      onClick={() => {
                        if (id === PLAN_IDS.PROFESSIONAL) {
                          trackEvent("click_pricing_pro");
                        }
                      }}
                    >
                      {ctaLabel}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-zinc-500 text-center mt-10 max-w-2xl mx-auto">
          {LANDING_PRICING_SECTION.footnote}
        </p>
        {LANDING_PRICING_SECTION.estimateNote ? (
          <p
            className="text-xs text-zinc-600 text-center mt-3 max-w-2xl mx-auto"
            data-testid="landing-pricing-estimate-note"
          >
            {LANDING_PRICING_SECTION.estimateNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
