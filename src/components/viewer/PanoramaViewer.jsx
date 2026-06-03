import { useCallback, useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import "@/components/viewer/panorama-viewer.css";
import { mapHotspotsToPannellum } from "@/utils/hotspotPannellum";

/**
 * Viewer 360° com Pannellum (equirectangular) e hotspots (info e scene).
 *
 * @param {{
 *   panoramaUrl: string,
 *   className?: string,
 *   hotspots?: import("@/services/hotspots/hotspotService").Hotspot[],
 *   placementMode?: boolean,
 *   onPlacementClick?: (coords: { pitch: number, yaw: number }) => void,
 *   onInfoHotspotClick?: (hotspot: import("@/services/hotspots/hotspotService").InfoHotspot) => void,
 *   onSceneHotspotClick?: (hotspot: import("@/services/hotspots/hotspotService").SceneHotspot) => void,
 *   getSceneHotspotLabel?: (hotspot: import("@/services/hotspots/hotspotService").SceneHotspot) => string,
 * }} props
 */
export function PanoramaViewer({
  panoramaUrl,
  className = "",
  hotspots = [],
  placementMode = false,
  onPlacementClick,
  onInfoHotspotClick,
  onSceneHotspotClick,
  getSceneHotspotLabel,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const renderedHotspotIdsRef = useRef([]);
  const onInfoHotspotClickRef = useRef(onInfoHotspotClick);
  const onSceneHotspotClickRef = useRef(onSceneHotspotClick);
  const getSceneHotspotLabelRef = useRef(getSceneHotspotLabel);
  const onPlacementClickRef = useRef(onPlacementClick);

  onInfoHotspotClickRef.current = onInfoHotspotClick;
  onSceneHotspotClickRef.current = onSceneHotspotClick;
  getSceneHotspotLabelRef.current = getSceneHotspotLabel;
  onPlacementClickRef.current = onPlacementClick;

  const mapToPannellum = useCallback(
    (hotspotList) =>
      mapHotspotsToPannellum(hotspotList, {
        onInfoClick: (hs) => onInfoHotspotClickRef.current?.(hs),
        onSceneClick: (hs) => onSceneHotspotClickRef.current?.(hs),
        getSceneLabel: (hs) => getSceneHotspotLabelRef.current?.(hs),
      }),
    [],
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

      viewerRef.current?.destroy?.();

      const initialHotspots = mapToPannellum(hotspots);

      viewerRef.current = pannellum.viewer(containerRef.current, {
        type: "equirectangular",
        panorama: panoramaUrl,
        autoLoad: true,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        compass: false,
        showControls: false,
        mouseZoom: true,
        draggable: true,
        hotSpots: initialHotspots,
      });

      renderedHotspotIdsRef.current = initialHotspots
        .map((hs) => hs.id)
        .filter(Boolean);

      viewerRef.current.on("load", () => {
        syncHotspots(viewerRef.current, hotspots);
      });
    }

    initViewer();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
      renderedHotspotIdsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panoramaUrl recria o viewer
  }, [panoramaUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || typeof viewer.isLoaded !== "function" || !viewer.isLoaded()) {
      return;
    }

    syncHotspots(viewer, hotspots);
  }, [hotspots, syncHotspots]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer?.on) {
      return undefined;
    }

    let pointerDown = null;

    const handleMouseDown = (event) => {
      if (!placementMode || event.button !== 0) {
        pointerDown = null;
        return;
      }

      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event) => {
      if (!placementMode || !onPlacementClickRef.current || !pointerDown) {
        pointerDown = null;
        return;
      }

      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      pointerDown = null;

      if (dx * dx + dy * dy > 25) {
        return;
      }

      const coords = viewer.mouseEventToCoords?.(event);
      if (!coords || coords.length < 2) {
        return;
      }

      onPlacementClickRef.current({
        pitch: coords[0],
        yaw: coords[1],
      });
    };

    viewer.on("mousedown", handleMouseDown);
    viewer.on("mouseup", handleMouseUp);

    return () => {
      viewer.off?.("mousedown", handleMouseDown);
      viewer.off?.("mouseup", handleMouseUp);
    };
  }, [placementMode, panoramaUrl]);

  return (
    <div
      ref={containerRef}
      className={`panorama-viewer ${placementMode ? "panorama-viewer--placing" : ""} ${className}`.trim()}
      data-testid="panorama-viewer"
      data-placing={placementMode ? "true" : "false"}
    />
  );
}
