import { isPlanLimitError } from "@/services/plans/planService";

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
