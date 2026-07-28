/**
 * Handler seguro de navegação por hotspot scene (RC-P0.9).
 *
 * Centraliza validação + feedback; analytics de sucesso só após navegação aceita.
 */

import {
  SCENE_HOTSPOT_UNAVAILABLE_MESSAGE,
  evaluateSceneHotspotNavigation,
  isSceneHotspot,
} from "@/utils/sceneHotspotTarget";

/**
 * @typedef {Object} SceneHotspotNavigationDeps
 * @property {(options: Parameters<typeof evaluateSceneHotspotNavigation>[0]) => ReturnType<typeof evaluateSceneHotspotNavigation>} [evaluate]
 * @property {(message: string, resolution: import("@/utils/sceneHotspotTarget").SceneHotspotTargetResolution) => void} [onUnavailable]
 * @property {(targetImageId: string, resolution: import("@/utils/sceneHotspotTarget").SceneHotspotTargetResolution) => void} [onNavigate]
 * @property {(payload: { context: string, reason: string, sourceImageId?: string | null }) => void} [onAnalyticsUnavailable]
 * @property {(payload: { context: string, targetImageId: string }) => void} [onAnalyticsSuccess]
 * @property {() => boolean} [isTransitionLocked]
 * @property {() => void} [lockTransition]
 */

/**
 * Cria handler de clique defensivo para hotspots scene.
 *
 * @param {Omit<Parameters<typeof evaluateSceneHotspotNavigation>[0], 'hotspot'> & SceneHotspotNavigationDeps} config
 * @returns {(hotspot: unknown) => boolean} true se navegou
 */
export function createSceneHotspotClickHandler(config) {
  const {
    evaluate = evaluateSceneHotspotNavigation,
    onUnavailable,
    onNavigate,
    onAnalyticsUnavailable,
    onAnalyticsSuccess,
    isTransitionLocked,
    lockTransition,
    ...resolveOptions
  } = config;

  return (hotspot) => {
    if (!isSceneHotspot(hotspot)) {
      return false;
    }

    if (isTransitionLocked?.()) {
      return false;
    }

    const decision = evaluate({
      ...resolveOptions,
      hotspot,
    });

    if (!decision.canNavigate) {
      if (decision.shouldShowUnavailableFeedback) {
        onUnavailable?.(SCENE_HOTSPOT_UNAVAILABLE_MESSAGE, decision.resolution);
        onAnalyticsUnavailable?.({
          context: resolveOptions.context,
          reason: decision.resolution.reason,
          sourceImageId: resolveOptions.sourceImageId ?? null,
        });
      }
      return false;
    }

    const targetImageId = decision.resolution.targetImageId;
    if (!targetImageId) {
      return false;
    }

    lockTransition?.();
    onNavigate?.(targetImageId, decision.resolution);
    onAnalyticsSuccess?.({
      context: resolveOptions.context,
      targetImageId,
    });
    return true;
  };
}
