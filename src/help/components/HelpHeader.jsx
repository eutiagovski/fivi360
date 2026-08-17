import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  HELP_APP_HOME_PATH,
  HELP_LOGIN_PATH,
} from "@/help/config/help";
import { helpHomePath } from "@/help/utils/helpPaths";

/**
 * Header da Central de Ajuda — ecossistema FIVI360, fora do Dashboard.
 * Sem AuthContext: links estáticos para não acoplar o módulo ao app autenticado.
 */
export function HelpHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#050505]/90 backdrop-blur-xl"
      data-testid="help-header"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:px-10 lg:px-16">
        <Link
          to={helpHomePath()}
          className="inline-flex min-w-0 items-center gap-3"
          data-testid="help-header-brand"
        >
          <BrandLogo className="h-4 md:h-5" />
          <span className="hidden h-4 w-px bg-zinc-700 sm:block" aria-hidden />
          <span className="truncate text-sm text-zinc-400">Central de Ajuda</span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Atalhos da Central de Ajuda"
        >
          <Link
            to={HELP_APP_HOME_PATH}
            className="rounded-full px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white sm:px-4"
            data-testid="help-header-back"
          >
            Voltar ao FIVI360
          </Link>
          <Link
            to={HELP_LOGIN_PATH}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-900"
            data-testid="help-header-login"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
