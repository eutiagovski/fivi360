/**
 * Rastreamento de visualizações públicas do portfólio (GA4 + Firestore).
 *
 * GA4: apenas parâmetros agregados (sem IDs, slug ou URLs).
 * Firestore: incrementos atômicos nas coleções de stats.
 */

import { trackEvent } from "@/services/analytics/analyticsService";
import { shouldRecordViewOnce } from "@/utils/recordViewOnce";
import {
  incrementImageViews,
  incrementPortfolioViews,
  incrementProjectViews,
} from "@/services/stats/publicStatsService";

/**
 * @param {string} ownerUserId
 * @param {boolean} authenticated
 */
export function recordPortfolioView(ownerUserId, authenticated) {
  if (!ownerUserId || !shouldRecordViewOnce(`portfolio:${ownerUserId}`)) {
    return;
  }

  trackEvent("portfolio_view", {
    authenticated: Boolean(authenticated),
  });

  void incrementPortfolioViews(ownerUserId).catch(() => {
    // Falha silenciosa — stats nunca devem quebrar a página pública.
  });
}

/**
 * @param {string} projectId
 */
export function recordPublicProjectView(projectId) {
  if (!projectId || !shouldRecordViewOnce(`public-project:${projectId}`)) {
    return;
  }

  trackEvent("public_project_view", {
    source: "portfolio",
  });

  void incrementProjectViews(projectId).catch(() => {});
}

/**
 * @param {string} imageId
 */
export function recordPublic360View(imageId) {
  if (!imageId || !shouldRecordViewOnce(`public-360:${imageId}`)) {
    return;
  }

  trackEvent("public_360_view", {
    source: "portfolio",
  });

  void incrementImageViews(imageId).catch(() => {});
}
