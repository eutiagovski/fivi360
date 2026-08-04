import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { EmbedPoweredByBrand } from "@/components/embed/EmbedPoweredByBrand";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import { ViewerNavControls } from "@/components/viewer/ViewerNavControls";
import { fetchPublicEmbeddedProject } from "@/services/embed/embedPublicService";
import { createSceneHotspotClickHandler } from "@/utils/sceneHotspotNavigation";
import {
  SCENE_HOTSPOT_CONTEXT,
  SCENE_HOTSPOT_UNAVAILABLE_SHORT,
  buildAvailableSceneTargetMap,
  filterNavigableHotspots,
  resolveSceneHotspotTarget,
} from "@/utils/sceneHotspotTarget";
import { useToast } from "@/hooks/use-toast";

const MSG_UNAVAILABLE = "Esta visualização não está disponível.";
const MSG_EMPTY =
  "Este projeto ainda não possui imagens disponíveis para visualização.";
const MSG_LOAD_FAILED =
  "Não foi possível carregar esta visualização. Tente novamente mais tarde.";

/**
 * @param {import("@/services/embed/embedPublicService").EmbeddedImageDTO} image
 */
function toSceneTargetImage(image, projectId) {
  return {
    id: image.id,
    projectId,
    title: image.name,
    originalUrl: image.panoramaUrl,
    previewUrl: image.panoramaUrl,
  };
}

/**
 * Shell do Viewer em modo Embed — sem chrome administrativo.
 */
export function EmbedProjectPage() {
  const { projectId, imageId: routeImageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [infoHotspot, setInfoHotspot] = useState(null);
  const sceneNavTransitionLockedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        setError("unavailable");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPublicEmbeddedProject(projectId);
        if (cancelled) {
          return;
        }
        setProject(data);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setProject(null);
        setError(err?.code === "load_failed" ? "load_failed" : "unavailable");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    sceneNavTransitionLockedRef.current = false;
  }, [routeImageId]);

  const images = useMemo(
    () => (Array.isArray(project?.images) ? project.images : []),
    [project],
  );
  const allowNavigation = project?.embedSettings?.allowNavigation !== false;
  const allowFullscreen = project?.embedSettings?.allowFullscreen !== false;

  const currentImageId = useMemo(() => {
    if (!project || images.length === 0) {
      return null;
    }

    if (routeImageId && images.some((image) => image.id === routeImageId)) {
      return routeImageId;
    }

    return project.initialImageId ?? images[0]?.id ?? null;
  }, [project, images, routeImageId]);

  const currentImage = useMemo(
    () => images.find((image) => image.id === currentImageId) ?? null,
    [images, currentImageId],
  );

  const currentIndex = useMemo(() => {
    if (!currentImageId) {
      return -1;
    }
    return images.findIndex((image) => image.id === currentImageId);
  }, [images, currentImageId]);

  const previousImage =
    allowNavigation && currentIndex > 0 ? images[currentIndex - 1] : null;
  const nextImage =
    allowNavigation && currentIndex >= 0 && currentIndex < images.length - 1
      ? images[currentIndex + 1]
      : null;

  const sceneImages = useMemo(
    () => images.map((image) => toSceneTargetImage(image, projectId)),
    [images, projectId],
  );

  const availableImagesById = useMemo(
    () => buildAvailableSceneTargetMap(sceneImages),
    [sceneImages],
  );

  const imagesLoadState = loading
    ? "loading"
    : error === "load_failed"
      ? "failed"
      : "loaded";

  const sceneResolveOptions = useMemo(
    () => ({
      availableImagesById,
      context: SCENE_HOTSPOT_CONTEXT.EMBED_VIEWER,
      sourceImageId: currentImageId,
      expectedProjectId: projectId ?? null,
      imagesLoadState,
      sceneNavigationEnabled: allowNavigation,
    }),
    [
      availableImagesById,
      allowNavigation,
      currentImageId,
      imagesLoadState,
      projectId,
    ],
  );

  const visibleHotspots = useMemo(() => {
    const hotspots = currentImage?.hotspots ?? [];

    if (!allowNavigation) {
      return hotspots.filter((hotspot) => hotspot.type !== "scene");
    }

    return filterNavigableHotspots(hotspots, sceneResolveOptions);
  }, [allowNavigation, currentImage, sceneResolveOptions]);

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
    (targetImageId) => `/embed/${projectId}/image/${targetImageId}`,
    [projectId],
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
        className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center gap-4"
        data-testid="embed-viewer-loading"
      >
        <Loader2 size={32} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-400">Carregando visualização...</p>
      </div>
    );
  }

  if (error === "load_failed") {
    return (
      <div
        className="h-screen w-screen bg-[#050505] flex items-center justify-center px-6"
        data-testid="embed-viewer-error"
      >
        <p className="text-base text-white text-center">{MSG_LOAD_FAILED}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        className="h-screen w-screen bg-[#050505] flex items-center justify-center px-6"
        data-testid="embed-viewer-unavailable"
      >
        <p className="text-base text-white text-center">{MSG_UNAVAILABLE}</p>
      </div>
    );
  }

  if (project.empty || images.length === 0) {
    return (
      <div
        className="h-screen w-screen bg-[#050505] flex items-center justify-center px-6"
        data-testid="embed-viewer-empty"
      >
        <p className="text-base text-white text-center">{MSG_EMPTY}</p>
      </div>
    );
  }

  if (!routeImageId && currentImageId) {
    return (
      <Navigate
        to={`/embed/${projectId}/image/${currentImageId}`}
        replace
      />
    );
  }

  if (routeImageId && routeImageId !== currentImageId && currentImageId) {
    return (
      <Navigate
        to={`/embed/${projectId}/image/${currentImageId}`}
        replace
      />
    );
  }

  if (!currentImage) {
    return (
      <div
        className="h-screen w-screen bg-[#050505] flex items-center justify-center px-6"
        data-testid="embed-viewer-unavailable"
      >
        <p className="text-base text-white text-center">{MSG_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#050505] overflow-hidden"
      data-testid="embed-viewer-page"
    >
      {/* Título no topo-esquerdo; reserva a direita para zoom/fullscreen do Pannellum */}
      <div
        className="pointer-events-none absolute left-3 top-3 z-[6] max-w-[min(70%,calc(100%-5.5rem))]"
        data-testid="embed-environment-title-wrap"
      >
        <p
          className="line-clamp-2 break-words rounded-lg bg-black/50 px-2.5 py-1.5 text-xs leading-snug text-zinc-200 backdrop-blur-md"
          data-testid="embed-environment-name"
          title={currentImage.name || project.name || undefined}
        >
          {currentImage.name || project.name}
        </p>
      </div>

      {allowNavigation ? (
        <div className="absolute right-14 top-3 z-[6] sm:right-16">
          <ViewerNavControls
            previousImage={previousImage}
            nextImage={nextImage}
            imageBasePath={`/embed/${projectId}/image`}
          />
        </div>
      ) : null}

      <div
        className="relative flex-1 min-h-0 w-full"
        data-testid="embed-viewer-container"
      >
        <PanoramaViewer
          panoramaUrl={currentImage.panoramaUrl}
          className="absolute inset-0 min-h-[200px]"
          mode="embed"
          hotspots={visibleHotspots}
          showZoomCtrl
          showFullscreenCtrl={allowFullscreen}
          onInfoHotspotClick={setInfoHotspot}
          onSceneHotspotClick={
            allowNavigation ? handleSceneHotspotClick : undefined
          }
          getSceneHotspotLabel={
            allowNavigation ? getSceneHotspotLabel : undefined
          }
        />
        <EmbedPoweredByBrand />
      </div>

      <HotspotInfoDialog
        hotspot={infoHotspot?.type !== "scene" ? infoHotspot : null}
        open={Boolean(infoHotspot && infoHotspot.type !== "scene")}
        onOpenChange={(open) => {
          if (!open) {
            setInfoHotspot(null);
          }
        }}
      />
    </div>
  );
}
