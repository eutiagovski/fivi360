import { Link } from "react-router-dom";
import { HELP_CATEGORIES } from "@/help/content/categories";
import { getHelpArticlesByCategory } from "@/help/content/articles";
import { helpCategoryPath } from "@/help/utils/helpPaths";

export function HelpCategoryGrid() {
  return (
    <ul
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="help-category-grid"
    >
      {HELP_CATEGORIES.map((category) => {
        const count = getHelpArticlesByCategory(category.slug).length;

        return (
          <li key={category.slug}>
            <Link
              to={helpCategoryPath(category.slug)}
              data-testid={`help-category-card-${category.slug}`}
              className="block h-full rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900/40"
            >
              <h2 className="text-base font-medium text-white">{category.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {category.description}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
                {count} {count === 1 ? "artigo" : "artigos"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
