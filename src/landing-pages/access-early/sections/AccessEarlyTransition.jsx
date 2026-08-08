import { Button } from "@/components/ui/button";
import { ACCESS_EARLY_CONTENT, scrollToAccessEarlyForm } from "../content";

const primaryBtnClass =
  "bg-white text-black rounded-full px-8 py-3.5 font-medium btn-scale hover:bg-zinc-200 h-auto w-full sm:w-auto";

/**
 * Ponte visual entre produto e formulário.
 */
export function AccessEarlyTransition() {
  const { title, subtitle, cta } = ACCESS_EARLY_CONTENT.transition;

  return (
    <section
      className="py-16 md:py-20 bg-zinc-950/60 border-y border-zinc-900"
      data-testid="access-early-transition-section"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 text-center space-y-5">
        <h2
          className="text-2xl md:text-3xl font-light tracking-tight text-white"
          data-testid="access-early-transition-title"
        >
          {title}
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
        <Button
          type="button"
          className={primaryBtnClass}
          onClick={scrollToAccessEarlyForm}
          data-testid="access-early-transition-cta"
        >
          {cta}
        </Button>
      </div>
    </section>
  );
}
