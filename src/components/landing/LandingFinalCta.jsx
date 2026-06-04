import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LANDING_FINAL_CTA } from "@/config/landingContent";

const primaryBtnClass =
  "bg-white text-black rounded-full px-8 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto text-base";

export function LandingFinalCta() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-8 py-12 md:px-16 md:py-16 text-center">
          <h2
            className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-4"
            data-testid="landing-final-cta-title"
          >
            {LANDING_FINAL_CTA.title}
          </h2>
          <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
            {LANDING_FINAL_CTA.description}
          </p>

          <Button className={primaryBtnClass} asChild>
            <Link to="/register" data-testid="landing-final-register-btn">
              {LANDING_FINAL_CTA.buttonLabel}
            </Link>
          </Button>

          <p className="text-sm text-zinc-500 mt-4">
            {LANDING_FINAL_CTA.footnote}
          </p>
        </div>
      </div>
    </section>
  );
}
