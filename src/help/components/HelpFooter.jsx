import { Link } from "react-router-dom";
import {
  HELP_CONTACT_EMAIL,
  HELP_PRIVACY_PATH,
  HELP_TERMS_PATH,
} from "@/help/config/help";
import { helpHomePath } from "@/help/utils/helpPaths";

export function HelpFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-zinc-800"
      data-testid="help-footer"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10 lg:px-16">
        <p className="text-sm text-zinc-500">
          © {year} FIVI360. Central de Ajuda.
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          aria-label="Links institucionais"
        >
          <Link
            to={helpHomePath()}
            className="text-zinc-400 transition-colors hover:text-white"
            data-testid="help-footer-home"
          >
            Central de Ajuda
          </Link>
          <Link
            to={HELP_TERMS_PATH}
            className="text-zinc-400 transition-colors hover:text-white"
            data-testid="help-footer-terms"
          >
            Termos de Uso
          </Link>
          <Link
            to={HELP_PRIVACY_PATH}
            className="text-zinc-400 transition-colors hover:text-white"
            data-testid="help-footer-privacy"
          >
            Política de Privacidade
          </Link>
          <a
            href={`mailto:${HELP_CONTACT_EMAIL}`}
            className="text-zinc-400 transition-colors hover:text-white"
            data-testid="help-footer-contact"
          >
            {HELP_CONTACT_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  );
}
