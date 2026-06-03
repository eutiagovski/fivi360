import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const UPGRADE_PATH = "/plan";

/**
 * Aviso reutilizável com CTA de upgrade (sem cobrança — redireciona para /plan).
 *
 * @param {{
 *   message: string,
 *   secondaryMessage?: string,
 *   className?: string,
 *   compact?: boolean,
 *   showUpgradeButton?: boolean,
 *   upgradeLabel?: string,
 *   onUpgrade?: () => void,
 *   title?: string,
 *   dataTestId?: string,
 *   variant?: 'default' | 'warning' | 'limit',
 * }} props
 */
export function UpgradePrompt({
  title,
  message,
  secondaryMessage,
  className = "",
  dataTestId = "upgrade-prompt",
  compact = false,
  showUpgradeButton = true,
  upgradeLabel = "Fazer Upgrade",
  onUpgrade,
  variant = "default",
}) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    navigate(UPGRADE_PATH);
  };

  const variantStyles = {
    default: "border-amber-500/30 bg-amber-500/10",
    warning: "border-amber-500/40 bg-amber-500/15",
    limit: "border-red-500/30 bg-red-500/10",
  };

  const iconColor =
    variant === "limit" ? "text-red-400" : "text-amber-400";
  const textColor =
    variant === "limit" ? "text-red-100/90" : "text-amber-100/90";

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${variantStyles[variant] ?? variantStyles.default} ${className}`}
      data-testid={dataTestId}
    >
      <div
        className={`flex ${compact ? "flex-row items-center gap-3" : "flex-col sm:flex-row sm:items-start gap-3"}`}
      >
        <Sparkles
          size={compact ? 18 : 20}
          className={`flex-shrink-0 ${iconColor} ${compact ? "" : "mt-0.5"}`}
        />
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`text-sm font-medium mb-1 ${iconColor}`}>{title}</p>
          )}
          <p className={`text-sm ${textColor} ${compact ? "" : "leading-relaxed"}`}>
            {message}
          </p>
          {secondaryMessage && (
            <p className={`text-sm mt-1 ${compact ? "text-zinc-400" : textColor}`}>
              {secondaryMessage}
            </p>
          )}
        </div>
        {showUpgradeButton && (
          <button
            type="button"
            onClick={handleUpgrade}
            data-testid="upgrade-prompt-cta"
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium btn-scale transition-colors ${
              variant === "limit"
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {upgradeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
