import { Button } from "@/components/ui/button";
import { LandingDemoExperience } from "@/components/landing/LandingDemoExperience";
import { FIVI360_DEMO_PROJECT } from "@/config/demoProject";
import { ACCESS_EARLY_CONTENT, scrollToAccessEarlyForm } from "../content";

const primaryBtnClass =
  "bg-white text-black rounded-full px-8 py-3.5 font-medium btn-scale hover:bg-zinc-200 h-auto w-full sm:w-auto";

/**
 * Viewer demonstrativo — mesmo projeto/config da Home (não usa /embed).
 */
export function AccessEarlyDemo() {
  const { title, subtitle, loading, error, ctaAfter } = ACCESS_EARLY_CONTENT.demo;

  return (
    <section
      id="experimente"
      className="scroll-mt-20 py-16 md:py-24"
      data-testid="access-early-demo-section"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-10 space-y-3">
          <h2
            className="text-2xl md:text-3xl font-light tracking-tight text-white"
            data-testid="access-early-demo-title"
          >
            {title}
          </h2>
          <p className="text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>

        <LandingDemoExperience
          projectId={FIVI360_DEMO_PROJECT.projectId}
          testId="access-early-demo-viewer"
          loadingMessage={loading}
          fallbackMessage={error}
          showFullscreenCtrl
          className="h-[320px] md:h-[480px] lg:h-[560px]"
        />

        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            className={primaryBtnClass}
            onClick={scrollToAccessEarlyForm}
            data-testid="access-early-demo-cta"
          >
            {ctaAfter}
          </Button>
        </div>
      </div>
    </section>
  );
}
