/**
 * Rastreamento de visualizações públicas do portfólio (GA4 + Firestore).
 *
 * GA4: apenas parâmetros agregados (sem IDs, slug ou URLs).
 * Firestore: incrementos atômicos em stats/{userId}/...
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
 * @param {string} ownerUserId
 * @param {string} projectId
 */
export function recordPublicProjectView(ownerUserId, projectId) {
  if (
    !ownerUserId ||
    !projectId ||
    !shouldRecordViewOnce(`public-project:${projectId}`)
  ) {
    return;
  }

  trackEvent("public_project_view", {
    source: "portfolio",
  });

  void incrementProjectViews(ownerUserId, projectId).catch(() => {});
}

/**
 * @param {string} ownerUserId
 * @param {string} imageId
 */
export function recordPublic360View(ownerUserId, imageId) {
  if (
    !ownerUserId ||
    !imageId ||
    !shouldRecordViewOnce(`public-360:${imageId}`)
  ) {
    return;
  }

  trackEvent("public_360_view", {
    source: "portfolio",
  });

  void incrementImageViews(ownerUserId, imageId).catch(() => {});
}
