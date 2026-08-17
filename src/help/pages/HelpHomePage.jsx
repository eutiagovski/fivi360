import { usePageSeo } from "@/hooks/usePageSeo";
import { HelpCategoryGrid } from "@/help/components/HelpCategoryGrid";
import { HelpLayout } from "@/help/components/HelpLayout";
import { HelpSearchPanel } from "@/help/components/HelpSearchPanel";
import { HELP_SEO } from "@/help/config/help";

export function HelpHomePage() {
  usePageSeo({
    title: HELP_SEO.homeTitle,
    description: HELP_SEO.homeDescription,
  });

  return (
    <HelpLayout>
      <div data-testid="help-home">
        <p className="text-sm uppercase tracking-wider text-zinc-500">
          FIVI360 · Central de Ajuda
        </p>
        <h1
          className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-5xl"
          data-testid="help-home-title"
        >
          Como podemos ajudar?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Tutoriais objetivos para criar projetos, enviar panoramas 360° e
          apresentar seu trabalho a clientes.
        </p>

        <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <HelpSearchPanel id="help-home-search" size="hero" autoFocus />
        </div>

        <section className="mt-12 sm:mt-16" aria-labelledby="help-categories-heading">
          <h2
            id="help-categories-heading"
            className="mb-5 text-sm uppercase tracking-wider text-zinc-500"
          >
            Categorias
          </h2>
          <HelpCategoryGrid />
        </section>
      </div>
    </HelpLayout>
  );
}
