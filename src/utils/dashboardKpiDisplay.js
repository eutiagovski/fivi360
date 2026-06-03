import { isUnlimited } from "@/config/planLimits";

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

/**
 * Limite de contagem para KPIs do Dashboard (projetos / imagens).
 * null = ilimitado.
 *
 * @param {number | null} max
 * @returns {string}
 */
export function getDashboardCountLimitDisplay(max) {
  return isUnlimited(max) ? "ilimitado" : String(max);
}

/**
 * Uso atual de armazenamento no Dashboard, sempre em MB.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatDashboardStorageCurrent(bytes) {
  const mb = bytes / MB;

  if (bytes > 0 && mb < 1) {
    return `${mb.toFixed(1)} MB`;
  }

  return `${Math.round(mb)} MB`;
}

/**
 * Limite de armazenamento para KPI do Dashboard (sempre finito por plano).
 *
 * @param {number} maxStorageBytes
 * @returns {string}
 */
export function getDashboardStorageLimitDisplay(maxStorageBytes) {
  if (maxStorageBytes >= GB) {
    const gb = maxStorageBytes / GB;
    return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(2)} GB`;
  }

  return `${Math.round(maxStorageBytes / MB)} MB`;
}
