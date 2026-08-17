import { HELP_BASE_PATH } from "@/help/config/help";

/**
 * @param {string} [path]
 * @returns {string}
 */
export function helpHomePath() {
  return HELP_BASE_PATH;
}

/**
 * @param {string} categorySlug
 * @returns {string}
 */
export function helpCategoryPath(categorySlug) {
  return `${HELP_BASE_PATH}/${categorySlug}`;
}

/**
 * @param {{ category: string, slug: string } | string} articleOrSlug
 * @param {string} [categorySlug]
 * @returns {string}
 */
export function helpArticlePath(articleOrSlug, categorySlug) {
  if (typeof articleOrSlug === "string") {
    return `${HELP_BASE_PATH}/${categorySlug}/${articleOrSlug}`;
  }

  return `${HELP_BASE_PATH}/${articleOrSlug.category}/${articleOrSlug.slug}`;
}
