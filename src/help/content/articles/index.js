import { COMPARTILHAMENTO_ARTICLES } from "@/help/content/articles/compartilhamento";
import { CONTA_ARTICLES } from "@/help/content/articles/conta";
import { HOTSPOTS_ARTICLES } from "@/help/content/articles/hotspots";
import { IMAGENS_360_ARTICLES } from "@/help/content/articles/imagens360";
import { INCORPORACAO_ARTICLES } from "@/help/content/articles/incorporacao";
import { PLANOS_ARTICLES } from "@/help/content/articles/planos";
import { PORTFOLIO_ARTICLES } from "@/help/content/articles/portfolio";
import { PRIMEIROS_PASSOS_ARTICLES } from "@/help/content/articles/primeirosPassos";
import { PROJETOS_ARTICLES } from "@/help/content/articles/projetos";
import { SOFTWARE_EXPORT_ARTICLES } from "@/help/content/articles/softwareExport";
import { HELP_CATEGORIES, getHelpCategory } from "@/help/content/categories";

export const HELP_ARTICLES = Object.freeze([
  ...PRIMEIROS_PASSOS_ARTICLES,
  ...PROJETOS_ARTICLES,
  ...IMAGENS_360_ARTICLES,
  ...SOFTWARE_EXPORT_ARTICLES,
  ...HOTSPOTS_ARTICLES,
  ...COMPARTILHAMENTO_ARTICLES,
  ...INCORPORACAO_ARTICLES,
  ...PORTFOLIO_ARTICLES,
  ...PLANOS_ARTICLES,
  ...CONTA_ARTICLES,
]);

const articlesBySlug = new Map(HELP_ARTICLES.map((article) => [article.slug, article]));

/**
 * @returns {readonly import("@/help/utils/createArticle").HelpArticle[]}
 */
export function getHelpArticles() {
  return HELP_ARTICLES;
}

/**
 * Artigos listados em home/categoria (exclui esqueletos de software).
 * @returns {import("@/help/utils/createArticle").HelpArticle[]}
 */
export function getListedHelpArticles() {
  return HELP_ARTICLES.filter((article) => article.listed !== false);
}

/**
 * @param {string} slug
 * @returns {import("@/help/utils/createArticle").HelpArticle | undefined}
 */
export function getHelpArticleBySlug(slug) {
  return articlesBySlug.get(slug);
}

/**
 * @param {string} categorySlug
 * @param {string} articleSlug
 * @returns {import("@/help/utils/createArticle").HelpArticle | undefined}
 */
export function getHelpArticle(categorySlug, articleSlug) {
  const article = getHelpArticleBySlug(articleSlug);

  if (!article || article.category !== categorySlug) {
    return undefined;
  }

  return article;
}

/**
 * @param {string} categorySlug
 * @param {{ includeUnlisted?: boolean }} [options]
 * @returns {import("@/help/utils/createArticle").HelpArticle[]}
 */
export function getHelpArticlesByCategory(categorySlug, options = {}) {
  return HELP_ARTICLES.filter((article) => {
    if (article.category !== categorySlug) {
      return false;
    }

    if (options.includeUnlisted) {
      return true;
    }

    return article.listed !== false;
  });
}

/**
 * @param {import("@/help/utils/createArticle").HelpArticle} article
 * @returns {import("@/help/utils/createArticle").HelpArticle[]}
 */
export function getRelatedHelpArticles(article) {
  if (!article?.relatedArticles?.length) {
    return [];
  }

  return article.relatedArticles
    .map((slug) => getHelpArticleBySlug(slug))
    .filter(Boolean);
}

export { HELP_CATEGORIES, getHelpCategory };
