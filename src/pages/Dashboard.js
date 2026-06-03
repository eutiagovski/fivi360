import { Plus, Image, Link2, HardDrive, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { ProjectCard } from '@/components/common/ProjectCard';
import { ImageCard } from '@/components/common/ImageCard';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { PlanUpgradeHint } from '@/components/plans/PlanUpgradeHint';
import { UpgradePrompt } from '@/components/plans/UpgradePrompt';
import { PLAN_IDS } from '@/config/planLimits';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useProjects } from '@/hooks/useProjects';
import { useRecentImages } from '@/hooks/useRecentImages';
import {
  formatDashboardStorageCurrent,
  getDashboardCountLimitDisplay,
  getDashboardStorageLimitDisplay,
} from '@/utils/dashboardKpiDisplay';
import {
  isAtImageLimit,
  isAtProjectLimit,
  isAtStorageLimit,
} from '@/utils/planUsageAlerts';

export const Dashboard = () => {
  const { cardProjects, projects, loading } = useProjects();
  const { cardImages: recentImages, loading: imagesLoading } = useRecentImages(3);
  const { usageStats, limits, loading: planLoading, planId, usage } =
    usePlanLimits();
  const recentProjects = cardProjects.slice(0, 3);

  const showStarterLimitBanner =
    planId === PLAN_IDS.STARTER &&
    (isAtProjectLimit(limits, usage) ||
      isAtImageLimit(limits, usage) ||
      isAtStorageLimit(limits, usage));

  if (loading || imagesLoading || planLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral dos seus projetos"
        dataTestId="dashboard-title"
      />

      <div className="max-w-3xl mb-10">
        <PlanUpgradeHint
          compact
          message="A cobrança online ainda não está disponível. Os limites do seu plano atual já estão ativos — em breve você poderá fazer upgrade diretamente por aqui."
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          variant="metricUsage"
          icon={<FolderOpen size={20} className="text-zinc-400" />}
          label="Projetos"
          value={String(usageStats.projects.current)}
          limitDisplay={getDashboardCountLimitDisplay(limits.maxProjects)}
          dataTestId="stat-projects"
        />
        <StatCard
          variant="metricUsage"
          icon={<Image size={20} className="text-zinc-400" />}
          label="Imagens"
          value={String(usageStats.images.current)}
          limitDisplay={getDashboardCountLimitDisplay(limits.maxTotalImages)}
          dataTestId="stat-images"
        />
        <StatCard
          variant="metric"
          icon={<Link2 size={20} className="text-zinc-400" />}
          label="Links compartilhados"
          value={String(projects.filter((p) => p.visibility !== 'private').length)}
          dataTestId="stat-links"
        />
        <StatCard
          variant="metricUsage"
          icon={<HardDrive size={20} className="text-zinc-400" />}
          label="Armazenamento"
          value={formatDashboardStorageCurrent(usage.storageBytes)}
          limitDisplay={getDashboardStorageLimitDisplay(limits.maxStorageBytes)}
          dataTestId="stat-storage"
        />
      </div>

      {showStarterLimitBanner && (
        <UpgradePrompt
          className="w-full mb-12"
          variant="warning"
          title="Limite do plano atingido"
          message="Você atingiu um dos limites do plano Starter. Faça upgrade para continuar criando projetos e enviando imagens."
          upgradeLabel="Fazer Upgrade"
          dataTestId="dashboard-limit-banner"
        />
      )}

      {/* Recent Images */}
      <div className="mb-12">
        <SectionHeader
          title="Imagens recentes"
          dataTestId="recent-images-title"
        />

        {recentImages.length === 0 ? (
          <div
            className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
            data-testid="dashboard-empty-images"
          >
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhuma imagem enviada
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Envie sua primeira imagem 360° para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                href={`/viewer/${image.id}`}
                variant="public"
                dataTestId={`dashboard-image-card-${image.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div>
        <SectionHeader
          title="Projetos recentes"
          dataTestId="recent-projects-title"
          actions={
            <Link
              to="/projects/new"
              data-testid="create-project-btn"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors"
            >
              <Plus size={20} />
              Criar projeto
            </Link>
          }
        />

        {recentProjects.length === 0 ? (
          <p className="text-zinc-400" data-testid="dashboard-empty-projects">
            Nenhum projeto ainda. Crie o primeiro para começar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/projects/${project.id}`}
                dataTestId={`project-card-${project.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
