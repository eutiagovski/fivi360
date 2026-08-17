import { getHelpCategory } from "@/help/content/categories";
import { getListedHelpArticles } from "@/help/content/articles";

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeHelpQuery(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * @param {import("@/help/utils/createArticle").HelpArticle} article
 * @returns {string}
 */
function articleSearchText(article) {
  const category = getHelpCategory(article.category);
  const keywords = (article.keywords ?? []).join(" ");

  return [article.title, article.description, keywords, category?.title, category?.keywords?.join(" ")]
    .filter(Boolean)
    .join(" ");
}

/**
 * Busca local instantânea (title, description, keywords, category).
 *
 * @param {string} query
 * @param {{ articles?: import("@/help/utils/createArticle").HelpArticle[] }} [options]
 * @returns {import("@/help/utils/createArticle").HelpArticle[]}
 */
export function searchHelpArticles(query, options = {}) {
  const normalized = normalizeHelpQuery(query);

  if (!normalized) {
    return [];
  }

  const articles = options.articles ?? getListedHelpArticles();

  return articles.filter((article) =>
    normalizeHelpQuery(articleSearchText(article)).includes(normalized),
  );
}
