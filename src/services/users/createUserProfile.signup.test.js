const mockCommit = jest.fn();
const mockBatchSet = jest.fn();
const mockWriteBatch = jest.fn();
const mockDoc = jest.fn((...segments) => ({
  path: segments.filter((s) => typeof s === "string").join("/"),
}));
const mockServerTimestamp = jest.fn(() => "SERVER_TIMESTAMP");
const mockEnqueueVerifyEmail = jest.fn();

jest.mock("firebase/firestore", () => {
  const batch = {
    set: (...args) => mockBatchSet(...args),
    commit: (...args) => mockCommit(...args),
  };

  return {
    doc: (...args) => mockDoc(...args),
    writeBatch: (...args) => {
      mockWriteBatch(...args);
      return batch;
    },
    serverTimestamp: (...args) => mockServerTimestamp(...args),
    getDoc: jest.fn(),
    runTransaction: jest.fn(),
    updateDoc: jest.fn(),
  };
});

jest.mock("../../config/firebase", () => ({
  db: { name: "mock-db" },
}));

jest.mock("../email/emailQueueService", () => ({
  enqueueVerifyEmail: (...args) => mockEnqueueVerifyEmail(...args),
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

const { createUserProfile } = require("./userService");

describe("createUserProfile — RC-BUG-001", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommit.mockResolvedValue(undefined);
    mockEnqueueVerifyEmail.mockResolvedValue("email-doc-1");
  });

  it("A — success: batch + enqueue with canonical email; does not shadow import", async () => {
    const result = await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
      acceptedSource: "signup",
      enqueueVerifyEmail: true,
    });

    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockEnqueueVerifyEmail).toHaveBeenCalledWith({
      to: "ana@example.com",
      userId: "uid-1",
      name: "Ana",
    });
    expect(result).toEqual({
      profileCreated: true,
      verificationEmailQueued: true,
      verificationEmailId: "email-doc-1",
    });

    const userPayload = mockBatchSet.mock.calls[0][1];
    expect(userPayload.marketingPreferences).toMatchObject({
      enabled: false,
      productUpdates: false,
      offers: false,
      tips: false,
      newsletter: false,
      research: false,
      consentVersion: "beta-2026-01",
      consentSource: "signup",
      consentedAt: null,
      revokedAt: null,
    });
    expect(userPayload.marketingPreferences.updatedAt).toBe(userPayload.createdAt);
  });

  it("RC-MARKETING-CONSENT-1 — opt-in persists enabled + consentedAt serverTimestamp", async () => {
    await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
      acceptedSource: "signup",
      marketingConsent: true,
      marketingConsentSource: "signup",
      enqueueVerifyEmail: false,
    });

    const userPayload = mockBatchSet.mock.calls[0][1];
    expect(userPayload.marketingPreferences.enabled).toBe(true);
    expect(userPayload.marketingPreferences.productUpdates).toBe(true);
    expect(userPayload.marketingPreferences.tips).toBe(true);
    expect(userPayload.marketingPreferences.offers).toBe(false);
    expect(userPayload.marketingPreferences.newsletter).toBe(false);
    expect(userPayload.marketingPreferences.research).toBe(false);
    expect(userPayload.marketingPreferences.consentedAt).toBe(userPayload.createdAt);
    expect(userPayload.marketingPreferences.updatedAt).toBe(userPayload.createdAt);
    expect(userPayload.marketingPreferences.consentSource).toBe("signup");
  });

  it("RC-MARKETING-CONSENT-1 — opt-out keeps consentedAt null", async () => {
    await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
      marketingConsent: false,
      enqueueVerifyEmail: false,
    });

    const userPayload = mockBatchSet.mock.calls[0][1];
    expect(userPayload.marketingPreferences.enabled).toBe(false);
    expect(userPayload.marketingPreferences.consentedAt).toBeNull();
    expect(userPayload.marketingPreferences.updatedAt).toBe(userPayload.createdAt);
  });

  it("B — casing: uses auth email as provided (caller must pass canonical)", async () => {
    await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "usuario@email.com",
      acceptedSource: "signup",
      enqueueVerifyEmail: true,
    });

    expect(mockEnqueueVerifyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "usuario@email.com" }),
    );
  });

  it("C — enqueue failure is not swallowed as success", async () => {
    const queueError = Object.assign(new Error("Missing or insufficient permissions."), {
      code: "permission-denied",
    });
    mockEnqueueVerifyEmail.mockRejectedValue(queueError);

    const result = await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
      acceptedSource: "signup",
      enqueueVerifyEmail: true,
    });

    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      profileCreated: true,
      verificationEmailQueued: false,
      errorCode: "verification-email-queue-failed",
      error: queueError,
    });
  });

  it("does not enqueue when flag is false", async () => {
    const result = await createUserProfile("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
      acceptedSource: "signup",
      enqueueVerifyEmail: false,
    });

    expect(mockEnqueueVerifyEmail).not.toHaveBeenCalled();
    expect(result).toEqual({
      profileCreated: true,
      verificationEmailQueued: false,
    });
  });

  it("rethrows batch failures", async () => {
    mockCommit.mockRejectedValue(Object.assign(new Error("denied"), {
      code: "permission-denied",
    }));

    await expect(
      createUserProfile("uid-1", {
        displayName: "Ana",
        email: "ana@example.com",
        enqueueVerifyEmail: true,
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });

    expect(mockEnqueueVerifyEmail).not.toHaveBeenCalled();
  });
});
