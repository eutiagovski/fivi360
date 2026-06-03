import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DISABLED_BUTTON =
  "flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white";

/**
 * Botão de ação que permanece visível; quando `disabled`, exibe tooltip de limite.
 *
 * @param {{
 *   disabled?: boolean,
 *   limitTooltip?: string,
 *   onClick?: () => void,
 *   className?: string,
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
  children,
  dataTestId,
  type = "button",
}) {
  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={`${DISABLED_BUTTON} ${!disabled ? "btn-scale hover:bg-zinc-200" : ""} ${className}`}
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
