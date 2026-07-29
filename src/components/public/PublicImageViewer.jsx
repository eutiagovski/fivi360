import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import { ViewerPageHeader } from "@/components/viewer/ViewerPageHeader";
import { ViewerNavControls } from "@/components/viewer/ViewerNavControls";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { usePageSeo } from "@/hooks/usePageSeo";
import { usePublicViewerImage } from "@/hooks/usePublicViewerImage";
import { useHotspots } from "@/hooks/useHotspots";
import { useToast } from "@/hooks/use-toast";
import {
  buildImageDescription,
  buildImageTitle,
} from "@/utils/publicSeo";
import { trackEvent } from "@/services/analytics/analyticsService";
import { recordPublic360View } from "@/services/stats/publicViewTracking";
import { HOTSPOT_TYPE_SCENE } from "@/services/hotspots/hotspotService";
import { createSceneHotspotClickHandler } from "@/utils/sceneHotspotNavigation";
import {
  SCENE_HOTSPOT_CONTEXT,
  SCENE_HOTSPOT_UNAVAILABLE_SHORT,
  buildAvailableSceneTargetMap,
  filterNavigableHotspots,
  resolveSceneHotspotTarget,
} from "@/utils/sceneHotspotTarget";

/**
 * Mapeia accessMode do viewer público para o contexto de validação de scene.
 * @param {string} accessMode
 * @returns {string}
 */
function resolvePublicSceneContext(accessMode) {
  if (accessMode === "portfolio") {
    return SCENE_HOTSPOT_CONTEXT.PUBLIC_PORTFOLIO_VIEWER;
  }
  if (accessMode === "standalone") {
    return SCENE_HOTSPOT_CONTEXT.PUBLIC_STANDALONE_VIEWER;
  }
  return SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER;
}

const ERROR_MESSAGES = {
  not_found: "Imagem não encontrada.",
  unavailable: "Esta imagem não está disponível.",
  load_failed: "Não foi possível carregar o panorama.",
};

/**
 * @param {{
 *   imageId: string | undefined,
 *   accessMode: import("@/hooks/usePublicViewerImage").PublicViewerAccessMode | 'shared-project' | 'standalone' | 'portfolio',
 *   expectedProjectId?: string,
 *   portfolioSlug?: string,
 *   backHref?: string,
 *   backLabel?: string,
 *   imageNavBasePath?: string,
 *   buildImagePath?: (targetImageId: string) => string,
 *   subtitle?: string,
 * }} props
 */
export function PublicImageViewer({
  imageId,
  accessMode,
  expectedProjectId,
  portfolioSlug,
  backHref,
  backLabel = "Voltar ao projeto",
  imageNavBasePath,
  buildImagePath,
  subtitle,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    image,
    project,
    owner,
    projectImages,
    previousImage,
    nextImage,
    isProjectContext,
    loading,
    error,
  } = usePublicViewerImage(imageId, {
    accessMode,
    expectedProjectId,
    portfolioSlug,
  });
  const { hotspots } = useHotspots(imageId);

  const [infoHotspot, setInfoHotspot] = useState(null);
  const sceneNavTransitionLockedRef = useRef(false);

  const viewSource = accessMode === "portfolio" ? "public" : "shared";
  const sceneContext = resolvePublicSceneContext(accessMode);

  const imagesLoadState = loading
    ? "loading"
    : error === "load_failed"
      ? "failed"
      : "loaded";

  const availableImagesById = useMemo(
    () => buildAvailableSceneTargetMap(projectImages),
    [projectImages],
  );

  useEffect(() => {
    sceneNavTransitionLockedRef.current = false;
  }, [imageId]);

  const portfolioSeo = useMemo(() => {
    if (accessMode !== "portfolio" || loading || error || !image) {
      return { title: "", description: "", enabled: false };
    }

    return {
      title: buildImageTitle(image, owner),
      description: buildImageDescription(image, owner),
      enabled: true,
    };
  }, [accessMode, loading, error, image, owner]);

  usePageSeo(portfolioSeo);

  useEffect(() => {
    if (!loading && !error && image) {
      trackEvent("view_360_image", { source: viewSource });

      if (accessMode === "portfolio" && imageId) {
        const ownerUserId = project?.userId ?? image?.userId;
        if (ownerUserId) {
          recordPublic360View(ownerUserId, imageId);
        }
      }
    }
  }, [imageId, loading, error, image, viewSource, accessMode]);

  const panoramaUrl = image?.originalUrl || image?.previewUrl || "";
  const resolvedSubtitle =
    subtitle ??
    (isProjectContext ? project?.title || "Projeto" : "Imagem compartilhada");

  const sceneResolveOptions = useMemo(
    () => ({
      availableImagesById,
      context: sceneContext,
      sourceImageId: image?.id ?? imageId,
      expectedProjectId: image?.projectId ?? expectedProjectId ?? null,
      imagesLoadState,
      sceneNavigationEnabled: isProjectContext,
    }),
    [
      availableImagesById,
      expectedProjectId,
      image?.id,
      image?.projectId,
      imageId,
      imagesLoadState,
      isProjectContext,
      sceneContext,
    ],
  );

  // Público: oculta scene órfãos (mais seguro visualmente). Info permanece.
  // Standalone: remove todos os scene (sem conjunto navegável).
  const visibleHotspots = useMemo(() => {
    if (!isProjectContext) {
      return hotspots.filter((hotspot) => hotspot.type !== HOTSPOT_TYPE_SCENE);
    }

    return filterNavigableHotspots(hotspots, sceneResolveOptions);
  }, [hotspots, isProjectContext, sceneResolveOptions]);

  const getSceneHotspotLabel = useCallback(
    (hotspot) => {
      const resolution = resolveSceneHotspotTarget({
        ...sceneResolveOptions,
        hotspot,
      });

      if (resolution.available && resolution.targetImage?.title) {
        return `Ir para ${resolution.targetImage.title}`;
      }

      return "Ir para";
    },
    [sceneResolveOptions],
  );

  const resolveImagePath = useCallback(
    (targetImageId) => {
      if (buildImagePath) {
        return buildImagePath(targetImageId);
      }

      if (imageNavBasePath) {
        return `${imageNavBasePath}/${targetImageId}`;
      }

      return `/share/standalone/${targetImageId}`;
    },
    [buildImagePath, imageNavBasePath],
  );

  const handleSceneHotspotClick = useMemo(
    () =>
      createSceneHotspotClickHandler({
        ...sceneResolveOptions,
        isTransitionLocked: () => sceneNavTransitionLockedRef.current,
        lockTransition: () => {
          sceneNavTransitionLockedRef.current = true;
        },
        onUnavailable: (message) => {
          toast({
            variant: "destructive",
            title: SCENE_HOTSPOT_UNAVAILABLE_SHORT,
            description: message,
          });
        },
        onNavigate: (targetImageId) => {
          navigate(resolveImagePath(targetImageId));
        },
      }),
    [navigate, resolveImagePath, sceneResolveOptions, toast],
  );

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 fade-in"
        data-testid="public-viewer-loading"
      >
        <Loader2 size={32} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-400">Carregando panorama...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-6 fade-in"
        data-testid="public-viewer-error"
      >
        <p className="text-base text-white text-center">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.load_failed}
        </p>
        {isProjectContext && backHref ? (
          <Link
            to={backHref}
            className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors"
          >
            <ArrowLeft size={20} />
            {backLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col bg-[#050505] fade-in overflow-hidden"
      data-testid="public-viewer-page"
    >
      <ViewerPageHeader
        showBack={isProjectContext && Boolean(backHref)}
        backHref={backHref}
        backLabel={backLabel}
        subtitle={resolvedSubtitle}
        title={image?.title}
        backTestId="public-back-to-project"
        subtitleTestId="public-viewer-project-name"
        titleTestId="public-image-name"
      >
        {isProjectContext && imageNavBasePath ? (
          <ViewerNavControls
            previousImage={previousImage}
            nextImage={nextImage}
            imageBasePath={imageNavBasePath}
          />
        ) : null}
      </ViewerPageHeader>

      <div
        className="flex-1 min-h-0 relative"
        data-testid="public-viewer-container"
      >
        {panoramaUrl ? (
          <PanoramaViewer
            panoramaUrl={panoramaUrl}
            className="absolute inset-0"
            hotspots={visibleHotspots}
            onInfoHotspotClick={setInfoHotspot}
            onSceneHotspotClick={
              isProjectContext ? handleSceneHotspotClick : undefined
            }
            getSceneHotspotLabel={
              isProjectContext ? getSceneHotspotLabel : undefined
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">URL do panorama indisponível.</p>
          </div>
        )}
      </div>

      <HotspotInfoDialog
        hotspot={
          infoHotspot?.type !== HOTSPOT_TYPE_SCENE ? infoHotspot : null
        }
        open={Boolean(infoHotspot && infoHotspot.type !== HOTSPOT_TYPE_SCENE)}
        onOpenChange={(open) => {
          if (!open) {
            setInfoHotspot(null);
          }
        }}
      />
    </div>
  );
}
