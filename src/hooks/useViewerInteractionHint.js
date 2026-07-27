import { useCallback, useEffect, useRef, useState } from "react";
import {
  VIEWER_HINT_DISMISS_MS,
  VIEWER_HINT_MOVEMENT_THRESHOLD,
  hasSeenViewerHint,
  markViewerHintSeen,
} from "@/utils/viewerInteractionHint";

/**
 * Controla exibição única por sessão da dica de interação do viewer 360°.
 *
 * @param {React.MutableRefObject<object | null>} viewerRef
 * @param {boolean} viewerReady
 */
export function useViewerInteractionHint(viewerRef, viewerReady) {
  const [visible, setVisible] = useState(() => !hasSeenViewerHint());
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) {
      return;
    }

    dismissedRef.current = true;
    markViewerHintSeen();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible || !viewerReady) {
      return undefined;
    }

    const timeoutId = setTimeout(dismiss, VIEWER_HINT_DISMISS_MS);

    const viewer = viewerRef.current;
    if (!viewer?.on || !viewer?.getPitch || !viewer?.getYaw) {
      return () => {
        clearTimeout(timeoutId);
      };
    }

    let tracking = false;
    let startPitch = 0;
    let startYaw = 0;
    let rafId = null;

    const stopTracking = () => {
      tracking = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const checkMovement = () => {
      if (!tracking) {
        return;
      }

      const pitchDelta = Math.abs(viewer.getPitch() - startPitch);
      const yawDelta = Math.abs(viewer.getYaw() - startYaw);

      if (
        pitchDelta > VIEWER_HINT_MOVEMENT_THRESHOLD ||
        yawDelta > VIEWER_HINT_MOVEMENT_THRESHOLD
      ) {
        dismiss();
        return;
      }

      rafId = requestAnimationFrame(checkMovement);
    };

    const startTracking = () => {
      stopTracking();
      startPitch = viewer.getPitch();
      startYaw = viewer.getYaw();
      tracking = true;
      rafId = requestAnimationFrame(checkMovement);
    };

    const handleMouseDown = () => startTracking();
    const handleTouchStart = () => startTracking();
    const handleMouseUp = () => stopTracking();
    const handleTouchEnd = () => stopTracking();

    viewer.on("mousedown", handleMouseDown);
    viewer.on("touchstart", handleTouchStart);
    viewer.on("mouseup", handleMouseUp);
    viewer.on("touchend", handleTouchEnd);

    return () => {
      clearTimeout(timeoutId);
      stopTracking();
      viewer.off?.("mousedown", handleMouseDown);
      viewer.off?.("touchstart", handleTouchStart);
      viewer.off?.("mouseup", handleMouseUp);
      viewer.off?.("touchend", handleTouchEnd);
    };
  }, [visible, viewerReady, viewerRef, dismiss]);

  return visible;
}
