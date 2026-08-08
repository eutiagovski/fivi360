/**
 * Experiência 360° demonstrativa compartilhada (Home + LPs).
 *
 * Usa fetch público + PanoramaViewer — NÃO usa /embed comercial.
 */

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Orbit } from "lucide-react";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { FIVI360_DEMO_PROJECT } from "@/config/demoProject";
import { useHotspots } from "@/hooks/useHotspots";
import { useInViewport } from "@/hooks/useInViewport";
import { useLandingDemo } from "@/hooks/useLandingDemo";
import { HOTSPOT_TYPE_SCENE } from "@/services/hotspots/hotspotService";
import { createSceneHotspotClickHandler } from "@/utils/sceneHotspotNavigation";
import {
  SCENE_HOTSPOT_CONTEXT,
  buildAvailableSceneTargetMap,
  filterNavigableHotspots,
  resolveSceneHotspotTarget,
} from "@/utils/sceneHotspotTarget";
import { cn } from "@/lib/utils";

const PanoramaViewer = lazy(() =>
  import("@/components/viewer/PanoramaViewer").then((module) => ({
    default: module.PanoramaViewer,
  })),
);

function DemoPlaceholder({ hint = "Experiência 360° interativa" }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-transparent to-zinc-900/60" />
      <div className="relative rounded-full border border-zinc-700 bg-zinc-900/80 p-6">
        <Orbit className="h-10 w-10 text-zinc-400" strokeWidth={1.25} />
      </div>
      <p className="relative text-sm text-zinc-500 text-center">{hint}</p>
    </div>
  );
}

function DemoFallback({ message }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8"
      data-testid="landing-demo-unavailable"
    >
      <div className="rounded-full border border-zinc-700 bg-zinc-900/80 p-6">
        <Orbit className="h-10 w-10 text-zinc-400" strokeWidth={1.25} />
      </div>
      <p className="text-sm text-zinc-400 text-center max-w-sm">{message}</p>
    </div>
  );
}

function DemoLoading({ message = "Carregando demonstração..." }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      data-testid="landing-demo-loading"
    >
      <Loader2 size={32} className="animate-spin text-zinc-400" />
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}

function LandingDemoViewer({ image, images, showFullscreenCtrl = false }) {
  const [activeImageId, setActiveImageId] = useState(image?.id);
  const { hotspots } = useHotspots(activeImageId);
  const [infoHotspot, setInfoHotspot] = useState(null);
  const transitionLockedRef = useRef(false);

  useEffect(() => {
    if (image?.id) {
      setActiveImageId(image.id);
    }
  }, [image?.id]);

  useEffect(() => {
    transitionLockedRef.current = false;
  }, [activeImageId]);

  const activeImage =
    images.find((img) => img.id === activeImageId) ?? image ?? null;
  const panoramaUrl =
    activeImage?.originalUrl || activeImage?.previewUrl || "";

  const availableImagesById = useMemo(
    () => buildAvailableSceneTargetMap(images),
    [images],
  );

  const expectedProjectId = activeImage?.projectId ?? image?.projectId ?? null;

  const sceneResolveOptions = useMemo(
    () => ({
      availableImagesById,
      context: SCENE_HOTSPOT_CONTEXT.LANDING_DEMO,
      sourceImageId: activeImage?.id ?? activeImageId,
      expectedProjectId,
      imagesLoadState: "loaded",
    }),
    [activeImage?.id, activeImageId, availableImagesById, expectedProjectId],
  );

  const visibleHotspots = useMemo(
    () => filterNavigableHotspots(hotspots, sceneResolveOptions),
    [hotspots, sceneResolveOptions],
  );

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

  const handleSceneHotspotClick = useMemo(
    () =>
      createSceneHotspotClickHandler({
        ...sceneResolveOptions,
        isTransitionLocked: () => transitionLockedRef.current,
        lockTransition: () => {
          transitionLockedRef.current = true;
        },
        onNavigate: (targetImageId) => {
          setActiveImageId(targetImageId);
        },
      }),
    [sceneResolveOptions],
  );

  if (!panoramaUrl) {
    return (
      <DemoFallback message="Não foi possível carregar a demonstração agora." />
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-zinc-400" />
          </div>
        }
      >
        <PanoramaViewer
          panoramaUrl={panoramaUrl}
          className="absolute inset-0"
          hotspots={visibleHotspots}
          onInfoHotspotClick={setInfoHotspot}
          onSceneHotspotClick={handleSceneHotspotClick}
          getSceneHotspotLabel={getSceneHotspotLabel}
          showFullscreenCtrl={showFullscreenCtrl}
        />
      </Suspense>

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
    </>
  );
}

/**
 * Container do Viewer demo — mesmo projeto/config da Home.
 *
 * @param {{
 *   className?: string,
 *   fallbackMessage?: string,
 *   loadingMessage?: string,
 *   placeholderHint?: string,
 *   showFullscreenCtrl?: boolean,
 *   testId?: string,
 *   projectId?: string,
 * }} [props]
 */
export function LandingDemoExperience({
  className,
  fallbackMessage = "Demonstração temporariamente indisponível.",
  loadingMessage = "Carregando demonstração...",
  placeholderHint = "Experiência 360° interativa",
  showFullscreenCtrl = false,
  testId = "landing-demo-viewer",
  projectId = FIVI360_DEMO_PROJECT.projectId,
} = {}) {
  const sectionRef = useRef(null);
  const inView = useInViewport(sectionRef);
  const { images, loading, isAvailable } = useLandingDemo(projectId, {
    enabled: inView,
  });

  const firstImage = images[0] ?? null;

  return (
    <div
      ref={sectionRef}
      className={cn(
        // Fixed heights (not aspect-video + min-h): aspect-ratio + min-height
        // forces a min-width > viewport on mobile and overflows the page.
        "relative w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 h-[280px] md:h-[420px]",
        className,
      )}
      data-testid={testId}
      data-demo-project-id={projectId}
    >
      {!inView && <DemoPlaceholder hint={placeholderHint} />}

      {inView && loading && <DemoLoading message={loadingMessage} />}

      {inView && !loading && !isAvailable && (
        <DemoFallback message={fallbackMessage} />
      )}

      {inView && !loading && isAvailable && firstImage && (
        <LandingDemoViewer
          image={firstImage}
          images={images}
          showFullscreenCtrl={showFullscreenCtrl}
        />
      )}
    </div>
  );
}
