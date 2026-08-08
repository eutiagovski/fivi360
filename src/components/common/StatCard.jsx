import { getUsageVisualClasses } from "@/utils/planUsageAlerts";

export const StatCard = ({
  variant = "metric",
  icon,
  label,
  value,
  suffix,
  limitDisplay,
  dataTestId,
  current,
  limit,
  percentage,
  unlimited = false,
}) => {
  if (variant === "usage") {
    const { valueClassName, barClassName } = unlimited
      ? { valueClassName: "text-white", barClassName: "bg-white" }
      : getUsageVisualClasses(percentage);

    return (
      <div
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        data-testid={dataTestId}
      >
        <p className="text-sm text-zinc-400 mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-light tabular-nums ${valueClassName}`}>
            {current}
          </span>
          <span className="text-sm text-zinc-500">{limit}</span>
        </div>
        {!unlimited && (
          <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${barClassName}`}
              style={{ width: `${Math.min(100, percentage ?? 0)}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (variant === "metricUsage") {
    return (
      <div
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        data-testid={dataTestId}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-800 rounded-xl">{icon}</div>
          <span className="text-sm text-zinc-400">{label}</span>
        </div>
        <div className="flex items-baseline flex-wrap gap-x-1">
          <span className="text-4xl font-light tabular-nums text-white">
            {value}
          </span>
          {limitDisplay != null && limitDisplay !== "" && (
            <span className="text-base font-light tabular-nums text-zinc-500">
              {" / "}
              {limitDisplay}
            </span>
          )}
          {suffix && (
            <span className="text-base font-light text-zinc-500 ml-2">{suffix}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
      data-testid={dataTestId}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-zinc-800 rounded-xl">{icon}</div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="text-4xl font-light text-white">
        {value}
        {suffix && (
          <span className="text-xl text-zinc-400 ml-2">{suffix}</span>
        )}
      </div>
      
    </div>
  );
};
