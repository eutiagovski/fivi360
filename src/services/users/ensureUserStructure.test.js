const mockGetDoc = jest.fn();
const mockCommit = jest.fn();
const mockBatchSet = jest.fn();
const mockWriteBatch = jest.fn();
const mockDoc = jest.fn((...segments) => ({
  path: segments.filter((s) => typeof s === "string").join("/"),
}));
const mockServerTimestamp = jest.fn(() => "SERVER_TIMESTAMP");
const mockRepairUserWorkspaceFields = jest.fn();

jest.mock("firebase/firestore", () => {
  const batch = {
    set: (...args) => mockBatchSet(...args),
    commit: (...args) => mockCommit(...args),
  };

  return {
    doc: (...args) => mockDoc(...args),
    getDoc: (...args) => mockGetDoc(...args),
    writeBatch: (...args) => {
      mockWriteBatch(...args);
      return batch;
    },
    serverTimestamp: (...args) => mockServerTimestamp(...args),
  };
});

jest.mock("@/config/firebase", () => ({
  db: { name: "mock-db" },
}));

jest.mock("@/services/users/repairUserWorkspaceFields", () => ({
  repairUserWorkspaceFields: (...args) => mockRepairUserWorkspaceFields(...args),
}));

const { ensureUserStructure } = require("./ensureUserStructure");

function snap(exists, data = {}) {
  return {
    exists: () => exists,
    data: () => data,
  };
}

describe("ensureUserStructure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommit.mockResolvedValue(undefined);
    mockRepairUserWorkspaceFields.mockResolvedValue({
      repaired: true,
      fields: ["workspaces", "workspaces/members"],
    });
  });

  it("creates missing users and publicProfiles without legalConsent, then repairs workspace via callable", async () => {
    mockGetDoc
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(
        snap(true, {
          displayName: "Ana",
          email: "ana@example.com",
          plan: "starter",
          defaultWorkspaceId: "uid-1",
          activeWorkspaceId: "uid-1",
        }),
      );

    const result = await ensureUserStructure("uid-1", {
      displayName: "Ana",
      email: "ana@example.com",
    });

    expect(result.repaired).toEqual(
      expect.arrayContaining([
        "users",
        "publicProfiles",
        "workspaces",
        "workspaces/members",
      ]),
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockRepairUserWorkspaceFields).toHaveBeenCalledTimes(1);

    const userPayload = mockBatchSet.mock.calls[0][1];
    expect(userPayload.plan).toBe("starter");
    expect(userPayload).not.toHaveProperty("legalConsent");
    expect(userPayload.defaultWorkspaceId).toBe("uid-1");

    const publicPayload = mockBatchSet.mock.calls[1][1];
    expect(publicPayload.portfolioAvailable).toBe(false);
    expect(publicPayload.slug).toBe("");
  });

  it("does not overwrite existing users when only publicProfiles is missing", async () => {
    const existingUser = {
      displayName: "Ana",
      email: "ana@example.com",
      plan: "professional",
      billing: { subscriptionStatus: "active", planId: "professional" },
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
      legalConsent: { termsAccepted: true },
    };

    mockGetDoc
      .mockResolvedValueOnce(snap(true, existingUser))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(true, { ownerId: "uid-1" }))
      .mockResolvedValueOnce(snap(true, { userId: "uid-1" }))
      .mockResolvedValueOnce(snap(true, existingUser));

    mockRepairUserWorkspaceFields.mockResolvedValue({ repaired: false, fields: [] });

    const result = await ensureUserStructure("uid-1");

    expect(result.repaired).toEqual(["publicProfiles"]);
    expect(mockBatchSet).toHaveBeenCalledTimes(1);

    const publicPayload = mockBatchSet.mock.calls[0][1];
    expect(publicPayload.portfolioAvailable).toBe(false);
    expect(publicPayload.displayName).toBe("Ana");
  });

  it("repairs missing workspace and member via callable without rewriting users", async () => {
    const existingUser = {
      displayName: "Ana",
      plan: "studio",
      billing: { planId: "studio" },
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
    };

    mockGetDoc
      .mockResolvedValueOnce(snap(true, existingUser))
      .mockResolvedValueOnce(snap(true, { uid: "uid-1", slug: "ana" }))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(true, existingUser));

    const result = await ensureUserStructure("uid-1");

    expect(mockRepairUserWorkspaceFields).toHaveBeenCalledTimes(1);
    expect(result.repaired).toEqual(
      expect.arrayContaining(["workspaces", "workspaces/members"]),
    );
    expect(mockBatchSet).not.toHaveBeenCalled();
  });

  it("calls server repair when workspace ids are missing and does not alter plan", async () => {
    const existingUser = {
      displayName: "Ana",
      plan: "professional",
      billing: { planId: "professional" },
    };

    mockGetDoc
      .mockResolvedValueOnce(snap(true, existingUser))
      .mockResolvedValueOnce(snap(true, { uid: "uid-1" }))
      .mockResolvedValueOnce(snap(true, { ownerId: "uid-1" }))
      .mockResolvedValueOnce(snap(true, { userId: "uid-1" }))
      .mockResolvedValueOnce(
        snap(true, {
          ...existingUser,
          defaultWorkspaceId: "uid-1",
          activeWorkspaceId: "uid-1",
        }),
      );

    mockRepairUserWorkspaceFields.mockResolvedValue({
      repaired: true,
      fields: ["users.workspaceIds"],
    });

    const result = await ensureUserStructure("uid-1");

    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockRepairUserWorkspaceFields).toHaveBeenCalledTimes(1);
    expect(result.repaired).toEqual(["users.workspaceIds"]);
    expect(result.profile.plan).toBe("professional");
  });

  it("is idempotent when structure is complete", async () => {
    const existingUser = {
      displayName: "Ana",
      plan: "starter",
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
    };

    mockGetDoc
      .mockResolvedValueOnce(snap(true, existingUser))
      .mockResolvedValueOnce(snap(true, { uid: "uid-1", slug: "ana", portfolioAvailable: true }))
      .mockResolvedValueOnce(snap(true, { ownerId: "uid-1", planId: "professional" }))
      .mockResolvedValueOnce(snap(true, { userId: "uid-1" }))
      .mockResolvedValueOnce(snap(true, existingUser));

    const result = await ensureUserStructure("uid-1");

    expect(result.repaired).toEqual([]);
    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockRepairUserWorkspaceFields).not.toHaveBeenCalled();
  });

  it("does not promote portfolioAvailable on publicProfiles create", async () => {
    mockGetDoc
      .mockResolvedValueOnce(
        snap(true, {
          displayName: "Ana",
          defaultWorkspaceId: "uid-1",
          activeWorkspaceId: "uid-1",
        }),
      )
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(true, { ownerId: "uid-1" }))
      .mockResolvedValueOnce(snap(true, { userId: "uid-1" }))
      .mockResolvedValueOnce(
        snap(true, {
          displayName: "Ana",
          defaultWorkspaceId: "uid-1",
          activeWorkspaceId: "uid-1",
        }),
      );

    mockRepairUserWorkspaceFields.mockResolvedValue({ repaired: false, fields: [] });

    await ensureUserStructure("uid-1");

    const publicPayload = mockBatchSet.mock.calls[0][1];
    expect(publicPayload.portfolioAvailable).toBe(false);
  });

  it("falls back to client workspace create when callable fails and docs are confirmed missing", async () => {
    const existingUser = {
      displayName: "Ana",
      plan: "starter",
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
    };

    mockGetDoc
      .mockResolvedValueOnce(snap(true, existingUser))
      .mockResolvedValueOnce(snap(true, { uid: "uid-1" }))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(false))
      .mockResolvedValueOnce(snap(true, existingUser));

    mockRepairUserWorkspaceFields.mockRejectedValue(new Error("not deployed"));

    const result = await ensureUserStructure("uid-1");

    expect(result.repaired).toEqual(
      expect.arrayContaining(["workspaces", "workspaces/members"]),
    );
    expect(mockBatchSet).toHaveBeenCalledTimes(2);
  });
});
