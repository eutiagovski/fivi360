/**
 * Ordenação por atividade recente: updatedAt DESC, fallback createdAt DESC.
 */

import { toMillis } from "@/services/firebase/dates";

/**
 * @param {{ updatedAt?: unknown, createdAt?: unknown }} item
 * @returns {number}
 */
export function getRecencyMillis(item) {
  const updated = toMillis(item.updatedAt);
  if (updated > 0) {
    return updated;
  }

  return toMillis(item.createdAt);
}

/**
 * @param {{ updatedAt?: unknown, createdAt?: unknown }} a
 * @param {{ updatedAt?: unknown, createdAt?: unknown }} b
 * @returns {number}
 */
export function compareByRecency(a, b) {
  return getRecencyMillis(b) - getRecencyMillis(a);
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function sortByRecency(items) {
  return [...items].sort(compareByRecency);
}
