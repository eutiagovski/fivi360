/**
 * Defaults e normalização de embedSettings do projeto (RC-PROJECT-EMBED-1).
 */

import { toAppDate } from "@/services/firebase/dates";

/**
 * @typedef {Object} ProjectEmbedSettings
 * @property {boolean} enabled
 * @property {string | null} initialImageId
 * @property {boolean} allowFullscreen
 * @property {boolean} allowNavigation
 * @property {boolean} showBranding
 * @property {Date | null} updatedAt
 */

/**
 * @typedef {Object} PublicEmbedSettingsDTO
 * @property {boolean} enabled
 * @property {string | null} initialImageId
 * @property {boolean} allowFullscreen
 * @property {boolean} allowNavigation
 * @property {boolean} showBranding
 */

/** @type {Readonly<ProjectEmbedSettings>} */
export const DEFAULT_EMBED_SETTINGS = Object.freeze({
  enabled: false,
  initialImageId: null,
  allowFullscreen: true,
  allowNavigation: true,
  showBranding: true,
  updatedAt: null,
});

/**
 * Normaliza embedSettings do Firestore (ou ausência) para o DTO da app.
 * showBranding permanece sempre true nesta sprint.
 *
 * @param {unknown} raw
 * @returns {ProjectEmbedSettings}
 */
export function normalizeEmbedSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_EMBED_SETTINGS };
  }

  /** @type {Record<string, unknown>} */
  const data = raw;

  const initialImageId =
    typeof data.initialImageId === "string" && data.initialImageId.trim()
      ? data.initialImageId.trim()
      : null;

  return {
    enabled: data.enabled === true,
    initialImageId,
    allowFullscreen: data.allowFullscreen !== false,
    allowNavigation: data.allowNavigation !== false,
    showBranding: true,
    updatedAt: toAppDate(data.updatedAt),
  };
}

/**
 * Subconjunto público (sem updatedAt).
 *
 * @param {ProjectEmbedSettings} settings
 * @returns {PublicEmbedSettingsDTO}
 */
export function toPublicEmbedSettings(settings) {
  return {
    enabled: settings.enabled === true,
    initialImageId: settings.initialImageId ?? null,
    allowFullscreen: settings.allowFullscreen !== false,
    allowNavigation: settings.allowNavigation !== false,
    showBranding: true,
  };
}

/**
 * Resolve imagem inicial válida; fallback para a primeira da lista.
 *
 * @param {string | null | undefined} initialImageId
 * @param {{ id: string }[]} images
 * @returns {string | null}
 */
export function resolveInitialImageId(initialImageId, images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  if (
    typeof initialImageId === "string" &&
    initialImageId &&
    images.some((image) => image.id === initialImageId)
  ) {
    return initialImageId;
  }

  return images[0].id;
}
