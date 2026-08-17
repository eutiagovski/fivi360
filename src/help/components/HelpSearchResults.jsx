import { Link } from "react-router-dom";
import { getHelpCategory } from "@/help/content/categories";
import { helpArticlePath } from "@/help/utils/helpPaths";

/**
 * @param {{
 *   query: string,
 *   results: import("@/help/utils/createArticle").HelpArticle[],
 *   onNavigate?: () => void,
 * }} props
 */
export function HelpSearchResults({ query, results, onNavigate }) {
  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  if (results.length === 0) {
    return (
      <p
        className="mt-4 text-sm text-zinc-500"
        data-testid="help-search-empty"
        role="status"
      >
        Não encontramos artigos para “{trimmed}”. Tente outras palavras ou
        navegue pelas categorias.
      </p>
    );
  }

  return (
    <ul
      className="mt-4 divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0c]"
      data-testid="help-search-results"
    >
      {results.map((article) => {
        const category = getHelpCategory(article.category);

        return (
          <li key={`${article.category}-${article.slug}`}>
            <Link
              to={helpArticlePath(article)}
              onClick={onNavigate}
              className="block px-4 py-4 transition-colors hover:bg-zinc-900/70 sm:px-5"
              data-testid={`help-search-result-${article.slug}`}
            >
              <p className="text-sm font-medium text-white">{article.title}</p>
              {category ? (
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  {category.title}
                </p>
              ) : null}
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                {article.description}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
