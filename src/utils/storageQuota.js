/**
 * Storage quota helpers — commercial usage vs physical storage.
 *
 * Commercial quota (`originalSizeBytes`) is the selected File.size before
 * compression/conversion. Physical size (`storedSizeBytes` / legacy `sizeBytes`)
 * is the WebP blob actually written to Firebase Storage.
 *
 * @see docs/RC-STORAGE-QUOTA-ORIGINAL-SIZE-1.md
 */

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isNonNegativeFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Bytes billed against the plan storage limit.
 *
 * Fallback (legacy docs without originalSizeBytes):
 * originalSizeBytes → sizeBytes → storedSizeBytes → 0
 *
 * Pre-RC docs stored compressed size in `sizeBytes`. Using that as fallback
 * understates commercial usage for old images — acceptable until Beta wipe.
 *
 * @param {{ originalSizeBytes?: number | null, sizeBytes?: number | null, storedSizeBytes?: number | null } | null | undefined} imageOrData
 * @returns {number}
 */
export function getQuotaSizeBytes(imageOrData) {
  if (!imageOrData) {
    return 0;
  }

  if (isNonNegativeFiniteNumber(imageOrData.originalSizeBytes)) {
    return imageOrData.originalSizeBytes;
  }

  if (isNonNegativeFiniteNumber(imageOrData.sizeBytes)) {
    return imageOrData.sizeBytes;
  }

  if (isNonNegativeFiniteNumber(imageOrData.storedSizeBytes)) {
    return imageOrData.storedSizeBytes;
  }

  return 0;
}

/**
 * Physical bytes persisted in Storage for this image.
 *
 * Today each image has a single WebP object (previewUrl === originalUrl).
 * `storedSizeBytes` is that object size (preference A until multi-file
 * artifacts are produced). Prefer B (sum of all paths) when available.
 *
 * Fallback: storedSizeBytes → sizeBytes → 0
 *
 * @param {{ storedSizeBytes?: number | null, sizeBytes?: number | null } | null | undefined} imageOrData
 * @returns {number}
 */
export function getStoredSizeBytes(imageOrData) {
  if (!imageOrData) {
    return 0;
  }

  if (isNonNegativeFiniteNumber(imageOrData.storedSizeBytes)) {
    return imageOrData.storedSizeBytes;
  }

  if (isNonNegativeFiniteNumber(imageOrData.sizeBytes)) {
    return imageOrData.sizeBytes;
  }

  return 0;
}
