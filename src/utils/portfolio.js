import { getPlanLimits } from "@/config/planLimits";

/**
 * Calcula `portfolioAvailable` a partir de `portfolioEnabled` e `users.plan`.
 *
 * @param {boolean | undefined} portfolioEnabled
 * @param {import("@/config/planLimits").UserPlanRaw} plan
 * @returns {boolean}
 */
export function computePortfolioAvailable(portfolioEnabled, plan) {
  if (portfolioEnabled !== true) {
    return false;
  }

  return getPlanLimits(plan).publicPortfolioEnabled;
}

/**
 * Verifica disponibilidade do portfólio público a partir de `users/{uid}` + plano.
 * Usado ao persistir `publicProfiles/{uid}.portfolioAvailable`.
 *
 * @param {import("firebase/firestore").DocumentData | null | undefined} data
 * @returns {boolean}
 */
export function isPortfolioPubliclyAvailableFromUserData(data) {
  return computePortfolioAvailable(data?.portfolioEnabled, data?.plan);
}

/**
 * Indica se o portfólio público (/u/:slug) deve exibir dados e projetos.
 *
 * @param {{ portfolioAvailable?: boolean } | null | undefined} profile
 * @returns {boolean}
 */
export function isPortfolioPubliclyAvailable(profile) {
  return profile?.portfolioAvailable === true;
}
