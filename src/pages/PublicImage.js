import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import { ViewerPageHeader } from "@/components/viewer/ViewerPageHeader";
import { ViewerNavControls } from "@/components/viewer/ViewerNavControls";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { usePublicViewerImage } from "@/hooks/usePublicViewerImage";
import { useHotspots } from "@/hooks/useHotspots";
import { HOTSPOT_TYPE_SCENE } from "@/services/hotspots/hotspotService";

const ERROR_MESSAGES = {
  not_found: "Imagem não encontrada.",
  unavailable: "Esta imagem não está disponível.",
  load_failed: "Não foi possível carregar o panorama.",
};

export const PublicImage = () => {
  const { imageId } = useParams();
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
  } = usePublicViewerImage(imageId);
  const { hotspots } = useHotspots(imageId);

  const [infoHotspot, setInfoHotspot] = useState(null);

  const panoramaUrl = image?.originalUrl || image?.previewUrl || "";
  const backHref = isProjectContext
    ? `/share/project/${image?.projectId ?? project.id}`
    : undefined;
  const backLabel = isProjectContext ? "Voltar ao projeto" : undefined;
  const subtitle = isProjectContext
    ? project?.title || "Projeto"
    : "Imagem compartilhada";

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

  const handleSceneHotspotClick = useCallback(
    (hotspot) => {
      if (hotspot.targetImageId) {
        navigate(`/share/image/${hotspot.targetImageId}`);
      }
    },
    [navigate],
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
        {isProjectContext ? (
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
        showBack={isProjectContext}
        backHref={backHref}
        backLabel={backLabel}
        subtitle={subtitle}
        title={image?.title}
        backTestId="public-back-to-project"
        subtitleTestId="public-viewer-project-name"
        titleTestId="public-image-name"
      >
        {isProjectContext ? (
          <ViewerNavControls
            previousImage={previousImage}
            nextImage={nextImage}
            imageBasePath="/share/image"
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
};
