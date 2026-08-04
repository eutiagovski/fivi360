import { Plus, Image, Link2, HardDrive, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanLimitButton } from '@/components/plans/PlanLimitButton';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { StatCard } from '@/components/common/StatCard';
import { ProjectCard } from '@/components/common/ProjectCard';
import { ImageCard } from '@/components/common/ImageCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { PlanUpgradeHint } from '@/components/plans/PlanUpgradeHint';
import { StarterPlanInfoBanner } from '@/components/plans/StarterPlanInfoBanner';
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
  const navigate = useNavigate();
  const { cardProjects, projects, loading } = useProjects();
  const { cardImages: recentImages, loading: imagesLoading } = useRecentImages(3);
  const {
    usageStats,
    limits,
    loading: planLoading,
    planId,
    usage,
    canCreateProject,
    canUploadImage,
  } = usePlanLimits();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const recentProjects = cardProjects.slice(0, 3);

  const openCreate = () => {
    if (!canCreateProject) {
      return;
    }
    setShowCreateDialog(true);
  };

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

      {/* {planId === PLAN_IDS.STARTER ? (
        <StarterPlanInfoBanner className="mb-12" />
      ) : (
        <div className="max-w-3xl mb-10">
          <PlanUpgradeHint
            compact
            message="A cobrança online ainda não está disponível. Os limites do seu plano atual já estão ativos — em breve você poderá fazer upgrade diretamente por aqui."
          />
        </div>
      )} */}

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
          title="Imagens Recentes"
          dataTestId="recent-images-title"
          actions={
            <PlanLimitButton
              disabled={!canUploadImage}
              onClick={() => navigate('/images')}
              dataTestId="dashboard-add-image-btn"
            >
              <Plus size={20} />
              Adicionar imagem
            </PlanLimitButton>
          }
        />

        {recentImages.length === 0 ? (
          <EmptyStateCard
            dataTestId="dashboard-empty-images"
            title="Nenhuma imagem enviada"
            description="Envie sua primeira imagem 360° para começar."
            actionLabel="Adicionar imagem"
            actionIcon={<Plus size={20} />}
            actionDisabled={!canUploadImage}
            onAction={() => navigate('/images')}
            actionDataTestId="dashboard-empty-add-image-btn"
          />
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
          title="Projetos Recentes"
          dataTestId="recent-projects-title"
          actions={
            <PlanLimitButton
              disabled={!canCreateProject}
              onClick={openCreate}
              dataTestId="create-project-btn"
            >
              <Plus size={20} />
              Criar projeto
            </PlanLimitButton>
          }
        />

        {recentProjects.length === 0 ? (
          <EmptyStateCard
            dataTestId="dashboard-empty-projects"
            title="Nenhum projeto criado"
            description="Crie seu primeiro projeto para organizar imagens 360° e compartilhar apresentações completas."
            actionLabel="Criar projeto"
            actionIcon={<Plus size={20} />}
            actionDisabled={!canCreateProject}
            onAction={openCreate}
            actionDataTestId="dashboard-empty-create-project-btn"
          />
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

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
