import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import { LandingDemoExperience } from "@/components/landing/LandingDemoExperience";
import { LANDING_SHOWCASE } from "@/config/landingContent";
import { LANDING_DEMO } from "@/config/landingDemo";

const primaryBtnClass =
  "bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto text-sm";

const secondaryBtnClass =
  "border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900 bg-transparent h-auto text-sm";

export function LandingShowcase() {
  return (
    <section id="demo" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_SHOWCASE.title}
            subtitle={LANDING_SHOWCASE.subtitle}
            dataTestId="landing-showcase-title"
          />
        </div>

        <LandingDemoExperience
          className="mb-8"
          fallbackMessage={LANDING_SHOWCASE.fallbackMessage}
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className={primaryBtnClass} asChild>
            <Link
              to={LANDING_DEMO.projectPath}
              data-testid="landing-demo-open-project-btn"
            >
              {LANDING_SHOWCASE.openProjectLabel}
            </Link>
          </Button>
          <Button variant="outline" className={secondaryBtnClass} asChild>
            <Link
              to={LANDING_DEMO.portfolioPath}
              data-testid="landing-demo-portfolio-btn"
            >
              {LANDING_SHOWCASE.portfolioLabel}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
