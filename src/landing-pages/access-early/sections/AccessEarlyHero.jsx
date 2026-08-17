import { Button } from "@/components/ui/button";
import { ACCESS_EARLY_CONTENT, scrollToAccessEarlyForm } from "../content";

const primaryBtnClass =
  "bg-white text-black rounded-full px-8 py-3.5 font-medium btn-scale hover:bg-zinc-200 h-auto w-full sm:w-auto";

/**
 * Hero da campanha — proposta de valor + CTA para o formulário.
 */
export function AccessEarlyHero() {
  const { headline, subheadline, cta, microcopy } = ACCESS_EARLY_CONTENT.hero;

  return (
    <section
      id="topo"
      className="relative overflow-hidden pt-16 md:pt-24 pb-16 md:pb-20 min-h-[80vh] flex items-center"
      data-testid="access-early-hero"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(63,63,70,0.35)_0%,_transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-6 md:px-10">
        <div className="max-w-7xl space-y-6">
          <p
            className="text-sm uppercase tracking-[0.2em] text-zinc-500"
            data-testid="access-early-brand"
          >
            FIVI360 · Acesso antecipado
          </p>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-[1.15]"
            data-testid="access-early-hero-headline"
          >
            {headline}
          </h1>
          <p
            className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl"
            data-testid="access-early-hero-subheadline"
          >
            {subheadline}
          </p>
          <div className="pt-2 space-y-3">
            <Button
              type="button"
              className={primaryBtnClass}
              onClick={scrollToAccessEarlyForm}
              data-testid="access-early-hero-cta"
            >
              {cta}
            </Button>
            <p className="text-sm text-zinc-500 max-w-md">{microcopy}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
