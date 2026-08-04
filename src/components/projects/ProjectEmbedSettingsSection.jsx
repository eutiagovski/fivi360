import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "@/hooks/use-toast";
import { updateProjectEmbedSettings } from "@/services/projects/projectService";
import { DEFAULT_EMBED_SETTINGS } from "@/services/projects/embedSettings";
import { showPlanLimitToast } from "@/utils/planToast";
import {
  buildEmbedProjectUrl,
  buildEmbedSnippet,
} from "@/utils/embed";

/**
 * Seção “Incorporar no website” dentro do compartilhamento do projeto.
 *
 * @param {{
 *   project: import("@/services/projects/projectService").Project,
 *   images?: import("@/services/images/imageService").Image[],
 *   onEmbedSaved?: () => void | Promise<void>,
 *   modalOpen?: boolean,
 * }} props
 */
export function ProjectEmbedSettingsSection({
  project,
  images = [],
  onEmbedSaved,
  modalOpen = true,
}) {
  const { user } = useAuth();
  const { projectEmbedEnabled, loading: planLoading } = usePlanLimits();
  const [settings, setSettings] = useState(
    () => project.embedSettings ?? { ...DEFAULT_EMBED_SETTINGS },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(
    /** @type {'idle' | 'saving' | 'saved' | 'error'} */ ("idle"),
  );
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStatus, setPreviewStatus] = useState(
    /** @type {'idle' | 'loading' | 'loaded' | 'error' | 'refreshing'} */ (
      "idle"
    ),
  );
  const [previewNonce, setPreviewNonce] = useState(0);
  const snippetRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const savedFeedbackTimer = useRef(/** @type {number | null} */ (null));
  const previewInitialImageIdRef = useRef(
    project.embedSettings?.initialImageId ?? null,
  );
  const previewRefreshTimer = useRef(/** @type {number | null} */ (null));

  useEffect(() => {
    const next = project.embedSettings ?? { ...DEFAULT_EMBED_SETTINGS };
    setSettings((current) => {
      if (
        current.enabled === next.enabled &&
        current.initialImageId === next.initialImageId &&
        current.allowFullscreen === next.allowFullscreen &&
        current.allowNavigation === next.allowNavigation
      ) {
        return current;
      }
      return next;
    });
  }, [project]);

  useEffect(() => {
    if (!settings.enabled || !modalOpen) {
      setShowPreview(false);
      setPreviewStatus("idle");
    }
  }, [settings.enabled, modalOpen]);

  // Ambiente inicial: debounce de um único reload da prévia (Option B).
  // Fullscreen / navegação NÃO alteram src/key — iframe permanece montado.
  useEffect(() => {
    if (!showPreview || !settings.enabled) {
      previewInitialImageIdRef.current = settings.initialImageId ?? null;
      return undefined;
    }

    const nextInitialId = settings.initialImageId ?? null;
    if (nextInitialId === previewInitialImageIdRef.current) {
      return undefined;
    }

    previewInitialImageIdRef.current = nextInitialId;

    if (previewRefreshTimer.current != null) {
      window.clearTimeout(previewRefreshTimer.current);
    }

    setPreviewStatus("refreshing");
    previewRefreshTimer.current = window.setTimeout(() => {
      setPreviewNonce((value) => value + 1);
    }, 600);

    return () => {
      if (previewRefreshTimer.current != null) {
        window.clearTimeout(previewRefreshTimer.current);
        previewRefreshTimer.current = null;
      }
    };
  }, [settings.initialImageId, settings.enabled, showPreview]);

  useEffect(() => {
    return () => {
      if (savedFeedbackTimer.current != null) {
        window.clearTimeout(savedFeedbackTimer.current);
      }
      if (previewRefreshTimer.current != null) {
        window.clearTimeout(previewRefreshTimer.current);
      }
    };
  }, []);

  const validImages = useMemo(
    () =>
      images.filter(
        (image) => image?.id && (image.originalUrl || image.previewUrl),
      ),
    [images],
  );

  const previewUrl = useMemo(
    () => buildEmbedProjectUrl(project.id),
    [project.id],
  );
  const snippet = useMemo(
    () =>
      buildEmbedSnippet(project.id, {
        projectName: project.title,
      }),
    [project.id, project.title],
  );
  const canShowPreview = Boolean(previewUrl && settings.enabled);
  const iframeKey = previewUrl ? `${previewUrl}::${previewNonce}` : "";

  const openPreview = () => {
    if (!previewUrl) {
      return;
    }
    previewInitialImageIdRef.current = settings.initialImageId ?? null;
    setShowPreview(true);
    setPreviewStatus("loading");
  };

  const hidePreview = () => {
    setShowPreview(false);
    setPreviewStatus("idle");
  };

  const retryPreview = () => {
    if (!previewUrl) {
      return;
    }
    setPreviewStatus("loading");
    setPreviewNonce((value) => value + 1);
  };
  const markSaved = () => {
    setSaveStatus("saved");
    if (savedFeedbackTimer.current != null) {
      window.clearTimeout(savedFeedbackTimer.current);
    }
    savedFeedbackTimer.current = window.setTimeout(() => {
      setSaveStatus("idle");
    }, 2000);
  };

  const persist = async (patch) => {
    if (!user?.uid || !projectEmbedEnabled) {
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

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
        setSaveStatus("idle");
      } else {
        markSaved();
      }
    } catch (error) {
      setSaveStatus("error");
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
      const field = snippetRef.current;
      if (field) {
        field.focus();
        field.select();
      }
      toast({
        title: "Copie o código manualmente",
        description:
          "Não foi possível usar a área de transferência. Selecione o código e copie com Ctrl+C.",
      });
    }
  };

  return (
    <div className="space-y-4" data-testid="embed-settings-section">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">
              Incorporar no website
            </h3>
            <Badge
              variant="outline"
              className="rounded-md border-zinc-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300"
              data-testid="embed-professional-badge"
            >
              Professional+
            </Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            Incorpore este projeto diretamente no website do seu escritório. Os
            visitantes poderão explorar os ambientes sem sair da página.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Permite adicionar a visualização do projeto dentro de um website
            existente.
          </p>
        </div>
      </div>

      {planLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={16} className="animate-spin" />
          Carregando plano...
        </div>
      ) : !projectEmbedEnabled ? (
        <div
          className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4"
          data-testid="embed-plan-locked"
        >
          <p className="text-sm font-medium text-amber-50">
            Adicione a visualização 360° ao website do seu escritório.
          </p>
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
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            data-testid="embed-upgrade-cta"
          >
            Conhecer o Professional
          </Link>
        </div>
      ) : (
        <>
          <div
            className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4"
            data-testid="embed-activation-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="embed-enabled"
                  className="text-sm font-medium text-white"
                >
                  Ativar incorporação
                </label>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Gere um código para exibir este projeto em websites externos.
                </p>
              </div>
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
                className="mt-0.5"
              />
            </div>

            {!settings.enabled ? (
              <p className="mt-3 text-xs text-zinc-500">
                Ative a incorporação para configurar a visualização e gerar o
                código HTML.
              </p>
            ) : null}
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
              settings.enabled
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
            aria-hidden={!settings.enabled}
          >
            <div className="min-h-0 overflow-hidden">
              {settings.enabled ? (
                <div className="space-y-4 pt-0">
                  <div
                    className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-800/30 p-4"
                    data-testid="embed-settings-card"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        Configurações da visualização
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        Defina como a experiência aparece no website.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="embed-initial-image"
                        className="mb-1.5 block text-sm text-zinc-200"
                      >
                        Ambiente inicial
                      </label>
                      <p className="mb-2 text-xs text-zinc-500">
                        Escolha o primeiro ambiente exibido ao carregar a
                        visualização.
                      </p>
                      <select
                        id="embed-initial-image"
                        data-testid="embed-initial-image"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
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

                    <div className="space-y-3 border-t border-zinc-800 pt-3">
                      <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
                        <Checkbox
                          checked={settings.allowFullscreen !== false}
                          disabled={isSaving}
                          onCheckedChange={(checked) => {
                            void persist({ allowFullscreen: checked === true });
                          }}
                          data-testid="embed-allow-fullscreen"
                          aria-label="Permitir visualização em tela cheia"
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block text-zinc-200">
                            Permitir visualização em tela cheia
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            O visitante poderá expandir a experiência para
                            ocupar toda a tela.
                          </span>
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
                        <Checkbox
                          checked={settings.allowNavigation !== false}
                          disabled={isSaving}
                          onCheckedChange={(checked) => {
                            void persist({ allowNavigation: checked === true });
                          }}
                          data-testid="embed-allow-navigation"
                          aria-label="Permitir navegação entre ambientes"
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block text-zinc-200">
                            Permitir navegação entre ambientes
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            O visitante poderá acessar outros ambientes
                            disponíveis no projeto.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div
                    className="flex gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-3 py-3"
                    data-testid="embed-access-notice"
                    role="note"
                  >
                    <Info
                      size={16}
                      className="mt-0.5 shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Qualquer pessoa com acesso ao código ou ao link de
                      incorporação poderá visualizar o projeto.
                    </p>
                  </div>

                  <div
                    className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-800/30 p-4"
                    data-testid="embed-preview-section"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white">
                          Prévia
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          Veja como a visualização será exibida no website.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (showPreview) {
                              hidePreview();
                            } else {
                              openPreview();
                            }
                          }}
                          disabled={!canShowPreview && !showPreview}
                          data-testid="embed-toggle-preview"
                          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showPreview ? "Ocultar prévia" : "Abrir prévia"}
                        </button>
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="embed-open-preview"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700"
                          >
                            <ExternalLink size={14} aria-hidden="true" />
                            Abrir em nova aba
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {showPreview && previewUrl ? (
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950"
                        style={{ aspectRatio: "16 / 9" }}
                        data-testid="embed-preview"
                        data-preview-url={previewUrl}
                        data-preview-key={iframeKey}
                      >
                        {previewStatus === "loading" ? (
                          <div
                            className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-zinc-950/80 text-sm text-zinc-400"
                            data-testid="embed-preview-loading"
                          >
                            <Loader2 size={16} className="animate-spin" />
                            Carregando prévia...
                          </div>
                        ) : null}
                        {previewStatus === "refreshing" ? (
                          <div
                            className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300"
                            data-testid="embed-preview-refreshing"
                          >
                            <Loader2 size={12} className="animate-spin" />
                            Atualizando prévia…
                          </div>
                        ) : null}
                        {previewStatus === "error" ? (
                          <div
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center"
                            data-testid="embed-preview-error"
                          >
                            <p className="text-sm text-zinc-300">
                              Não foi possível carregar a prévia.
                            </p>
                            <button
                              type="button"
                              onClick={retryPreview}
                              data-testid="embed-preview-retry"
                              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        ) : null}
                        <iframe
                          key={iframeKey}
                          src={previewUrl}
                          title={`Prévia da visualização 360° — ${project.title || "projeto"}`}
                          className="absolute inset-0 h-full w-full border-0"
                          allow="fullscreen"
                          allowFullScreen
                          data-testid="embed-preview-iframe"
                          onLoad={() => setPreviewStatus("loaded")}
                          onError={() => setPreviewStatus("error")}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/80 px-4 text-center"
                        data-testid="embed-preview-placeholder"
                      >
                        <p className="text-xs text-zinc-500">
                          {!previewUrl
                            ? "URL de prévia indisponível para este projeto."
                            : "A prévia carrega sob demanda para manter o modal leve."}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="space-y-3 rounded-xl border border-zinc-600/80 bg-zinc-900/80 p-4"
                    data-testid="embed-code-section"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        Código de incorporação
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        Copie e cole este código na área desejada do seu
                        website.
                      </p>
                    </div>
                    <textarea
                      ref={snippetRef}
                      readOnly
                      value={snippet}
                      data-testid="embed-snippet"
                      aria-label="Código HTML de incorporação"
                      rows={6}
                      className="max-h-40 w-full resize-none overflow-auto whitespace-pre rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      onFocus={(event) => event.target.select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      data-testid="embed-copy-code"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 sm:w-auto"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Código copiado" : "Copiar código"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {saveStatus === "saving" || isSaving ? (
            <p
              className="flex items-center gap-2 text-xs text-zinc-500"
              data-testid="embed-save-status"
              aria-live="polite"
            >
              <Loader2 size={14} className="animate-spin" />
              Salvando...
            </p>
          ) : saveStatus === "saved" ? (
            <p
              className="text-xs text-zinc-500"
              data-testid="embed-save-status"
              aria-live="polite"
            >
              Alterações salvas.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
