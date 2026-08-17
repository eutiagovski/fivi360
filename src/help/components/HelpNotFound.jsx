import { Link } from "react-router-dom";
import { HelpSearchPanel } from "@/help/components/HelpSearchPanel";
import { helpHomePath } from "@/help/utils/helpPaths";

export function HelpNotFound() {
  return (
    <div className="mx-auto max-w-xl py-6 text-center sm:py-10" data-testid="help-not-found">
      <p className="text-sm uppercase tracking-wider text-zinc-500">Artigo não encontrado</p>
      <h1 className="mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl">
        Este conteúdo não existe
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        O endereço pode ter mudado ou o artigo ainda não foi publicado. Volte à
        Central de Ajuda ou busque outro tema.
      </p>
      <div className="mt-8">
        <Link
          to={helpHomePath()}
          className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          data-testid="help-not-found-home"
        >
          Voltar para Central de Ajuda
        </Link>
      </div>
      <div className="mt-8 text-left">
        <p className="mb-3 text-sm text-zinc-500">Buscar outro artigo</p>
        <HelpSearchPanel id="help-not-found-search" size="compact" />
      </div>
    </div>
  );
}
