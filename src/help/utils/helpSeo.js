import { HELP_SEO } from "@/help/config/help";
import { getHelpCategory } from "@/help/content/categories";

/**
 * @param {string} title
 * @returns {string}
 */
export function buildHelpPageTitle(title) {
  const trimmed = title?.trim();

  if (!trimmed) {
    return HELP_SEO.homeTitle;
  }

  if (trimmed.includes("FIVI360")) {
    return trimmed;
  }

  return `${trimmed}${HELP_SEO.titleSuffix}`;
}

/**
 * @param {import("@/help/utils/createArticle").HelpArticle} article
 * @returns {{ title: string, description: string }}
 */
export function buildHelpArticleSeo(article) {
  const category = getHelpCategory(article?.category);

  return {
    title: buildHelpPageTitle(article?.title),
    description:
      article?.description?.trim() ||
      category?.description ||
      HELP_SEO.homeDescription,
  };
}

/**
 * @param {{ title?: string, description?: string }} category
 * @returns {{ title: string, description: string }}
 */
export function buildHelpCategorySeo(category) {
  return {
    title: buildHelpPageTitle(category?.title),
    description: category?.description?.trim() || HELP_SEO.homeDescription,
  };
}
