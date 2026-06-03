import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanUpgradeHint } from "@/components/plans/PlanUpgradeHint";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "@/hooks/use-toast";
import { updateProject } from "@/services/projects/projectService";
import { buildShareProjectUrl } from "@/utils/publicAccess";
import { showPlanLimitToast } from "@/utils/planToast";
import {
  getVisibilityOptionsForPlan,
  VISIBILITY_OPTIONS,
} from "@/utils/visibility";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   project: import("@/services/projects/projectService").Project | null,
 *   onVisibilitySaved?: () => void | Promise<void>,
 * }} props
 */
export function ShareProjectDialog({
  open,
  onOpenChange,
  project,
  onVisibilitySaved,
}) {
  const { publicVisibilityEnabled } = usePlanLimits();
  const [visibility, setVisibility] = useState("private");
  const [isSaving, setIsSaving] = useState(false);
  const visibilityOptions = getVisibilityOptionsForPlan(publicVisibilityEnabled);

  useEffect(() => {
    if (project && open) {
      setVisibility(project.visibility ?? "private");
    }
  }, [project, open]);

  if (!project) {
    return null;
  }

  const shareUrl = buildShareProjectUrl(project.id);
  const selectedOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "O link de compartilhamento foi copiado.",
      });
    } catch {
      toast({
        title: "Link de compartilhamento",
        description: shareUrl,
      });
    }
  };

  const handleSaveVisibility = async () => {
    if (visibility === project.visibility) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProject(project.id, { visibility });
      await onVisibilitySaved?.();
      toast({
        title: "Visibilidade atualizada",
        description: selectedOption?.description ?? "",
      });
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível atualizar a visibilidade.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md"
        data-testid="share-project-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-white font-medium tracking-tight">
            Compartilhar projeto
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Defina quem pode ver &quot;{project.title}&quot; e copie o link
            público.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Visibilidade</p>
            {!publicVisibilityEnabled && (
              <div className="mb-3">
                <PlanUpgradeHint
                  compact
                  message="A opção Público (portfólio) está disponível no plano Professional."
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                    visibility === option.value
                      ? "bg-white text-black border-white"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="share-visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={() => {
                      setVisibility(option.value);
                    }}
                    className="sr-only"
                    data-testid={`share-visibility-${option.value}`}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span
                    className={`text-xs mt-0.5 ${
                      visibility === option.value
                        ? "text-zinc-600"
                        : "text-zinc-500"
                    }`}
                  >
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
            {visibility !== project.visibility && (
              <button
                type="button"
                onClick={handleSaveVisibility}
                disabled={isSaving}
                data-testid="share-save-visibility"
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Salvar visibilidade
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">Link do projeto</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                data-testid="share-project-url"
                className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                data-testid="share-copy-link"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors shrink-0"
              >
                <Copy size={16} />
                Copiar
              </button>
            </div>
            {visibility === "private" && (
              <p className="text-xs text-zinc-500 mt-2">
                Com visibilidade privada, o link não funcionará para visitantes.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
