import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { helpCategoryPath, helpHomePath } from "@/help/utils/helpPaths";

/**
 * @param {{
 *   category?: { slug: string, title: string },
 *   articleTitle?: string,
 * }} props
 */
export function HelpBreadcrumb({ category, articleTitle }) {
  const items = [
    { label: "Central de Ajuda", to: helpHomePath() },
    category
      ? { label: category.title, to: helpCategoryPath(category.slug) }
      : null,
    articleTitle ? { label: articleTitle, to: null } : null,
  ].filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="min-w-0"
      data-testid="help-breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
              ) : null}
              <li className="min-w-0">
                {last || !item.to ? (
                  <span className="truncate text-zinc-300" aria-current={last ? "page" : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="truncate transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
