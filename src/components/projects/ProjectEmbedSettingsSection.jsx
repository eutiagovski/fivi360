import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "@/hooks/use-toast";
import { updateProjectEmbedSettings } from "@/services/projects/projectService";
import { DEFAULT_EMBED_SETTINGS } from "@/services/projects/embedSettings";
import { showPlanLimitToast } from "@/utils/planToast";
import {
  buildEmbedProjectUrl,
  buildEmbedSnippet,
} from "@/utils/embed";
import { useAuth } from "@/hooks/useAuth";

/**
 * Seção “Incorporar no website” dentro do compartilhamento do projeto.
 *
 * @param {{
 *   project: import("@/services/projects/projectService").Project,
 *   images?: import("@/services/images/imageService").Image[],
 *   onEmbedSaved?: () => void | Promise<void>,
 * }} props
 */
export function ProjectEmbedSettingsSection({
  project,
  images = [],
  onEmbedSaved,
}) {
  const { user } = useAuth();
  const { projectEmbedEnabled, loading: planLoading } = usePlanLimits();
  const [settings, setSettings] = useState(
    () => project.embedSettings ?? { ...DEFAULT_EMBED_SETTINGS },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setSettings(project.embedSettings ?? { ...DEFAULT_EMBED_SETTINGS });
  }, [project]);

  const validImages = useMemo(
    () =>
      images.filter(
        (image) => image?.id && (image.originalUrl || image.previewUrl),
      ),
    [images],
  );

  const embedUrl = buildEmbedProjectUrl(project.id);
  const snippet = buildEmbedSnippet(project.id, {
    projectName: project.title,
  });

  const persist = async (patch) => {
    if (!user?.uid || !projectEmbedEnabled) {
      return;
    }

    setIsSaving(true);

    try {
      const next = await updateProjectEmbedSettings(
        project.id,
        user.uid,
        patch,
      );
      setSettings(next);
      await onEmbedSaved?.();

      if (patch.enabled === false) {
        toast({
          title: "Incorporação desativada",
          description:
            "A incorporação foi desativada. Os websites que utilizam este código deixarão de exibir o projeto.",
        });
      }
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        toast({
          title: "Erro ao salvar",
          description:
            error?.message ||
            "Não foi possível atualizar a incorporação.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast({
        title: "Código de incorporação copiado.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copie o código manualmente",
        description:
          "Não foi possível usar a área de transferência. Selecione o código e copie com Ctrl+C.",
      });
    }
  };

  return (
    <div
      className="space-y-4 border-t border-zinc-800 pt-5"
      data-testid="embed-settings-section"
    >
      <div>
        <h3 className="text-sm font-medium text-white">
          Incorporar no website
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Permite adicionar a visualização do projeto dentro de um website
          existente.
        </p>
      </div>

      {planLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={16} className="animate-spin" />
          Carregando plano...
        </div>
      ) : !projectEmbedEnabled ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 space-y-2"
          data-testid="embed-plan-locked"
        >
          {settings.enabled ? (
            <p className="text-sm text-amber-100/90">
              Seu código de incorporação está temporariamente indisponível. Este
              recurso está disponível a partir do plano Professional.
            </p>
          ) : (
            <p className="text-sm text-amber-100/90">
              Disponível a partir do plano Professional.
            </p>
          )}
          <Link
            to="/plan"
            className="inline-block text-sm font-medium text-white underline-offset-4 hover:underline"
            data-testid="embed-upgrade-cta"
          >
            Conhecer o Professional
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="embed-enabled"
              className="text-sm text-zinc-200"
            >
              Ativar incorporação
            </label>
            <Switch
              id="embed-enabled"
              checked={settings.enabled === true}
              disabled={isSaving}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                const patch = { enabled };
                if (
                  enabled &&
                  !settings.initialImageId &&
                  validImages[0]?.id
                ) {
                  patch.initialImageId = validImages[0].id;
                }
                void persist(patch);
              }}
              data-testid="embed-enabled-switch"
              aria-label="Ativar incorporação"
            />
          </div>

          {!settings.enabled ? (
            <p className="text-xs text-zinc-500">
              Ative a incorporação para gerar um código que poderá ser
              adicionado ao website do seu escritório.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="embed-initial-image"
                  className="text-xs text-zinc-500 mb-2 block"
                >
                  Imagem inicial
                </label>
                <select
                  id="embed-initial-image"
                  data-testid="embed-initial-image"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  value={settings.initialImageId ?? ""}
                  disabled={isSaving || validImages.length === 0}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    void persist({ initialImageId: value });
                  }}
                >
                  {validImages.length === 0 ? (
                    <option value="">Nenhuma imagem disponível</option>
                  ) : (
                    validImages.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.title || "Sem título"}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                <Checkbox
                  checked={settings.allowFullscreen !== false}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    void persist({ allowFullscreen: checked === true });
                  }}
                  data-testid="embed-allow-fullscreen"
                  aria-label="Permitir visualização em tela cheia"
                />
                Permitir visualização em tela cheia
              </label>

              <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                <Checkbox
                  checked={settings.allowNavigation !== false}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    void persist({ allowNavigation: checked === true });
                  }}
                  data-testid="embed-allow-navigation"
                  aria-label="Permitir navegação entre ambientes"
                />
                Permitir navegação entre ambientes
              </label>

              <p className="text-xs text-zinc-500">
                Qualquer pessoa com acesso ao código ou ao link de
                incorporação poderá visualizar o projeto.
              </p>

              <div>
                <p className="text-xs text-zinc-500 mb-2">
                  Copie e cole este código na área desejada do seu website.
                </p>
                <textarea
                  readOnly
                  value={snippet}
                  data-testid="embed-snippet"
                  className="w-full min-h-[120px] px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-300 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  onFocus={(event) => event.target.select()}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    data-testid="embed-copy-code"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Código copiado" : "Copiar código"}
                  </button>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="embed-open-preview"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Abrir visualização
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowPreview((value) => !value)}
                    data-testid="embed-toggle-preview"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors"
                  >
                    {showPreview ? "Ocultar preview" : "Mostrar preview"}
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900"
                  style={{ aspectRatio: "16 / 9" }}
                  data-testid="embed-preview"
                >
                  <iframe
                    src={embedUrl}
                    title={`Preview — ${project.title || "projeto"}`}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    allow="fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          )}

          {isSaving ? (
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Salvando...
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
