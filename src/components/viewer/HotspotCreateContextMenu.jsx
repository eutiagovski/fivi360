import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, Navigation } from "lucide-react";
const MENU_WIDTH_ESTIMATE = 260;
const MENU_HEIGHT_ESTIMATE = 160;
const VIEWPORT_PADDING = 8;

/**
 * @param {{ x: number, y: number }} position
 * @returns {{ x: number, y: number }}
 */
function clampMenuPosition(position) {
  const maxX = window.innerWidth - MENU_WIDTH_ESTIMATE - VIEWPORT_PADDING;
  const maxY = window.innerHeight - MENU_HEIGHT_ESTIMATE - VIEWPORT_PADDING;

  return {
    x: Math.max(VIEWPORT_PADDING, Math.min(position.x, maxX)),
    y: Math.max(VIEWPORT_PADDING, Math.min(position.y, maxY)),
  };
}

const MENU_ITEM =
  "group w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-300 rounded-lg bg-transparent transition-colors hover:bg-zinc-900 hover:text-white";

const MENU_ITEM_ICON =
  "shrink-0 text-zinc-500 transition-colors group-hover:text-white";

/**
 * Menu flutuante para escolher o tipo de hotspot ao clicar com botão direito no panorama.
 */
export function HotspotCreateContextMenu({
  open,
  position,
  sceneHotspotsEnabled = false,
  onSelectInfo,
  onSelectScene,
  onClose,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) {
        return;
      }
      onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open, onClose]);

  if (!open || !position) {
    return null;
  }

  const clamped = clampMenuPosition(position);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Criar hotspot"
      data-testid="hotspot-create-context-menu"
      className="fixed z-[60] min-w-[260px] p-2 rounded-xl border border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md shadow-2xl shadow-black/40"
      style={{ left: clamped.x, top: clamped.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className="px-3 py-2 text-sm font-medium text-white select-none border-b border-zinc-800/70">
        Criar hotspot
      </p>
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          role="menuitem"
          data-testid="hotspot-context-info"
          className={MENU_ITEM}
          onClick={() => onSelectInfo?.()}
        >
          <Info size={16} className={MENU_ITEM_ICON} aria-hidden />
          <span>Adicionar informação neste ponto</span>
        </button>
        {sceneHotspotsEnabled && (
          <button
            type="button"
            role="menuitem"
            data-testid="hotspot-context-scene"
            className={MENU_ITEM}
            onClick={() => onSelectScene?.()}
          >
            <Navigation size={16} className={MENU_ITEM_ICON} aria-hidden />
            <span>Adicionar navegação neste ponto</span>
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
