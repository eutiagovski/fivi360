/**
 * Ordenação estável da galeria: createdAt DESC (edições não alteram a posição).
 */

import { toMillis } from "@/utils/imageRecencySort";

/**
 * @param {{ createdAt?: unknown }} item
 * @returns {number}
 */
export function getImageCreatedMillis(item) {
  return toMillis(item.createdAt);
}

/**
 * @param {typeof item} a
 * @param {typeof item} b
 * @returns {number}
 */
export function compareImagesByCreatedAt(a, b) {
  return getImageCreatedMillis(b) - getImageCreatedMillis(a);
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function sortImagesByCreatedAt(items) {
  return [...items].sort(compareImagesByCreatedAt);
}
