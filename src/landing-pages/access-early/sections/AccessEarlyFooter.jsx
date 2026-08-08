import { Link } from "react-router-dom";
import { ACCESS_EARLY_CONTENT } from "../content";
import { BrandLogo } from "@/components/common/BrandLogo";

/**
 * Footer mínimo da campanha.
 */
export function AccessEarlyFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-zinc-800 mt-auto"
      data-testid="access-early-footer"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="space-y-2">
            <BrandLogo className="h-7" />
            <p className="text-sm text-zinc-500 max-w-sm">
              {ACCESS_EARLY_CONTENT.footer.tagline}
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-6 gap-y-2"
            aria-label="Links legais"
          >
            <a
              href="https://www.fivi360.com.br"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
              data-testid="access-early-footer-site"
            >
              Home
            </a>
            <Link
              to="/privacidade"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
              data-testid="access-early-footer-privacy"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
              data-testid="access-early-footer-terms"
            >
              Termos de Uso
            </Link>
          </nav>
        </div>

        <p className="text-xs text-zinc-600">
          &copy; {year} FIVI360. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
