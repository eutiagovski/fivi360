/**
 * Preferências de comunicação de marketing (RC-MARKETING-CONSENT-1).
 *
 * Persistência: `users/{uid}.marketingPreferences`
 * DTO público: datas como `Date | null` (nunca Timestamp).
 * `serverTimestamp()` permanece nos services callers.
 */

import { toAppDate } from "@/services/firebase/dates";

/** Versão do texto/consentimento de marketing nesta fase Beta. */
export const MARKETING_CONSENT_VERSION = "beta-2026-01";

/**
 * Default de aplicação para usuários antigos sem o campo
 * ou para leitura segura quando `marketingPreferences` é undefined.
 *
 * Ausência do campo ≠ consentimento. Marketing desabilitado por padrão.
 *
 * @type {Readonly<{
 *   enabled: false,
 *   productUpdates: false,
 *   offers: false,
 *   tips: false,
 *   newsletter: false,
 *   research: false,
 *   consentVersion: null,
 *   consentSource: null,
 *   consentedAt: null,
 *   revokedAt: null,
 *   updatedAt: null,
 * }>}
 */
export const DEFAULT_MARKETING_PREFERENCES = Object.freeze({
  enabled: false,
  productUpdates: false,
  offers: false,
  tips: false,
  newsletter: false,
  research: false,
  consentVersion: null,
  consentSource: null,
  consentedAt: null,
  revokedAt: null,
  updatedAt: null,
});

/**
 * @typedef {Object} MarketingPreferencesApp
 * @property {boolean} enabled
 * @property {boolean} productUpdates
 * @property {boolean} offers
 * @property {boolean} tips
 * @property {boolean} newsletter
 * @property {boolean} research
 * @property {string | null} consentVersion
 * @property {string | null} consentSource
 * @property {Date | null} consentedAt
 * @property {Date | null} revokedAt
 * @property {Date | null} updatedAt
 */

/**
 * Converte booleano do formulário nos flags persistidos (sem timestamps).
 *
 * - `productUpdates` e `tips` acompanham o checkbox.
 * - `offers`, `newsletter` e `research` permanecem false nesta versão.
 *
 * @param {{
 *   enabled?: boolean,
 *   consentSource?: string,
 * }} [options]
 * @returns {{
 *   enabled: boolean,
 *   productUpdates: boolean,
 *   offers: false,
 *   tips: boolean,
 *   newsletter: false,
 *   research: false,
 *   consentVersion: string,
 *   consentSource: string,
 * }}
 */
export function buildMarketingPreferencesFlags({
  enabled = false,
  consentSource = "signup",
} = {}) {
  const optedIn = enabled === true;

  return {
    enabled: optedIn,
    productUpdates: optedIn,
    offers: false,
    tips: optedIn,
    newsletter: false,
    research: false,
    consentVersion: MARKETING_CONSENT_VERSION,
    consentSource,
  };
}

/**
 * Monta o payload completo para escrita no Firestore.
 * O caller deve passar o sentinela de `serverTimestamp()` (nunca Date).
 *
 * @param {{
 *   enabled?: boolean,
 *   consentSource?: string,
 *   timestamp: unknown,
 * }} options
 * @returns {Record<string, unknown>}
 */
export function buildMarketingPreferencesPayload({
  enabled = false,
  consentSource = "signup",
  timestamp,
}) {
  const flags = buildMarketingPreferencesFlags({ enabled, consentSource });
  const optedIn = flags.enabled;

  return {
    ...flags,
    consentedAt: optedIn ? timestamp : null,
    revokedAt: null,
    updatedAt: timestamp,
  };
}

/**
 * Mapeia o campo bruto do Firestore para DTO da aplicação.
 * `undefined` / ausente → defaults seguros (sem consentimento).
 *
 * @param {unknown} raw
 * @returns {MarketingPreferencesApp}
 */
export function mapMarketingPreferences(raw) {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_MARKETING_PREFERENCES };
  }

  const source = /** @type {Record<string, unknown>} */ (raw);

  return {
    enabled: source.enabled === true,
    productUpdates: source.productUpdates === true,
    offers: source.offers === true,
    tips: source.tips === true,
    newsletter: source.newsletter === true,
    research: source.research === true,
    consentVersion:
      typeof source.consentVersion === "string" ? source.consentVersion : null,
    consentSource:
      typeof source.consentSource === "string" ? source.consentSource : null,
    consentedAt: toAppDate(source.consentedAt),
    revokedAt: toAppDate(source.revokedAt),
    updatedAt: toAppDate(source.updatedAt),
  };
}

/**
 * Resolve preferências para consumo na UI/hooks.
 * Ausência do campo nunca equivale a consentimento.
 *
 * @param {import("firebase/firestore").DocumentData | null | undefined} userData
 * @returns {MarketingPreferencesApp}
 */
export function resolveMarketingPreferences(userData) {
  return mapMarketingPreferences(userData?.marketingPreferences);
}
