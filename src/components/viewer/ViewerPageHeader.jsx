import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BACK_BUTTON =
  "flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors";

function FiviLogo({ className, testId = "public-logo" }) {
  return (
    <h1
      className={`flex-shrink-0 font-light tracking-tighter text-white ${className}`}
      data-testid={testId}
    >
      FIVI<span className="font-medium">360</span>
    </h1>
  );
}

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
  showBack = true,
  children,
}) {
  const displayTitle = title || "Sem título";

  const backControl = showBack ? (
    <Link
      to={backHref}
      data-testid={backTestId}
      aria-label={backLabel}
      className={`${BACK_BUTTON} gap-2`}
    >
      <ArrowLeft size={18} className="md:w-5 md:h-5" />
      <span className="hidden md:inline">{backLabel}</span>
    </Link>
  ) : (
    <FiviLogo className="text-lg md:text-2xl" />
  );

  return (
    <header className="flex-shrink-0 z-50 px-3 py-2 md:p-6">
      <div className="flex md:hidden items-center gap-2 min-w-0">
        {backControl}

        <h1
          className="flex-1 min-w-0 text-sm font-light text-white truncate"
          data-testid={titleTestId}
        >
          {displayTitle}
        </h1>

        {children}
      </div>

      <div className="hidden md:flex items-center gap-4 min-w-0">
        {backControl}

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
