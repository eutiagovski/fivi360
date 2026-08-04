import { formatStorageBytes } from "@/config/planLimits";
import {
  getImageUploadBlockCode,
  getPlanLimitMessage,
  isPlanLimitError,
  PLAN_LIMIT_CODES,
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
 * Mensagem de storage com total selecionado e espaço disponível.
 *
 * @param {{ storageBytes: number }} usage
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {number} additionalBytes
 * @returns {string}
 */
function buildStorageLimitDescription(usage, limits, additionalBytes) {
  const availableBytes = Math.max(
    0,
    limits.maxStorageBytes - (usage.storageBytes ?? 0),
  );
  const selectedLabel = formatStorageBytes(additionalBytes);
  const availableLabel = formatStorageBytes(availableBytes);

  return `Este upload ultrapassa o limite de armazenamento disponível no seu plano. Selecionado: ${selectedLabel}. Disponível: ${availableLabel}. Libere espaço excluindo imagens ou faça upgrade para continuar.`;
}

/**
 * @param {import("@/config/planLimits").PlanLimits} limits
 * @param {{ imageCount: number, storageBytes: number }} usage
 * @param {number} additionalBytes — soma dos File.size originais selecionados
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

  const description =
    code === PLAN_LIMIT_CODES.STORAGE_LIMIT
      ? buildStorageLimitDescription(usage, limits, additionalBytes)
      : getPlanLimitMessage(code);

  toast({
    variant: "destructive",
    title: "Limite do plano",
    description,
  });

  return true;
}
