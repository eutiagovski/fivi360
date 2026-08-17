import { Link, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HELP_CATEGORIES } from "@/help/content/categories";
import { helpCategoryPath } from "@/help/utils/helpPaths";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function CategoryLinks({ activeSlug, onNavigate, className }) {
  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Categorias">
      {HELP_CATEGORIES.map((category) => {
        const active = category.slug === activeSlug;

        return (
          <Link
            key={category.slug}
            to={helpCategoryPath(category.slug)}
            onClick={onNavigate}
            data-testid={`help-nav-category-${category.slug}`}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-white text-black"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
            )}
          >
            {category.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function HelpCategoryNav() {
  const { categorySlug } = useParams();
  const [open, setOpen] = useState(false);
  const active = HELP_CATEGORIES.find((category) => category.slug === categorySlug);

  return (
    <div data-testid="help-category-nav">
      <div className="lg:hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-white"
            data-testid="help-nav-mobile-trigger"
          >
            {active?.title || "Categorias"}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-2">
            <CategoryLinks
              activeSlug={categorySlug}
              onNavigate={() => setOpen(false)}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      <aside className="hidden lg:block">
        <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
          Categorias
        </p>
        <CategoryLinks activeSlug={categorySlug} />
      </aside>
    </div>
  );
}
