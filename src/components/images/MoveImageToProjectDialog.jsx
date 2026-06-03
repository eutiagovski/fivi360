import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { moveImageToProject } from "@/services/images/imageService";
import { getProjectsByUserId } from "@/services/projects/projectService";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   image: import("@/services/images/imageService").Image | null,
 *   userId: string | undefined,
 *   onMoveComplete?: (result: {
 *     image: import("@/services/images/imageService").Image,
 *     coverImage: string | null,
 *     projectTitle: string,
 *   }) => void | Promise<void>,
 * }} props
 */
export function MoveImageToProjectDialog({
  open,
  onOpenChange,
  image,
  userId,
  onMoveComplete,
}) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let cancelled = false;

    setLoadingProjects(true);
    setSelectedProjectId(null);

    getProjectsByUserId(userId)
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
          toast({
            title: "Erro ao carregar projetos",
            description: "Não foi possível listar seus projetos.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!image) {
    return null;
  }

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );

  const handleOpenChange = (open) => {
    if (isMoving && !open) {
      return;
    }
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    if (!userId || !selectedProjectId) {
      return;
    }

    setIsMoving(true);

    try {
      const result = await moveImageToProject(
        userId,
        image.id,
        selectedProjectId,
      );

      await onMoveComplete?.({
        ...result,
        projectTitle: selectedProject?.title || "Projeto",
      });

      toast({
        title: "Imagem adicionada ao projeto",
        description: `"${image.title}" foi movida para "${selectedProject?.title || "projeto"}".`,
      });

      onOpenChange(false);
    } catch {
      toast({
        title: "Erro ao mover imagem",
        description: "Não foi possível adicionar a imagem ao projeto.",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md"
        data-testid="move-image-to-project-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-white font-medium tracking-tight">
            Adicionar a projeto
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecione o projeto para receber &quot;
            {image.title || "Sem título"}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
            </div>
          ) : projects.length === 0 ? (
            <p
              className="text-sm text-zinc-400 text-center py-6"
              data-testid="move-image-no-projects"
            >
              Você ainda não possui projetos disponíveis.
            </p>
          ) : (
            <div
              className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto"
              data-testid="move-image-project-list"
            >
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedProjectId === project.id
                      ? "bg-white text-black border-white"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="move-image-project"
                    value={project.id}
                    checked={selectedProjectId === project.id}
                    onChange={() => setSelectedProjectId(project.id)}
                    className="sr-only"
                    data-testid={`move-image-project-${project.id}`}
                  />
                  <span className="text-sm font-medium">
                    {project.title || "Sem título"}
                  </span>
                  {project.clientName && (
                    <span
                      className={`text-xs mt-0.5 ${
                        selectedProjectId === project.id
                          ? "text-zinc-600"
                          : "text-zinc-500"
                      }`}
                    >
                      Cliente: {project.clientName}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isMoving || !selectedProjectId || projects.length === 0}
            data-testid="move-image-confirm-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isMoving ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
