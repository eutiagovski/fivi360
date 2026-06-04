import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  LANDING_PRICING_MARKETING,
  LANDING_PRICING_SECTION,
} from "@/config/landingContent";
import { PLAN_IDS, PLAN_LIMITS, PLAN_ORDER } from "@/config/planLimits";
import { useAuth } from "@/hooks/useAuth";
import {
  getPlanUpgradePath,
  getRegisterWithPlanPath,
} from "@/utils/billingPlanFlow";

const primaryBtnClass =
  "w-full py-3 rounded-full font-medium btn-scale transition-colors bg-white text-black hover:bg-zinc-200";

/**
 * @param {string} planId
 * @param {boolean} isAuthenticated
 * @returns {string}
 */
function getPaidPlanCtaHref(planId, isAuthenticated) {
  if (isAuthenticated) {
    return getPlanUpgradePath(planId);
  }
  return getRegisterWithPlanPath(planId);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_ORDER.map((id) => {
            const plan = PLAN_LIMITS[id];
            const marketing = LANDING_PRICING_MARKETING[id];
            const isHighlighted = marketing.highlighted;
            const isPaidPlan =
              id === PLAN_IDS.PROFESSIONAL || id === PLAN_IDS.ENTERPRISE;
            const ctaHref = isPaidPlan
              ? getPaidPlanCtaHref(id, Boolean(user))
              : marketing.ctaTo;

            return (
              <div
                key={id}
                data-testid={`landing-pricing-card-${id}`}
                className={`
                  bg-zinc-900/50 rounded-2xl p-8 card-hover relative
                  ${
                    isHighlighted
                      ? "border-2 border-white"
                      : "border border-zinc-800"
                  }
                `}
              >
                {marketing.badge && (
                  <div className="absolute -top-3 right-6">
                    <div className="px-4 py-1 bg-white text-black text-xs font-medium rounded-full">
                      {marketing.badge}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-medium text-white mb-4">
                    {plan.displayName}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-light text-white">
                      {marketing.priceLabel}
                    </span>
                    <span className="text-lg text-zinc-400">/mês</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
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

                <Button className={primaryBtnClass} asChild>
                  <Link
                    to={ctaHref}
                    data-testid={`landing-pricing-btn-${id}`}
                  >
                    {marketing.ctaLabel}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-zinc-500 text-center mt-10 max-w-2xl mx-auto">
          {LANDING_PRICING_SECTION.footnote}
        </p>
      </div>
    </section>
  );
}
