import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  LANDING_HOW_IT_WORKS_SECTION,
  LANDING_HOW_IT_WORKS_STEPS,
} from "@/config/landingContent";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_HOW_IT_WORKS_SECTION.title}
            subtitle={LANDING_HOW_IT_WORKS_SECTION.subtitle}
            dataTestId="landing-how-it-works-title"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {LANDING_HOW_IT_WORKS_STEPS.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
              data-testid={`landing-how-it-works-step-${index}`}
            >
              {index < LANDING_HOW_IT_WORKS_STEPS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-5 left-[calc(50%+2rem)] right-0 h-px bg-zinc-800"
                  aria-hidden="true"
                />
              )}

              <Badge
                variant="outline"
                className="mb-4 border-zinc-700 text-zinc-300 rounded-full w-10 h-10 flex items-center justify-center p-0 text-sm font-medium"
              >
                {index + 1}
              </Badge>

              <h3 className="text-base font-medium text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
