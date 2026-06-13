import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/services/analytics/analyticsService";

/**
 * Dispara page_view a cada mudança de rota (SPA).
 */
export function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path, document.title);
  }, [location]);

  return null;
}
