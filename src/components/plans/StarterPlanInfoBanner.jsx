import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Aviso informativo do plano Starter (Dashboard). Tom informativo, não de erro.
 */
export function StarterPlanInfoBanner({ className = "" }) {
  return (
    <aside
      className={`w-full min-w-0 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-5 py-4 sm:px-6 sm:py-5 ${className}`}
      data-testid="dashboard-starter-plan-banner"
      role="status"
    >
      <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:gap-4">
        <Sparkles
          size={20}
          className="flex-shrink-0 text-amber-400/90 sm:mt-0.5"
          aria-hidden
        />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <p className="text-sm font-semibold text-amber-100/95 leading-snug">
            Você está usando o plano Starter
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            O plano Starter possui limites de projetos e armazenamento
            (aproximadamente 5 imagens panorâmicas). Atualize para o plano
            Professional para liberar mais espaço e recursos do FIVI360.
          </p>
          <Link
            to="/plan"
            className="w-fit text-sm font-medium text-amber-400/90 underline-offset-4 hover:text-amber-300 hover:underline"
            data-testid="dashboard-starter-plan-banner-link"
          >
            Ver planos
          </Link>
        </div>
      </div>
    </aside>
  );
}
