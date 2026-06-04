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
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { toast } from '@/hooks/use-toast';
import { UpgradePrompt } from '@/components/plans/UpgradePrompt';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useProjects } from '@/hooks/useProjects';
import { deleteProject } from '@/services/projects/projectService';

export const Projects = () => {
  const { cardProjects, loading, error, refetch } = useProjects();
  const { canCreateProject, limits } = usePlanLimits();
  const [openMenu, setOpenMenu] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!projectToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteProject(projectToDelete.id);
      toast({
        title: 'Projeto excluído',
        description: `"${projectToDelete.name}" foi removido.`,
      });
      setProjectToDelete(null);
      setOpenMenu(null);
      await refetch();
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o projeto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
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
            variant="limit"
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

      {!error && cardProjects.length === 0 && (
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
      )}

      <AlertDialog open={Boolean(projectToDelete)} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. O projeto &quot;{projectToDelete?.name}&quot; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="confirm-delete-project-btn"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
