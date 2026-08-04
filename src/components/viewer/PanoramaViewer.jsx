import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "pannellum/build/pannellum.css";
import "@/components/viewer/panorama-viewer.css";
import { ViewerInteractionHint } from "@/components/viewer/ViewerInteractionHint";
import { useViewerInteractionHint } from "@/hooks/useViewerInteractionHint";
import { cn } from "@/lib/utils";
import { mapHotspotsToPannellum } from "@/utils/hotspotPannellum";

const CONTEXT_MENU_DEBUG = process.env.NODE_ENV === "development";
const PREVIEW_HOTSPOT_CSS_CLASS = "pnlm-hotspot--preview-ref";

/**
 * Capacidades por modo do viewer.
 * upload-preview: fullscreen + hotspots de referência inertes; sem analytics/edição/navegação.
 *
 * @param {'default' | 'embed' | 'upload-preview'} mode
 * @param {{
 *   hotspotsInteractive?: boolean,
 *   showFullscreenCtrl?: boolean,
 * }} [overrides]
 */
export function getPanoramaViewerCapabilities(mode, overrides = {}) {
  if (mode === "upload-preview") {
    return {
      showHotspots: true,
      hotspotsInteractive: overrides.hotspotsInteractive === true,
      allowFullscreen: overrides.showFullscreenCtrl !== false,
      trackAnalytics: false,
      allowSceneNavigation: false,
      allowEditing: false,
      showInteractionHint: false,
      allowPlacement: false,
      allowContextMenu: false,
    };
  }

  return {
    showHotspots: true,
    hotspotsInteractive: overrides.hotspotsInteractive !== false,
    allowFullscreen: overrides.showFullscreenCtrl === true,
    trackAnalytics: mode !== "embed" ? true : false,
    allowSceneNavigation: true,
    allowEditing: true,
    showInteractionHint: true,
    allowPlacement: true,
    allowContextMenu: true,
  };
}

/**
 * Viewer 360° com Pannellum (equirectangular) e hotspots (info e scene).
 *
 * @param {{
 *   panoramaUrl: string,
 *   className?: string,
 *   hotspots?: import("@/services/hotspots/hotspotService").Hotspot[],
 *   placementMode?: boolean,
 *   onPlacementClick?: (coords: { pitch: number, yaw: number }) => void,
 *   onPanoramaContextMenu?: (payload: { pitch: number, yaw: number, clientX: number, clientY: number }) => void,
 *   onInfoHotspotClick?: (hotspot: import("@/services/hotspots/hotspotService").InfoHotspot) => void,
 *   onSceneHotspotClick?: (hotspot: import("@/services/hotspots/hotspotService").SceneHotspot) => void,
 *   getSceneHotspotLabel?: (hotspot: import("@/services/hotspots/hotspotService").SceneHotspot) => string,
 *   showZoomCtrl?: boolean,
 *   showFullscreenCtrl?: boolean,
 *   hotspotsInteractive?: boolean,
 *   mode?: 'default' | 'embed' | 'upload-preview',
 *   onReady?: () => void,
 *   onError?: (error?: unknown) => void,
 * }} props
 */
export function PanoramaViewer({
  panoramaUrl,
  className = "",
  hotspots = [],
  placementMode = false,
  onPlacementClick,
  onPanoramaContextMenu,
  onInfoHotspotClick,
  onSceneHotspotClick,
  getSceneHotspotLabel,
  showZoomCtrl = false,
  showFullscreenCtrl = false,
  hotspotsInteractive,
  mode = "default",
  onReady,
  onError,
}) {
  const capabilities = useMemo(
    () =>
      getPanoramaViewerCapabilities(mode, {
        hotspotsInteractive,
        showFullscreenCtrl,
      }),
    [mode, hotspotsInteractive, showFullscreenCtrl],
  );

  const effectiveHotspots = capabilities.showHotspots ? hotspots : [];
  const effectivePlacementMode =
    capabilities.allowPlacement && placementMode;
  const effectiveShowFullscreen = capabilities.allowFullscreen;
  const effectiveInteractive = capabilities.hotspotsInteractive;

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);
  const renderedHotspotIdsRef = useRef([]);
  const onInfoHotspotClickRef = useRef(onInfoHotspotClick);
  const onSceneHotspotClickRef = useRef(onSceneHotspotClick);
  const getSceneHotspotLabelRef = useRef(getSceneHotspotLabel);
  const onPlacementClickRef = useRef(onPlacementClick);
  const onPanoramaContextMenuRef = useRef(onPanoramaContextMenu);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const hintVisible = useViewerInteractionHint(
    viewerRef,
    viewerReady && capabilities.showInteractionHint,
  );

  onInfoHotspotClickRef.current = onInfoHotspotClick;
  onSceneHotspotClickRef.current = onSceneHotspotClick;
  getSceneHotspotLabelRef.current = getSceneHotspotLabel;
  onPlacementClickRef.current = onPlacementClick;
  onPanoramaContextMenuRef.current = onPanoramaContextMenu;
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const mouseEventToCoords = useCallback((viewer, event) => {
    const coords = viewer?.mouseEventToCoords?.(event);
    if (!coords || coords.length < 2) {
      return null;
    }
    return { pitch: coords[0], yaw: coords[1] };
  }, []);

  const mapToPannellum = useCallback(
    (hotspotList) =>
      mapHotspotsToPannellum(hotspotList, {
        interactive: effectiveInteractive,
        cssClass: effectiveInteractive ? undefined : PREVIEW_HOTSPOT_CSS_CLASS,
        onInfoClick: effectiveInteractive
          ? (hs) => onInfoHotspotClickRef.current?.(hs)
          : undefined,
        onSceneClick: effectiveInteractive
          ? (hs) => onSceneHotspotClickRef.current?.(hs)
          : undefined,
        getSceneLabel: (hs) =>
          getSceneHotspotLabelRef.current?.(hs) ||
          (effectiveInteractive ? "Ir para" : "Hotspot existente"),
      }),
    [effectiveInteractive],
  );

  const syncHotspots = useCallback(
    (viewer, hotspotList) => {
      if (!viewer?.removeHotSpot || !viewer?.addHotSpot) {
        return;
      }

      renderedHotspotIdsRef.current.forEach((id) => {
        viewer.removeHotSpot(id);
      });
      renderedHotspotIdsRef.current = [];

      const pannellumHotspots = mapToPannellum(hotspotList);

      pannellumHotspots.forEach((hs) => {
        viewer.addHotSpot(hs);
        if (hs.id) {
          renderedHotspotIdsRef.current.push(hs.id);
        }
      });
    },
    [mapToPannellum],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !panoramaUrl) {
      return undefined;
    }

    let cancelled = false;
    setViewerReady(false);

    async function initViewer() {
      await import("pannellum/build/pannellum.js");

      if (cancelled || !containerRef.current) {
        return;
      }

      const pannellum = window.pannellum;
      if (!pannellum?.viewer) {
        console.error("[PanoramaViewer] Pannellum não disponível.");
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      if (
        process.env.NODE_ENV === "development" &&
        (rect.width <= 0 || rect.height <= 0)
      ) {
        console.warn(
          "[PanoramaViewer] Container possui dimensões inválidas",
          {
            width: rect.width,
            height: rect.height,
            mode,
          },
        );
      }

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      viewerRef.current?.destroy?.();

      const initialHotspots = mapToPannellum(effectiveHotspots);

      viewerRef.current = pannellum.viewer(containerRef.current, {
        type: "equirectangular",
        panorama: panoramaUrl,
        autoLoad: true,
        showZoomCtrl: showZoomCtrl === true,
        showFullscreenCtrl: effectiveShowFullscreen,
        compass: false,
        showControls: showZoomCtrl === true || effectiveShowFullscreen,
        mouseZoom: true,
        hfov: 180,
        draggable: true,
        hotSpots: initialHotspots,
      });

      renderedHotspotIdsRef.current = initialHotspots
        .map((hs) => hs.id)
        .filter(Boolean);

      viewerRef.current.on("load", () => {
        if (cancelled) {
          return;
        }
        setViewerReady(true);
        onReadyRef.current?.();
        syncHotspots(viewerRef.current, effectiveHotspots);
      });

      viewerRef.current.on("error", (err) => {
        if (cancelled) {
          return;
        }
        setViewerReady(false);
        onErrorRef.current?.(err);
      });
    }

    initViewer();

    return () => {
      cancelled = true;
      setViewerReady(false);
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
      renderedHotspotIdsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panoramaUrl recria o viewer
  }, [panoramaUrl, showZoomCtrl, effectiveShowFullscreen, mode]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || typeof viewer.isLoaded !== "function" || !viewer.isLoaded()) {
      return;
    }

    syncHotspots(viewer, effectiveHotspots);
  }, [effectiveHotspots, syncHotspots]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer?.on || !capabilities.allowPlacement) {
      return undefined;
    }

    let pointerDown = null;

    const handleMouseDown = (event) => {
      if (!effectivePlacementMode || event.button !== 0) {
        pointerDown = null;
        return;
      }

      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event) => {
      if (
        !effectivePlacementMode ||
        !onPlacementClickRef.current ||
        !pointerDown
      ) {
        pointerDown = null;
        return;
      }

      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      pointerDown = null;

      if (dx * dx + dy * dy > 25) {
        return;
      }

      const coords = mouseEventToCoords(viewer, event);
      if (!coords) {
        return;
      }

      onPlacementClickRef.current(coords);
    };

    viewer.on("mousedown", handleMouseDown);
    viewer.on("mouseup", handleMouseUp);

    return () => {
      viewer.off?.("mousedown", handleMouseDown);
      viewer.off?.("mouseup", handleMouseUp);
    };
  }, [
    effectivePlacementMode,
    panoramaUrl,
    mouseEventToCoords,
    capabilities.allowPlacement,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const viewer = viewerRef.current;
    if (
      !container ||
      !viewer ||
      !viewerReady ||
      !capabilities.allowContextMenu
    ) {
      return undefined;
    }

    const handleContextMenu = (event) => {
      if (!onPanoramaContextMenuRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (CONTEXT_MENU_DEBUG) {
        console.log("[contextmenu] right click detected");
      }

      const coords = mouseEventToCoords(viewer, event);
      if (!coords) {
        if (CONTEXT_MENU_DEBUG) {
          console.log("[contextmenu] coords unavailable");
        }
        return;
      }

      if (CONTEXT_MENU_DEBUG) {
        console.log("[contextmenu] coords", coords);
      }

      onPanoramaContextMenuRef.current({
        ...coords,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    };

    container.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [
    panoramaUrl,
    viewerReady,
    mouseEventToCoords,
    capabilities.allowContextMenu,
  ]);

  // Redimensiona o Pannellum ao entrar/sair do fullscreen nativo.
  useEffect(() => {
    if (!effectiveShowFullscreen) {
      return undefined;
    }

    const handleFullscreenChange = () => {
      const viewer = viewerRef.current;
      if (typeof viewer?.resize === "function") {
        // Aguarda o layout estabilizar após a transição.
        requestAnimationFrame(() => {
          viewer.resize?.();
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [effectiveShowFullscreen, panoramaUrl, viewerReady]);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      data-testid="panorama-viewer-wrapper"
      data-mode={mode}
      data-hotspots-interactive={effectiveInteractive ? "true" : "false"}
      data-fullscreen-enabled={effectiveShowFullscreen ? "true" : "false"}
    >
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full panorama-viewer",
          effectivePlacementMode && "panorama-viewer--placing",
          (showZoomCtrl || effectiveShowFullscreen) &&
            "panorama-viewer--native-controls",
        )}
        data-testid="panorama-viewer"
        data-placing={effectivePlacementMode ? "true" : "false"}
      />
      {capabilities.showInteractionHint ? (
        <ViewerInteractionHint visible={hintVisible} />
      ) : null}
    </div>
  );
}
