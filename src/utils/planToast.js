import {
  getImageUploadBlockCode,
  getPlanLimitMessage,
  isPlanLimitError,
} from "@/services/plans/planService";

/**
 * @param {unknown} error
 * @param {import("@/hooks/use-toast").ToastFn} toast
 * @returns {boolean} true se o erro foi tratado
 */
export function showPlanLimitToast(error, toast) {
  if (!isPlanLimitError(error)) {
    return false;
  }

  toast({
    variant: "destructive",
    title: "Limite do plano",
    description: error.message,
  });

  return true;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ imageCount: number, storageBytes: number }} usage
 * @param {number} additionalBytes
 * @param {import("@/hooks/use-toast").ToastFn} toast
 * @returns {boolean} true se o upload deve ser bloqueado
 */
export function showImageUploadBlockedToast(
  limits,
  usage,
  additionalBytes,
  toast,
) {
  const code = getImageUploadBlockCode(limits, usage, additionalBytes);
  if (!code) {
    return false;
  }

  toast({
    variant: "destructive",
    title: "Limite do plano",
    description: getPlanLimitMessage(code),
  });

  return true;
}
