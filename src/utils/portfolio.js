/**
 * Indica se o portfólio público (/u/:slug) deve exibir dados e projetos.
 *
 * @param {{ portfolioEnabled?: boolean } | null | undefined} profile
 * @returns {boolean}
 */
export function isPortfolioPubliclyAvailable(profile) {
  return profile?.portfolioEnabled === true;
}
