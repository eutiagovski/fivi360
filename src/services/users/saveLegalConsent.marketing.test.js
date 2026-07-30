/**
 * RC-MARKETING-CONSENT-GOOGLE-1 — saveLegalConsent + marketingPreferences
 */

const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn((...segments) => ({
  path: segments.filter((s) => typeof s === "string").join("/"),
}));

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  getDoc: jest.fn(),
  writeBatch: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  db: { name: "mock-db" },
}));

jest.mock("../email/emailQueueService", () => ({
  enqueueVerifyEmail: jest.fn(),
  enqueueWelcomeEmail: jest.fn(),
}));

jest.mock("../workspaces/workspaceService", () => ({
  getPersonalWorkspaceRefs: (userId) => ({
    workspaceId: userId,
    workspaceRef: { path: `workspaces/${userId}` },
    memberRef: { path: `workspaces/${userId}/members/${userId}` },
  }),
  buildPersonalWorkspacePayload: () => ({ type: "workspace" }),
  buildPersonalWorkspaceMemberPayload: () => ({ type: "member" }),
}));

jest.mock("../slugs/slugService", () => ({
  checkSlugAvailability: jest.fn(),
  resolveSlugToUid: jest.fn(),
  SlugTakenError: class SlugTakenError extends Error {},
  SlugValidationError: class SlugValidationError extends Error {},
  syncSlugRegistryInTransaction: jest.fn(),
}));

jest.mock("../plans/planService", () => ({
  assertPublicPortfolioEnabled: jest.fn(),
}));

jest.mock("./syncPublicPortfolioAvailability", () => ({
  syncPublicPortfolioAvailability: jest.fn(),
}));

const { serverTimestamp } = require("firebase/firestore");
const { saveLegalConsent } = require("./userService");

describe("saveLegalConsent — RC-MARKETING-CONSENT-GOOGLE-1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serverTimestamp.mockReturnValue("SERVER_TIMESTAMP");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("without marketing option only updates legalConsent", async () => {
    await saveLegalConsent("uid-1", "modal_existing_user");

    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.legalConsent).toMatchObject({
      termsAccepted: true,
      acceptedSource: "modal_existing_user",
    });
    expect(payload.updatedAt).toBe("SERVER_TIMESTAMP");
    expect(payload).not.toHaveProperty("marketingPreferences");
  });

  it("opt-in persists enabled true with google_terms_modal", async () => {
    await saveLegalConsent("uid-1", "modal_existing_user", {
      marketingConsent: true,
      marketingConsentSource: "google_terms_modal",
    });

    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.marketingPreferences).toMatchObject({
      enabled: true,
      productUpdates: true,
      offers: false,
      tips: true,
      newsletter: false,
      research: false,
      consentVersion: "beta-2026-01",
      consentSource: "google_terms_modal",
      revokedAt: null,
    });
    expect(payload.marketingPreferences.consentedAt).toBe("SERVER_TIMESTAMP");
    expect(payload.marketingPreferences.updatedAt).toBe("SERVER_TIMESTAMP");
  });

  it("opt-out persists enabled false with google_terms_modal and null consentedAt", async () => {
    await saveLegalConsent("uid-1", "modal_existing_user", {
      marketingConsent: false,
      marketingConsentSource: "google_terms_modal",
    });

    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.marketingPreferences).toMatchObject({
      enabled: false,
      productUpdates: false,
      tips: false,
      offers: false,
      consentSource: "google_terms_modal",
      consentedAt: null,
    });
    expect(payload.marketingPreferences.updatedAt).toBe("SERVER_TIMESTAMP");
  });
});
