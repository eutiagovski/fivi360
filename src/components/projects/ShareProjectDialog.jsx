import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { PlanUpgradeHint } from "@/components/plans/PlanUpgradeHint";
import { ProjectEmbedSettingsSection } from "@/components/projects/ProjectEmbedSettingsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "@/hooks/use-toast";
import {
  toShareVisibilityParam,
  trackEvent,
} from "@/services/analytics/analyticsService";
import { updateProject } from "@/services/projects/projectService";
import { buildShareProjectUrl } from "@/utils/publicAccess";
import { showPlanLimitToast } from "@/utils/planToast";
import {
  getVisibilityOptionsForPlan,
  VISIBILITY_OPTIONS,
} from "@/utils/visibility";

const SHARE_TAB = "share-link";
const EMBED_TAB = "embed";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   project: import("@/services/projects/projectService").Project | null,
 *   images?: import("@/services/images/imageService").Image[],
 *   onVisibilitySaved?: () => void | Promise<void>,
 * }} props
 */
export function ShareProjectDialog({
  open,
  onOpenChange,
  project,
  images = [],
  onVisibilitySaved,
}) {
  const { publicVisibilityEnabled } = usePlanLimits();
  const [visibility, setVisibility] = useState("private");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(SHARE_TAB);
  const visibilityOptions = getVisibilityOptionsForPlan(publicVisibilityEnabled);

  useEffect(() => {
    if (project && open) {
      setVisibility(project.visibility ?? "private");
    }
  }, [project, open]);

  useEffect(() => {
    if (open) {
      setActiveTab(SHARE_TAB);
    }
  }, [open]);

  if (!project) {
    return null;
  }

  const shareUrl = buildShareProjectUrl(project.id);
  const selectedOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility);

  const trackShareProject = () => {
    trackEvent("share_project", {
      visibility: toShareVisibilityParam(visibility),
    });
  };

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

    trackShareProject();
  };

  const handleSaveVisibility = async () => {
    if (visibility === project.visibility) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProject(project.id, { visibility });
      await onVisibilitySaved?.();

      trackShareProject();

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
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Compartilhar projeto"
      description={`Compartilhe “${project.title}” por link ou incorpore a visualização no website do seu escritório.`}
      size="xl"
      testId="share-project-dialog"
      bodyClassName="min-w-0 max-h-[min(70vh,85dvh)] overflow-y-auto space-y-0"
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full min-w-0"
        data-testid="share-project-tabs"
      >
        <TabsList
          className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-zinc-800/80 p-1"
          aria-label="Opções de compartilhamento"
        >
          <TabsTrigger
            value={SHARE_TAB}
            data-testid="share-tab-link"
            className="rounded-lg px-2 py-2 text-xs text-zinc-400 sm:text-sm data-[state=active]:bg-zinc-950 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Compartilhar por link
          </TabsTrigger>
          <TabsTrigger
            value={EMBED_TAB}
            data-testid="share-tab-embed"
            className="rounded-lg px-2 py-2 text-xs text-zinc-400 sm:text-sm data-[state=active]:bg-zinc-950 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Incorporar no website
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value={SHARE_TAB}
          forceMount
          className="mt-4 space-y-5 data-[state=inactive]:hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="share-tab-link-panel"
        >
          <div>
            <h3 className="text-sm font-medium text-white">
              Quem pode visualizar?
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Defina o nível de acesso ao link do projeto.
            </p>
            {!publicVisibilityEnabled && (
              <div className="mt-3">
                <PlanUpgradeHint
                  compact
                  message="A opção Público (portfólio) está disponível nos planos Professional e Studio."
                />
              </div>
            )}
            <div
              className="mt-3 grid grid-cols-1 gap-2"
              role="radiogroup"
              aria-label="Visibilidade do projeto"
            >
              {visibilityOptions.map((option) => {
                const selected = visibility === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-white/30 ${
                      selected
                        ? "border-white bg-white text-black"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-black"
                          : "border-zinc-500"
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          selected ? "bg-black" : "bg-transparent"
                        }`}
                      />
                    </span>
                    <input
                      type="radio"
                      name="share-visibility"
                      value={option.value}
                      checked={selected}
                      onChange={() => {
                        setVisibility(option.value);
                      }}
                      className="sr-only"
                      data-testid={`share-visibility-${option.value}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">
                        {option.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs leading-snug ${
                          selected ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {visibility !== project.visibility && (
              <button
                type="button"
                onClick={handleSaveVisibility}
                disabled={isSaving}
                data-testid="share-save-visibility"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Salvar visibilidade
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white">Link do projeto</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Compartilhe este link com seus clientes e parceiros.
            </p>
            <div className="mt-3 flex min-w-0 gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                data-testid="share-project-url"
                aria-label="Link do projeto"
                className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                data-testid="share-copy-link"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
              >
                <Copy size={16} />
                Copiar link
              </button>
            </div>
            {visibility === "private" && (
              <p className="mt-2 text-xs text-zinc-500">
                Com visibilidade privada, o link não funcionará para visitantes.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value={EMBED_TAB}
          forceMount
          className="mt-4 data-[state=inactive]:hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="share-tab-embed-panel"
        >
          <ProjectEmbedSettingsSection
            project={project}
            images={images}
            onEmbedSaved={onVisibilitySaved}
            modalOpen={open}
          />
        </TabsContent>
      </Tabs>
    </AppModal>
  );
}
