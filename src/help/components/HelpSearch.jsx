import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   id?: string,
 *   size?: "hero" | "compact",
 *   autoFocus?: boolean,
 *   className?: string,
 * }} props
 */
export function HelpSearch({
  value,
  onChange,
  id = "help-search",
  size = "compact",
  autoFocus = false,
  className,
}) {
  const isHero = size === "hero";

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        Buscar na Central de Ajuda
      </label>
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500",
          isHero ? "h-5 w-5" : "h-4 w-4",
        )}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Buscar artigos..."
        data-testid="help-search-input"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-500 transition-colors focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20",
          isHero ? "h-14 pl-12 pr-4 text-base sm:h-16 sm:text-lg" : "h-11 pl-11 pr-3 text-sm",
        )}
      />
    </div>
  );
}
