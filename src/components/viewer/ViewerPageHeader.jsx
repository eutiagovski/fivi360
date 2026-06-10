import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BACK_BUTTON =
  "flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors";

/**
 * Cabeçalho do viewer: compacto no mobile (uma linha), completo no desktop.
 */
export function ViewerPageHeader({
  backHref,
  backLabel = "Voltar",
  subtitle,
  title,
  titleTestId,
  subtitleTestId,
  backTestId,
  children,
}) {
  const displayTitle = title || "Sem título";

  return (
    <header className="flex-shrink-0 z-50 px-3 py-2 md:p-6">
      <div className="flex md:hidden items-center gap-2 min-w-0">
        <Link
          to={backHref}
          data-testid={backTestId}
          aria-label={backLabel}
          className={BACK_BUTTON}
        >
          <ArrowLeft size={18} />
        </Link>

        <h1
          className="flex-1 min-w-0 text-sm font-light text-white truncate"
          data-testid={titleTestId}
        >
          {displayTitle}
        </h1>

        {children}
      </div>

      <div className="hidden md:flex items-center gap-4 min-w-0">
        <Link
          to={backHref}
          data-testid={backTestId}
          className={`${BACK_BUTTON} gap-2`}
        >
          <ArrowLeft size={20} />
          <span>{backLabel}</span>
        </Link>

        <div className="min-w-0 flex-1">
          {subtitle ? (
            <p
              className="text-sm text-zinc-400 truncate"
              data-testid={subtitleTestId}
            >
              {subtitle}
            </p>
          ) : null}
          <h1
            className="text-xl font-light text-white truncate"
            data-testid={titleTestId}
          >
            {displayTitle}
          </h1>
        </div>

        {children}
      </div>
    </header>
  );
}
