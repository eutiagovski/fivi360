import { getPlanLimits } from "@/config/planLimits";

/**
 * Verifica disponibilidade do portfólio público a partir do documento `users/{uid}`.
 * Respeita `portfolioEnabled` e os limites do plano efetivo (Starter bloqueia).
 *
 * @param {import("firebase/firestore").DocumentData | null | undefined} data
 * @returns {boolean}
 */
export function isPortfolioPubliclyAvailableFromUserData(data) {
  if (data?.portfolioEnabled !== true) {
    return false;
  }

  return getPlanLimits(data?.plan).publicPortfolioEnabled;
}

/**
 * Indica se o portfólio público (/u/:slug) deve exibir dados e projetos.
 * Prefira `portfolioAvailable` em `PublicUserProfile` (inclui checagem de plano).
 *
 * @param {{ portfolioEnabled?: boolean } | null | undefined} profile
 * @returns {boolean}
 */
export function isPortfolioPubliclyAvailable(profile) {
  return profile?.portfolioEnabled === true;
}
