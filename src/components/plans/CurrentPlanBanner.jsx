import { PLAN_IDS } from "@/config/planLimits";
import { cn } from "@/lib/utils";

const PLAN_BANNER_CONTENT = {
  [PLAN_IDS.STARTER]: {
    badge: "STARTER",
    title: "Plano Starter",
    description:
      "Experimente o FIVI360 — ideal para conhecer a plataforma e criar suas primeiras apresentações em 360°.",
    showProCta: true,
  },
  [PLAN_IDS.PROFESSIONAL]: {
    badge: "PROFESSIONAL",
    title: "Plano Professional ativo",
    description:
      "Para arquitetos e designers independentes — projetos ilimitados, hotspots, portfólio público e analytics básico.",
    showProCta: false,
  },
  [PLAN_IDS.STUDIO]: {
    badge: "STUDIO",
    title: "Plano Studio ativo",
    description:
      "Para escritórios em crescimento — mais armazenamento, analytics avançado e suporte prioritário.",
    showProCta: false,
  },
  [PLAN_IDS.ENTERPRISE]: {
    badge: "ENTERPRISE",
    title: "Plano Enterprise ativo",
    description:
      "Solução corporativa com multiusuário, workspaces compartilhados e recursos avançados.",
    showProCta: false,
  },
};

/**
 * Resumo premium do plano atual (página Plano).
 *
 * @param {{
 *   planId: import("@/config/planLimits").PlanId,
 *   onViewProBenefits?: () => void,
 *   className?: string,
 * }} props
 */
export function CurrentPlanBanner({
  planId,
  onViewProBenefits,
  className = "",
}) {
  const content =
    PLAN_BANNER_CONTENT[planId] ?? PLAN_BANNER_CONTENT[PLAN_IDS.STARTER];

  return (
    <aside
      className={cn(
        "w-full min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 sm:px-6 sm:py-5",
        className,
      )}
      data-testid="current-plan-banner"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <span
            className="inline-block text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase"
            data-testid="current-plan-badge"
          >
            {content.badge}
          </span>
          <h2
            className="text-lg font-light text-white tracking-tight"
            data-testid="current-plan-banner-title"
          >
            {content.title}
          </h2>
          <p
            className="text-sm text-zinc-400 leading-relaxed max-w-2xl"
            data-testid="current-plan-banner-description"
          >
            {content.description}
          </p>
        </div>
        {content.showProCta && onViewProBenefits ? (
          <button
            type="button"
            onClick={onViewProBenefits}
            data-testid="current-plan-view-pro-benefits"
            className="shrink-0 w-fit text-sm font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline transition-colors"
          >
            Ver benefícios do Pro
          </button>
        ) : null}
      </div>
    </aside>
  );
}
