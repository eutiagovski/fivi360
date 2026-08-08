import { ACCESS_EARLY_CONTENT } from "../content";

/**
 * Três passos: envie → conecte → compartilhe.
 */
export function AccessEarlyHowItWorks() {
  const { title, steps } = ACCESS_EARLY_CONTENT.howItWorks;

  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 py-16 md:py-24"
      data-testid="access-early-how-section"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2
          className="text-2xl md:text-3xl font-light tracking-tight text-white max-w-2xl mb-12"
          data-testid="access-early-how-title"
        >
          {title}
        </h2>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 list-none p-0 m-0">
          {steps.map((step) => (
            <li
              key={step.id}
              className="space-y-3"
              data-testid={`access-early-step-${step.id}`}
            >
              <p className="text-sm tracking-[0.2em] text-zinc-500 font-medium">
                {step.id}
              </p>
              <h3 className="text-lg font-medium text-white tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
