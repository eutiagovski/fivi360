/**
 * Ordenação de imagens por atividade recente: updatedAt DESC, fallback createdAt DESC.
 */

/**
 * @param {unknown} value
 * @returns {number}
 */
export function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return new Date(value).getTime() || 0;
}

/**
 * @param {{ updatedAt?: unknown, createdAt?: unknown }} item
 * @returns {number}
 */
export function getImageRecencyMillis(item) {
  return toMillis(item.updatedAt || item.createdAt);
}

/**
 * @param {typeof item} a
 * @param {typeof item} b
 * @returns {number}
 */
export function compareImagesByRecency(a, b) {
  return getImageRecencyMillis(b) - getImageRecencyMillis(a);
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function sortImagesByRecency(items) {
  return [...items].sort(compareImagesByRecency);
}
