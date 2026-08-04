import { AlertTriangle } from "lucide-react";
import { isUnlimited } from "@/config/planLimits";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { analyzePlanUsage, getUsageVisualClasses } from "@/utils/planUsageAlerts";

/**
 * Card de plano e consumo para o dashboard (abaixo dos KPIs).
 *
 * @param {{
 *   limits: import("@/config/planLimits").PlanLimits,
 *   usageStats: ReturnType<import("@/services/plans/planService").buildUsageStats>,
 *   usage: { projectCount: number, imageCount: number, storageBytes: number },
 * }} props
 */
export function PlanUsageCard({ limits, usageStats, usage }) {
  const { atAnyLimit, nearLimit } = analyzePlanUsage(limits, usage, usageStats);

  const projectDisplay = isUnlimited(limits.maxProjects)
    ? `${usageStats.projects.current} / Ilimitado`
    : `${usageStats.projects.current} / ${limits.maxProjects}`;

  const imageDisplay = isUnlimited(limits.maxTotalImages)
    ? `${usageStats.images.current} / Ilimitado`
    : `${usageStats.images.current} / ${limits.maxTotalImages}`;

  const storageDisplay = `${usageStats.storage.currentLabel} / ${usageStats.storage.limitLabel}`;

  const metricClass = (percentage, hasFiniteLimit) => {
    if (!hasFiniteLimit) {
      return "text-white";
    }

    return getUsageVisualClasses(percentage).valueClassName;
  };

  return (
    <div
      className="mb-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8"
      data-testid="plan-usage-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-zinc-400 mb-1">Seu plano</p>
          <h2 className="text-xl font-light text-white">
            Plano {limits.displayName}
          </h2>
        </div>
        {nearLimit && !atAnyLimit && (
          <div
            className="flex items-center gap-2 text-sm text-amber-400/90"
            data-testid="plan-usage-near-limit"
          >
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>Próximo do limite em um ou mais recursos</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <UsageMetric
          label="Projetos"
          value={projectDisplay}
          percentage={usageStats.projects.percentage}
          valueClassName={metricClass(
            usageStats.projects.percentage,
            !isUnlimited(limits.maxProjects),
          )}
          showBar={!isUnlimited(limits.maxProjects)}
          dataTestId="plan-usage-projects"
        />
        <UsageMetric
          label="Imagens"
          value={imageDisplay}
          percentage={usageStats.images.percentage}
          valueClassName={metricClass(
            usageStats.images.percentage,
            !isUnlimited(limits.maxTotalImages),
          )}
          showBar={!isUnlimited(limits.maxTotalImages)}
          dataTestId="plan-usage-images"
        />
        <UsageMetric
          label="Armazenamento"
          value={storageDisplay}
          percentage={usageStats.storage.percentage}
          valueClassName={metricClass(usageStats.storage.percentage, true)}
          showBar
          dataTestId="plan-usage-storage"
        />
      </div>

      {atAnyLimit && (
        <UpgradePrompt
          variant="limit"
          compact
          message="Você atingiu um dos limites do seu plano."
          secondaryMessage="Faça upgrade para liberar mais recursos."
          showUpgradeButton
        />
      )}
    </div>
  );
}

function UsageMetric({
  label,
  value,
  percentage,
  valueClassName,
  showBar,
  dataTestId,
}) {
  return (
    <div data-testid={dataTestId}>
      <p className="text-sm text-zinc-400 mb-2">{label}</p>
      <p className={`text-lg font-light tabular-nums ${valueClassName}`}>{value}</p>
      {showBar && (
        <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getUsageVisualClasses(percentage).barClassName}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
    </div>
  );
}
