import { Hand } from "lucide-react";

/**
 * Overlay discreto que indica que o panorama 360° é interativo.
 * Não bloqueia interação (pointer-events-none).
 *
 * @param {{ visible: boolean }} props
 */
export function ViewerInteractionHint({ visible }) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      data-testid="viewer-interaction-hint"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3 px-7 py-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] animate-in fade-in duration-300">
        <Hand
          size={28}
          strokeWidth={1.5}
          className="text-white/90"
          aria-hidden="true"
        />
        <p className="text-sm md:text-base font-medium text-white/95 text-center tracking-wide select-none">
          Arraste para explorar o ambiente
        </p>
      </div>
    </div>
  );
}
