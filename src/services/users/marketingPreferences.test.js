/**
 * RC-MARKETING-CONSENT-1 — marketingPreferences builder / mapper
 */

const {
  DEFAULT_MARKETING_PREFERENCES,
  MARKETING_CONSENT_VERSION,
  buildMarketingPreferencesFlags,
  buildMarketingPreferencesPayload,
  mapMarketingPreferences,
  resolveMarketingPreferences,
} = require("./marketingPreferences");

describe("marketingPreferences — RC-MARKETING-CONSENT-1", () => {
  const TS = "SERVER_TIMESTAMP";

  describe("buildMarketingPreferencesPayload", () => {
    it("opt-in: enabled true, productUpdates/tips true, offers false, consentedAt set", () => {
      const payload = buildMarketingPreferencesPayload({
        enabled: true,
        consentSource: "signup",
        timestamp: TS,
      });

      expect(payload).toEqual({
        enabled: true,
        productUpdates: true,
        offers: false,
        tips: true,
        newsletter: false,
        research: false,
        consentVersion: MARKETING_CONSENT_VERSION,
        consentSource: "signup",
        consentedAt: TS,
        revokedAt: null,
        updatedAt: TS,
      });
    });

    it("opt-out: enabled false, consentedAt null, structure still present", () => {
      const payload = buildMarketingPreferencesPayload({
        enabled: false,
        consentSource: "signup",
        timestamp: TS,
      });

      expect(payload.enabled).toBe(false);
      expect(payload.productUpdates).toBe(false);
      expect(payload.tips).toBe(false);
      expect(payload.offers).toBe(false);
      expect(payload.newsletter).toBe(false);
      expect(payload.research).toBe(false);
      expect(payload.consentedAt).toBeNull();
      expect(payload.revokedAt).toBeNull();
      expect(payload.consentVersion).toBe(MARKETING_CONSENT_VERSION);
      expect(payload.consentSource).toBe("signup");
      expect(payload.updatedAt).toBe(TS);
    });

    it("google_signup_default never enables marketing", () => {
      const payload = buildMarketingPreferencesPayload({
        enabled: false,
        consentSource: "google_signup_default",
        timestamp: TS,
      });

      expect(payload.enabled).toBe(false);
      expect(payload.consentedAt).toBeNull();
      expect(payload.consentSource).toBe("google_signup_default");
    });

    it("timestamp sentinel is not converted to Date inside the builder", () => {
      const payload = buildMarketingPreferencesPayload({
        enabled: true,
        timestamp: TS,
      });
      expect(payload.consentedAt).toBe(TS);
      expect(payload.consentedAt instanceof Date).toBe(false);
    });

    it("flags helper mirrors checkbox without timestamps", () => {
      expect(buildMarketingPreferencesFlags({ enabled: true })).toEqual({
        enabled: true,
        productUpdates: true,
        offers: false,
        tips: true,
        newsletter: false,
        research: false,
        consentVersion: MARKETING_CONSENT_VERSION,
        consentSource: "signup",
      });
    });
  });

  describe("mapMarketingPreferences", () => {
    it("maps Firestore timestamps to Date | null", () => {
      const consentedAt = { toDate: () => new Date("2026-01-15T12:00:00.000Z") };
      const updatedAt = { toDate: () => new Date("2026-01-15T12:00:00.000Z") };

      const mapped = mapMarketingPreferences({
        enabled: true,
        productUpdates: true,
        offers: false,
        tips: true,
        newsletter: false,
        research: false,
        consentVersion: "beta-2026-01",
        consentSource: "signup",
        consentedAt,
        revokedAt: null,
        updatedAt,
      });

      expect(mapped.enabled).toBe(true);
      expect(mapped.consentedAt).toEqual(new Date("2026-01-15T12:00:00.000Z"));
      expect(mapped.revokedAt).toBeNull();
      expect(mapped.updatedAt).toEqual(new Date("2026-01-15T12:00:00.000Z"));
      expect(mapped.offers).toBe(false);
    });

    it("undefined / null raw yields safe defaults (never consent)", () => {
      expect(mapMarketingPreferences(undefined)).toEqual(DEFAULT_MARKETING_PREFERENCES);
      expect(mapMarketingPreferences(null)).toEqual(DEFAULT_MARKETING_PREFERENCES);
      expect(mapMarketingPreferences(undefined).enabled).toBe(false);
    });

    it("truthy-looking non-boolean flags stay false unless === true", () => {
      const mapped = mapMarketingPreferences({
        enabled: "yes",
        productUpdates: 1,
        offers: true,
        tips: false,
        newsletter: false,
        research: false,
        consentVersion: "beta-2026-01",
        consentSource: "signup",
        consentedAt: null,
        revokedAt: null,
        updatedAt: null,
      });

      expect(mapped.enabled).toBe(false);
      expect(mapped.productUpdates).toBe(false);
      expect(mapped.offers).toBe(true);
    });
  });

  describe("resolveMarketingPreferences", () => {
    it("missing field on user doc → defaults (legacy user)", () => {
      expect(resolveMarketingPreferences({})).toEqual(DEFAULT_MARKETING_PREFERENCES);
      expect(resolveMarketingPreferences({ displayName: "Ana" }).enabled).toBe(false);
    });

    it("present field is mapped", () => {
      const resolved = resolveMarketingPreferences({
        marketingPreferences: {
          enabled: true,
          productUpdates: true,
          offers: false,
          tips: true,
          newsletter: false,
          research: false,
          consentVersion: "beta-2026-01",
          consentSource: "signup",
          consentedAt: null,
          revokedAt: null,
          updatedAt: null,
        },
      });

      expect(resolved.enabled).toBe(true);
      expect(resolved.productUpdates).toBe(true);
      expect(resolved.offers).toBe(false);
    });
  });
});
