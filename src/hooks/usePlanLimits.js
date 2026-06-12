import { useCallback, useEffect, useState } from "react";
import { DEFAULT_USER_PLAN } from "@/config/billing";
import { getPlanLimits } from "@/config/planLimits";
import { useAuth } from "@/hooks/useAuth";
import {
  buildUsageStats,
  canCreateProject,
  canUploadImage,
  getUserPlanContext,
} from "@/services/plans/planService";
import { getUser } from "@/services/users/userService";
import { getCurrentPlan } from "@/services/billing/billingService";

/**
 * Carrega plano, limites e consumo do usuário autenticado.
 */
export function usePlanLimits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planId, setPlanId] = useState("starter");
  const [limits, setLimits] = useState(() => getPlanLimits("starter"));
  const [usage, setUsage] = useState({
    projectCount: 0,
    imageCount: 0,
    storageBytes: 0,
  });
  const [userPlan, setUserPlan] = useState(() => ({ ...DEFAULT_USER_PLAN }));

  const applyContext = useCallback((context) => {
    setPlanId(context.planId);
    setLimits(context.limits);
    setUsage(context.usage);
    setUserPlan(context.userPlan);
  }, []);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const context = await getUserPlanContext(user.uid);
      applyContext(context);
    } catch {
      setError("Não foi possível carregar informações do plano.");

      try {
        const profile = await getUser(user.uid);
        const normalizedPlan = getCurrentPlan(profile);
        const fallbackLimits = getPlanLimits(normalizedPlan.id);
        setPlanId(normalizedPlan.id);
        setLimits(fallbackLimits);
        setUserPlan(normalizedPlan);
      } catch {
        setError("Não foi possível carregar informações do plano.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, applyContext]);

  const refreshUsage = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const context = await getUserPlanContext(user.uid);
      applyContext(context);
    } catch {
      // Mantém estado local em caso de falha transitória.
    }
  }, [user?.uid, applyContext]);

  const applyUsageDelta = useCallback((delta) => {
    setUsage((current) => ({
      projectCount: Math.max(
        0,
        current.projectCount + (delta.projectCount ?? 0),
      ),
      imageCount: Math.max(0, current.imageCount + (delta.imageCount ?? 0)),
      storageBytes: Math.max(
        0,
        current.storageBytes + (delta.storageBytes ?? 0),
      ),
    }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usageStats = buildUsageStats(limits, usage);

  return {
    loading,
    error,
    planId,
    limits,
    usage,
    userPlan,
    usageStats,
    canCreateProject: canCreateProject(limits, usage),
    canUploadImage: canUploadImage(limits, usage),
    hotspotsEnabled: limits.hotspotsEnabled,
    publicPortfolioEnabled: limits.publicPortfolioEnabled,
    publicVisibilityEnabled: limits.publicVisibilityEnabled,
    refresh: load,
    refreshUsage,
    applyUsageDelta,
  };
}
