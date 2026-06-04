import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const VARIANT_STYLES = {
  primary: {
    base:
      "flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white",
    enabled: "btn-scale hover:bg-zinc-200",
  },
  secondary: {
    base:
      "flex items-center gap-2 px-6 py-3 border border-zinc-700 bg-zinc-800/40 text-zinc-300 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800/40 disabled:hover:text-zinc-300 disabled:hover:border-zinc-700",
    enabled:
      "btn-scale hover:bg-zinc-800/70 hover:text-white hover:border-zinc-600",
  },
};

/**
 * Botão de ação que permanece visível; quando `disabled`, exibe tooltip de limite.
 *
 * @param {{
 *   disabled?: boolean,
 *   limitTooltip?: string,
 *   onClick?: () => void,
 *   className?: string,
 *   variant?: 'primary' | 'secondary',
 *   children: React.ReactNode,
 *   dataTestId?: string,
 *   type?: 'button' | 'submit',
 * }} props
 */
export function PlanLimitButton({
  disabled = false,
  limitTooltip = "Limite do plano atingido",
  onClick,
  className = "",
  variant = "primary",
  children,
  dataTestId,
  type = "button",
}) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={`${styles.base} ${!disabled ? styles.enabled : ""} ${className}`}
    >
      {children}
    </button>
  );

  if (!disabled) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-zinc-800 text-white border border-zinc-700"
      >
        {limitTooltip}
      </TooltipContent>
    </Tooltip>
  );
}
