import { AccessEarlyForm } from "../components/AccessEarlyForm";
import {
  ACCESS_EARLY_CONTENT,
  ACCESS_EARLY_FORM_ANCHOR,
} from "../content";

/**
 * Seção de conversão — formulário; sucesso navega para rota dedicada.
 *
 * @param {{ form: ReturnType<typeof import("../hooks/useAccessEarlyForm").useAccessEarlyForm> }} props
 */
export function AccessEarlyConversion({ form }) {
  const { title, subtitle, perk } = ACCESS_EARLY_CONTENT.conversion;

  return (
    <section
      id={ACCESS_EARLY_FORM_ANCHOR}
      className="scroll-mt-20 py-16 md:py-24"
      data-testid="access-early-conversion-section"
    >
      <div className="max-w-lg mx-auto px-6 md:px-10 space-y-8">
        <div className="text-center space-y-3">
          <h2
            className="text-2xl md:text-3xl font-light tracking-tight text-white"
            data-testid="access-early-conversion-title"
          >
            {title}
          </h2>
          <p
            className="text-zinc-400 leading-relaxed"
            data-testid="access-early-conversion-subtitle"
          >
            {subtitle}
          </p>
          <p className="text-sm text-zinc-500">{perk}</p>
        </div>

        <AccessEarlyForm form={form} />
      </div>
    </section>
  );
}
