import { HELP_CONTENT_UPDATED_AT } from "@/help/config/help";

/**
 * @typedef {{
 *   slug: string,
 *   category: string,
 *   title: string,
 *   description: string,
 *   keywords?: string[],
 *   updatedAt?: string,
 *   videoUrl?: string,
 *   status?: "published" | "coming-soon",
 *   listed?: boolean,
 *   blocks?: import("@/help/utils/helpBlocks").HelpBlock[],
 *   relatedArticles?: string[],
 * }} HelpArticle
 */

/**
 * @param {HelpArticle} article
 * @returns {HelpArticle}
 */
export function createArticle(article) {
  return {
    keywords: [],
    updatedAt: HELP_CONTENT_UPDATED_AT,
    videoUrl: "",
    status: "published",
    listed: true,
    blocks: [],
    relatedArticles: [],
    ...article,
  };
}
