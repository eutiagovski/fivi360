/**
 * Ordenação de imagens por atividade recente: updatedAt DESC, fallback createdAt DESC.
 */

import { toMillis as toAppMillis } from "@/services/firebase/dates";

/**
 * @param {unknown} value
 * @returns {number}
 */
export function toMillis(value) {
  return toAppMillis(value);
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
