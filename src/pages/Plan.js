import { Check } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { PlanUpgradeHint } from '@/components/plans/PlanUpgradeHint';
import { PLAN_LIMITS, PLAN_ORDER } from '@/config/planLimits';
import { usePlanLimits } from '@/hooks/usePlanLimits';

export const Plan = () => {
  const { loading, planId, limits, usageStats } = usePlanLimits();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageHeader
        title="Escolha seu plano"
        subtitle="Gerencie limites e prepare-se para upgrades futuros"
        align="center"
        dataTestId="plan-title"
      />

      <div className="max-w-3xl mx-auto mb-10">
        <PlanUpgradeHint
          compact
          message="A cobrança online ainda não está disponível. Os limites do seu plano atual já estão ativos — em breve você poderá fazer upgrade diretamente por aqui."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {PLAN_ORDER.map((id) => {
          const plan = PLAN_LIMITS[id];
          const isCurrent = planId === id;
          const isHighlighted = id === 'professional';

          return (
            <div
              key={id}
              data-testid={`plan-card-${id}`}
              className={`
                bg-zinc-900/50 rounded-2xl p-8 card-hover relative
                ${
                  isHighlighted
                    ? 'border-2 border-white'
                    : 'border border-zinc-800'
                }
              `}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 bg-white text-black text-xs font-medium rounded-full">
                    Plano atual
                  </div>
                </div>
              )}

              {isHighlighted && !isCurrent && (
                <div className="absolute -top-3 right-6">
                  <div className="px-4 py-1 bg-white text-black text-xs font-medium rounded-full">
                    Recomendado
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-medium text-white mb-4">
                  {plan.displayName}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-light text-white">
                    {plan.priceLabel}
                  </span>
                  <span className="text-lg text-zinc-400">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.featureBullets.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 bg-white rounded-full">
                      <Check size={14} className="text-black" />
                    </div>
                    <span className="text-sm text-zinc-300 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                data-testid={`subscribe-btn-${id}`}
                disabled={isCurrent}
                className={`
                  w-full py-3 rounded-full font-medium btn-scale transition-colors
                  ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : isHighlighted
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'
                  }
                `}
              >
                {isCurrent ? 'Plano atual' : 'Em breve'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto mt-12">
        <SectionHeader title="Seu consumo atual" dataTestId="usage-title" />
        <p className="text-sm text-zinc-500 mb-6 -mt-4">
          Plano {limits.displayName} — limites aplicados em tempo real
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            variant="usage"
            label="Projetos"
            current={String(usageStats.projects.current)}
            limit={usageStats.projects.limitLabel}
            percentage={usageStats.projects.percentage}
          />
          <StatCard
            variant="usage"
            label="Imagens"
            current={String(usageStats.images.current)}
            limit={usageStats.images.limitLabel}
            percentage={usageStats.images.percentage}
          />
          <StatCard
            variant="usage"
            label="Armazenamento"
            current={usageStats.storage.currentLabel}
            limit={`/ ${usageStats.storage.limitLabel}`}
            percentage={usageStats.storage.percentage}
          />
        </div>
      </div>
    </div>
  );
};
