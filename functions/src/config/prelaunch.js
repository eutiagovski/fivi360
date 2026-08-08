/**
 * Configuração server-side da campanha de pré-lançamento.
 * Duplicado intencionalmente do frontend (sem package shared).
 *
 * @see src/landing-pages/access-early/config.js
 */

const ACCESS_EARLY_CAMPAIGN_ID = "prelaunch_2026";

/** @type {ReadonlySet<string>} */
const ALLOWED_PRELAUNCH_CAMPAIGNS = new Set([ACCESS_EARLY_CAMPAIGN_ID]);

const PRELAUNCH_FIELD_LIMITS = Object.freeze({
  name: 120,
  email: 254,
  phone: 40,
  phoneNormalized: 20,
  profession: 80,
  attributionValue: 200,
  referrer: 500,
  landingPath: 200,
});

module.exports = {
  ACCESS_EARLY_CAMPAIGN_ID,
  ALLOWED_PRELAUNCH_CAMPAIGNS,
  PRELAUNCH_FIELD_LIMITS,
};
