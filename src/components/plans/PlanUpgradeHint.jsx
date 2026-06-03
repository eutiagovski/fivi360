import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Mensagem amigável com link para a página de planos.
 *
 * @param {{ message: string, className?: string, compact?: boolean }} props
 */
export function PlanUpgradeHint({ message, className = "", compact = false }) {
  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 ${className}`}
      data-testid="plan-upgrade-hint"
    >
      <div className={`flex ${compact ? "items-center" : "items-start"} gap-3`}>
        <Sparkles
          size={compact ? 18 : 20}
          className="flex-shrink-0 text-amber-400 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm text-amber-100/90 ${compact ? "" : "leading-relaxed"}`}>
            {message}
          </p>
          <Link
            to="/plan"
            className="inline-block mt-2 text-sm font-medium text-white underline-offset-4 hover:underline"
            data-testid="plan-upgrade-link"
          >
            Ver planos e limites
          </Link>
        </div>
      </div>
    </div>
  );
}
