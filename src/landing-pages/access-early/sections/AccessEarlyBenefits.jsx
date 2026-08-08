import { Compass, Share2, Code2 } from "lucide-react";
import { ACCESS_EARLY_CONTENT } from "../content";

const ICONS = {
  explore: Compass,
  share: Share2,
  embed: Code2,
};

/**
 * Três benefícios principais — Explore / Compartilhe / Incorpore.
 */
export function AccessEarlyBenefits() {
  const { title, items } = ACCESS_EARLY_CONTENT.benefits;

  return (
    <section
      className="py-16 md:py-20 bg-zinc-950/60 border-y border-zinc-900"
      data-testid="access-early-benefits-section"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2
          className="text-2xl md:text-3xl font-light tracking-tight text-white mb-12"
          data-testid="access-early-benefits-title"
        >
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {items.map((item) => {
            const Icon = ICONS[item.id] || Compass;
            return (
              <div
                key={item.id}
                className="space-y-4"
                data-testid={`access-early-benefit-${item.id}`}
              >
                <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 p-3">
                  <Icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.copy}</p>
                {item.note ? (
                  <p className="text-xs text-zinc-600">{item.note}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
