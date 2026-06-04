import { Link } from "react-router-dom";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_PORTFOLIO } from "@/config/landingContent";
import { LANDING_DEMO } from "@/config/landingDemo";

const primaryBtnClass =
  "bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto text-base";

const secondaryBtnClass =
  "border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900 bg-transparent h-auto text-base";

export function LandingPortfolio() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-4"
              data-testid="landing-portfolio-title"
            >
              {LANDING_PORTFOLIO.title}
            </h2>
            <p className="text-base text-zinc-400 mb-8 leading-relaxed">
              {LANDING_PORTFOLIO.description}
            </p>

            <ul className="space-y-4 mb-8">
              {LANDING_PORTFOLIO.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <div className="mt-0.5 p-0.5 bg-white rounded-full flex-shrink-0">
                    <Check size={14} className="text-black" />
                  </div>
                  <span className="text-sm text-zinc-300 leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className={secondaryBtnClass} asChild>
                <Link
                  to={LANDING_DEMO.portfolioPath}
                  data-testid="landing-portfolio-demo-btn"
                >
                  {LANDING_PORTFOLIO.portfolioCtaLabel}
                </Link>
              </Button>
              <Button className={primaryBtnClass} asChild>
                <Link
                  to="/register"
                  data-testid="landing-portfolio-register-btn"
                >
                  {LANDING_PORTFOLIO.registerCtaLabel}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-md aspect-square rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden card-hover"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-transparent to-zinc-900/60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="rounded-full border border-zinc-700 bg-zinc-900/80 p-6">
                  <Globe className="h-12 w-12 text-zinc-400" strokeWidth={1.25} />
                </div>
                <p className="text-sm text-zinc-500 text-center">
                  fivi360.com/u/seu-nome
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
