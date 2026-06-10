/**
 * Ordenação por atividade recente: updatedAt DESC, fallback createdAt DESC.
 *
 * @param {{ updatedAt?: { toMillis?: () => number } | null, createdAt?: { toMillis?: () => number } | null }} item
 * @returns {number}
 */
export function getRecencyMillis(item) {
  return item.updatedAt?.toMillis?.() ?? item.createdAt?.toMillis?.() ?? 0;
}

/**
 * @param {typeof item} a
 * @param {typeof item} b
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
