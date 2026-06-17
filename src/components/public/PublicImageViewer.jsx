import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import { ViewerPageHeader } from "@/components/viewer/ViewerPageHeader";
import { ViewerNavControls } from "@/components/viewer/ViewerNavControls";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { usePublicViewerImage } from "@/hooks/usePublicViewerImage";
import { useHotspots } from "@/hooks/useHotspots";
import { trackEvent } from "@/services/analytics/analyticsService";
import { recordPublic360View } from "@/services/stats/publicViewTracking";
import { HOTSPOT_TYPE_SCENE } from "@/services/hotspots/hotspotService";

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
  const {
    image,
    project,
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

  const viewSource = accessMode === "portfolio" ? "public" : "shared";

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

  const visibleHotspots = useMemo(
    () =>
      isProjectContext
        ? hotspots
        : hotspots.filter((hotspot) => hotspot.type !== HOTSPOT_TYPE_SCENE),
    [hotspots, isProjectContext],
  );

  const getSceneHotspotLabel = useCallback(
    (hotspot) => {
      const destination = projectImages.find(
        (img) => img.id === hotspot.targetImageId,
      );
      return destination?.title
        ? `Ir para ${destination.title}`
        : "Ir para";
    },
    [projectImages],
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

  const handleSceneHotspotClick = useCallback(
    (hotspot) => {
      if (hotspot.targetImageId) {
        navigate(resolveImagePath(hotspot.targetImageId));
      }
    },
    [navigate, resolveImagePath],
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
        <p className="text-lg text-white text-center">
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
