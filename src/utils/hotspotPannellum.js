import {
  HOTSPOT_TYPE_INFO,
  HOTSPOT_TYPE_SCENE,
} from "@/services/hotspots/hotspotService";

/**
 * @typedef {Object} HotspotPannellumHandlers
 * @property {(hotspot: import("@/services/hotspots/hotspotService").Hotspot) => void} [onInfoClick]
 * @property {(hotspot: import("@/services/hotspots/hotspotService").Hotspot) => void} [onSceneClick]
 * @property {(hotspot: import("@/services/hotspots/hotspotService").SceneHotspot) => string} [getSceneLabel]
 */

/**
 * Converte hotspots do Firestore para o formato do Pannellum.
 *
 * @param {import("@/services/hotspots/hotspotService").Hotspot[]} hotspots
 * @param {HotspotPannellumHandlers & {
 *   interactive?: boolean,
 *   cssClass?: string,
 * }} [handlers]
 * @returns {Array<{ id: string, pitch: number, yaw: number, type: string, text?: string, cssClass?: string, clickHandlerFunc?: function }>}
 */
export function mapHotspotsToPannellum(hotspots, handlers = {}) {
  const {
    onInfoClick,
    onSceneClick,
    getSceneLabel,
    interactive = true,
    cssClass,
  } = handlers;

  return hotspots.map((hs) => {
    if (hs.type === HOTSPOT_TYPE_SCENE) {
      const config = {
        id: hs.id,
        pitch: hs.pitch,
        yaw: hs.yaw,
        type: "scene",
        text: getSceneLabel?.(hs) || hs.title || "Hotspot existente",
      };

      if (cssClass) {
        config.cssClass = cssClass;
      }

      if (interactive && onSceneClick) {
        config.clickHandlerFunc = () => onSceneClick(hs);
      }

      return config;
    }

    const config = {
      id: hs.id,
      pitch: hs.pitch,
      yaw: hs.yaw,
      type: HOTSPOT_TYPE_INFO,
      text: hs.title || "Hotspot existente",
    };

    if (cssClass) {
      config.cssClass = cssClass;
    }

    if (interactive && onInfoClick && hs.type === HOTSPOT_TYPE_INFO) {
      config.clickHandlerFunc = () => onInfoClick(hs);
    }

    return config;
  });
}
