import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NAV_BUTTON_BASE =
  "flex-shrink-0 flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl border transition-colors";
const NAV_BUTTON_ENABLED =
  "bg-black/60 backdrop-blur-xl border-white/10 text-white hover:bg-black/80";
const NAV_BUTTON_DISABLED =
  "bg-black/40 border-white/5 text-zinc-600 cursor-not-allowed pointer-events-none";

/**
 * Navegação anterior/próxima entre imagens do mesmo projeto.
 *
 * @param {{
 *   previousImage: { id: string } | null,
 *   nextImage: { id: string } | null,
 *   imageBasePath?: string,
 * }} props
 */
export function ViewerNavControls({
  previousImage,
  nextImage,
  imageBasePath = "/viewer",
}) {
  const imageHref = (id) => `${imageBasePath}/${id}`;
  const hasMultiple = Boolean(previousImage || nextImage);

  if (!hasMultiple) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
      data-testid="viewer-nav"
    >
      {previousImage ? (
        <Link
          to={imageHref(previousImage.id)}
          data-testid="viewer-prev"
          aria-label="Imagem anterior"
          className={`${NAV_BUTTON_BASE} ${NAV_BUTTON_ENABLED}`}
        >
          <ChevronLeft size={20} />
        </Link>
      ) : (
        <span
          data-testid="viewer-prev-disabled"
          aria-label="Imagem anterior"
          aria-disabled="true"
          className={`${NAV_BUTTON_BASE} ${NAV_BUTTON_DISABLED}`}
        >
          <ChevronLeft size={20} />
        </span>
      )}

      {nextImage ? (
        <Link
          to={imageHref(nextImage.id)}
          data-testid="viewer-next"
          aria-label="Próxima imagem"
          className={`${NAV_BUTTON_BASE} ${NAV_BUTTON_ENABLED}`}
        >
          <ChevronRight size={20} />
        </Link>
      ) : (
        <span
          data-testid="viewer-next-disabled"
          aria-label="Próxima imagem"
          aria-disabled="true"
          className={`${NAV_BUTTON_BASE} ${NAV_BUTTON_DISABLED}`}
        >
          <ChevronRight size={20} />
        </span>
      )}
    </div>
  );
}
