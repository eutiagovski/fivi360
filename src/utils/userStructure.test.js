import {
  ENSURE_USER_STRUCTURE_FORBIDDEN_FIELDS,
  analyzeUserStructureGaps,
  buildWorkspaceIdRepairPatch,
} from "./userStructure";

describe("analyzeUserStructureGaps", () => {
  it("flags all docs when user is fully missing", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: false,
      userData: null,
      publicProfileExists: false,
      workspaceExists: false,
      memberExists: false,
    });

    expect(gaps).toEqual({
      needsUser: true,
      needsPublicProfile: true,
      needsWorkspace: true,
      needsMember: true,
      needsDefaultWorkspaceId: false,
      needsActiveWorkspaceId: false,
      needsServerWorkspaceIdRepair: false,
    });
  });

  it("flags missing publicProfiles without touching users", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: true,
      userData: {
        plan: "professional",
        billing: { subscriptionStatus: "active" },
        defaultWorkspaceId: "uid-1",
        activeWorkspaceId: "uid-1",
        legalConsent: { termsAccepted: true },
      },
      publicProfileExists: false,
      workspaceExists: true,
      memberExists: true,
    });

    expect(gaps.needsUser).toBe(false);
    expect(gaps.needsPublicProfile).toBe(true);
    expect(gaps.needsWorkspace).toBe(false);
    expect(gaps.needsMember).toBe(false);
    expect(gaps.needsServerWorkspaceIdRepair).toBe(false);
  });

  it("flags missing workspace and member", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: true,
      userData: {
        defaultWorkspaceId: "uid-1",
        activeWorkspaceId: "uid-1",
      },
      publicProfileExists: true,
      workspaceExists: false,
      memberExists: false,
    });

    expect(gaps.needsWorkspace).toBe(true);
    expect(gaps.needsMember).toBe(true);
  });

  it("flags missing activeWorkspaceId and defaultWorkspaceId for server repair", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: true,
      userData: { displayName: "Ana" },
      publicProfileExists: true,
      workspaceExists: true,
      memberExists: true,
    });

    expect(gaps.needsDefaultWorkspaceId).toBe(true);
    expect(gaps.needsActiveWorkspaceId).toBe(true);
    expect(gaps.needsServerWorkspaceIdRepair).toBe(true);
  });

  it("does not request server repair when legacy workspace ids already exist", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: true,
      userData: {
        defaultWorkspaceId: "legacy-ws",
        activeWorkspaceId: "legacy-ws",
      },
      publicProfileExists: true,
      workspaceExists: false,
      memberExists: false,
    });

    expect(gaps.needsServerWorkspaceIdRepair).toBe(false);
    expect(gaps.needsWorkspace).toBe(true);
    expect(gaps.needsMember).toBe(true);
  });

  it("publicProfiles exists and users missing still needs user create", () => {
    const gaps = analyzeUserStructureGaps({
      userId: "uid-1",
      userExists: false,
      publicProfileExists: true,
      workspaceExists: true,
      memberExists: true,
    });

    expect(gaps.needsUser).toBe(true);
    expect(gaps.needsPublicProfile).toBe(false);
  });
});

describe("buildWorkspaceIdRepairPatch", () => {
  it("repairs only missing workspace id fields", () => {
    expect(buildWorkspaceIdRepairPatch({}, "uid-1")).toEqual({
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
    });

    expect(
      buildWorkspaceIdRepairPatch({ defaultWorkspaceId: "uid-1" }, "uid-1"),
    ).toEqual({
      activeWorkspaceId: "uid-1",
    });
  });

  it("does not overwrite existing legacy workspace ids", () => {
    expect(
      buildWorkspaceIdRepairPatch(
        {
          defaultWorkspaceId: "legacy-ws",
          activeWorkspaceId: "legacy-ws",
          plan: "studio",
          billing: { planId: "studio" },
        },
        "uid-1",
      ),
    ).toBeNull();
  });

  it("never includes forbidden entitlement fields", () => {
    const patch = buildWorkspaceIdRepairPatch({}, "uid-1");

    for (const field of ENSURE_USER_STRUCTURE_FORBIDDEN_FIELDS) {
      expect(patch).not.toHaveProperty(field);
    }
  });
});
