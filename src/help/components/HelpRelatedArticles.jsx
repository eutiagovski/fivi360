import { Link } from "react-router-dom";
import { getHelpCategory } from "@/help/content/categories";
import { helpArticlePath } from "@/help/utils/helpPaths";

/**
 * @param {{ articles: import("@/help/utils/createArticle").HelpArticle[] }} props
 */
export function HelpRelatedArticles({ articles }) {
  if (!articles?.length) {
    return null;
  }

  return (
    <section className="mt-12" data-testid="help-related-articles">
      <h2 className="mb-4 text-sm uppercase tracking-wider text-zinc-500">
        Artigos relacionados
      </h2>
      <ul className="space-y-2">
        {articles.map((article) => {
          const category = getHelpCategory(article.category);

          return (
            <li key={article.slug}>
              <Link
                to={helpArticlePath(article)}
                className="block rounded-2xl border border-zinc-800 px-4 py-3 transition-colors hover:border-zinc-600"
                data-testid={`help-related-${article.slug}`}
              >
                <p className="text-sm text-white">{article.title}</p>
                {category ? (
                  <p className="mt-1 text-xs text-zinc-500">{category.title}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
