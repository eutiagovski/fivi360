import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  LANDING_FAQ_ITEMS,
  LANDING_FAQ_SECTION,
} from "@/config/landingContent";

export function LandingFaq() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_FAQ_SECTION.title}
            subtitle={LANDING_FAQ_SECTION.subtitle}
            dataTestId="landing-faq-title"
          />
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {LANDING_FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`item-${index}`}
                className="border-zinc-800"
                data-testid={`landing-faq-item-${index}`}
              >
                <AccordionTrigger className="text-left text-white hover:no-underline hover:text-zinc-200 py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
