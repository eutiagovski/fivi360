import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Loader2, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { LANDING_SHOWCASE } from "@/config/landingContent";
import { LANDING_DEMO } from "@/config/landingDemo";
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

const PanoramaViewer = lazy(() =>
  import("@/components/viewer/PanoramaViewer").then((module) => ({
    default: module.PanoramaViewer,
  })),
);

const primaryBtnClass =
  "bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto text-sm";

const secondaryBtnClass =
  "border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900 bg-transparent h-auto text-sm";

function DemoPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-transparent to-zinc-900/60" />
      <div className="relative rounded-full border border-zinc-700 bg-zinc-900/80 p-6">
        <Orbit className="h-10 w-10 text-zinc-400" strokeWidth={1.25} />
      </div>
      <p className="relative text-sm text-zinc-500 text-center">
        Experiência 360° interativa
      </p>
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

function DemoLoading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <Loader2 size={32} className="animate-spin text-zinc-400" />
      <p className="text-sm text-zinc-400">Carregando demonstração...</p>
    </div>
  );
}

function LandingDemoViewer({ image, images }) {
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

  // Landing: oculta scene inválidos para não quebrar a demo.
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
      <DemoFallback message={LANDING_SHOWCASE.fallbackMessage} />
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

export function LandingShowcase() {
  const sectionRef = useRef(null);
  const inView = useInViewport(sectionRef);
  const { images, loading, isAvailable } = useLandingDemo(
    LANDING_DEMO.projectId,
    { enabled: inView },
  );

  const firstImage = images[0] ?? null;

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="scroll-mt-20 py-16 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_SHOWCASE.title}
            subtitle={LANDING_SHOWCASE.subtitle}
            dataTestId="landing-showcase-title"
          />
        </div>

        <div
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 aspect-video min-h-[280px] md:min-h-[420px] relative overflow-hidden mb-8"
          data-testid="landing-demo-viewer"
        >
          {!inView && <DemoPlaceholder />}

          {inView && loading && <DemoLoading />}

          {inView && !loading && !isAvailable && (
            <DemoFallback message={LANDING_SHOWCASE.fallbackMessage} />
          )}

          {inView && !loading && isAvailable && firstImage && (
            <LandingDemoViewer image={firstImage} images={images} />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className={primaryBtnClass} asChild>
            <Link
              to={LANDING_DEMO.projectPath}
              data-testid="landing-demo-open-project-btn"
            >
              {LANDING_SHOWCASE.openProjectLabel}
            </Link>
          </Button>
          <Button variant="outline" className={secondaryBtnClass} asChild>
            <Link
              to={LANDING_DEMO.portfolioPath}
              data-testid="landing-demo-portfolio-btn"
            >
              {LANDING_SHOWCASE.portfolioLabel}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
