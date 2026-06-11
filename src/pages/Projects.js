import { Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { PageActionHeader } from '@/components/common/PageActionHeader';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { ProjectCard } from '@/components/common/ProjectCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  APP_MODAL_FOOTER_CLASSES,
  appAlertContentClassName,
} from '@/components/common/AppModal';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { toast } from '@/hooks/use-toast';
import { UpgradePrompt } from '@/components/plans/UpgradePrompt';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useProjectsPage } from '@/hooks/useProjectsPage';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { deleteProjectCascade } from '@/services/projects/projectService';
import { emitProjectDeleted } from '@/utils/dataSyncEvents';

export const Projects = () => {
  const { user } = useAuth();
  const {
    cardProjects,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
    removeProject,
  } = useProjectsPage();
  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loadingMore,
    onLoadMore: loadMore,
  });
  const { canCreateProject, limits, applyUsageDelta, refreshUsage } = usePlanLimits();
  const [openMenu, setOpenMenu] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!projectToDelete || !user?.uid) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProjectCascade(projectToDelete.id, user.uid);

      emitProjectDeleted({
        projectId: projectToDelete.id,
        imageIds: result.imageIds,
      });

      removeProject(projectToDelete.id);

      applyUsageDelta({
        projectCount: -1,
        imageCount: -result.deletedImageCount,
        storageBytes: -result.deletedStorageBytes,
      });
      void refreshUsage();

      toast({
        title: 'Projeto excluído',
        description: `"${projectToDelete.name}" e todo o seu conteúdo foram removidos.`,
      });
      setProjectToDelete(null);
      setOpenMenu(null);
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível excluir o projeto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadingInitial) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageActionHeader
        title="Projetos"
        subtitle="Gerencie seus projetos e imagens"
        actionLabel="Criar projeto"
        actionIcon={<Plus size={20} />}
        actionHref="/projects/new"
        actionDisabled={!canCreateProject}
        dataTestId="projects-title"
        actionDataTestId="create-project-btn"
      />

      {!canCreateProject && (
        <div className="mb-6">
          <UpgradePrompt
            variant="warning"
            message={`Você atingiu o limite de projetos do plano ${limits.displayName}.`}
            secondaryMessage="Faça upgrade para criar projetos ilimitados."
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 mb-6" data-testid="projects-error">
          Não foi possível carregar os projetos. Tente recarregar a página.
        </p>
      )}

      {!error && cardProjects.length === 0 && !loadingInitial && (
        <EmptyStateCard
          dataTestId="projects-empty"
          title="Nenhum projeto criado"
          description="Crie seu primeiro projeto para organizar imagens 360° e compartilhar apresentações completas."
          actionLabel="Criar projeto"
          actionIcon={<Plus size={20} />}
          actionHref="/projects/new"
          actionDisabled={!canCreateProject}
          actionDataTestId="projects-empty-create-btn"
        />
      )}

      {cardProjects.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/projects/${project.id}`}
                showMenu
                isMenuOpen={openMenu === project.id}
                onMenuToggle={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                onDelete={() => setProjectToDelete(project)}
                dataTestId={`project-card-${project.id}`}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {loadingMore && (
            <div
              className="flex items-center justify-center py-8"
              data-testid="projects-loading-more"
            >
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          )}

          {/* {!hasMore && !loadingMore && (
            <p
              className="text-center text-sm text-zinc-500 py-8"
              data-testid="projects-all-loaded"
            >
              Todos os itens foram carregados.
            </p>
          )} */}
        </>
      )}

      <AlertDialog open={Boolean(projectToDelete)} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className={appAlertContentClassName('lg')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 break-words">
              Esta ação removerá permanentemente o projeto, suas imagens, hotspots e arquivos
              armazenados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={APP_MODAL_FOOTER_CLASSES}>
            <AlertDialogCancel className="mt-0 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="confirm-delete-project-btn"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Excluir permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
