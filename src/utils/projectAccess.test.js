import {
  canUserAccessProjectInternally,
  logInternalProjectAccessDenied,
} from "./projectAccess";

const ownerId = "user-owner";
const otherId = "user-other";

const ownedProject = {
  id: "p1",
  userId: ownerId,
  workspaceId: ownerId,
  visibility: "public",
};

const foreignPublicProject = {
  id: "p2",
  userId: otherId,
  workspaceId: otherId,
  visibility: "public",
};

const foreignSharedProject = {
  id: "p3",
  userId: otherId,
  workspaceId: otherId,
  visibility: "shared",
};

const foreignPrivateProject = {
  id: "p4",
  userId: otherId,
  workspaceId: otherId,
  visibility: "private",
};

describe("canUserAccessProjectInternally — RC-SEC-PROJECT-PRIVATE-ROUTE-1", () => {
  it("allows project owner regardless of visibility", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: ownedProject,
      }),
    ).toBe(true);

    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: { ...ownedProject, visibility: "private" },
      }),
    ).toBe(true);
  });

  it("denies authenticated user without ownership for public project", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignPublicProject,
      }),
    ).toBe(false);
  });

  it("denies shared and private foreign projects", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignSharedProject,
      }),
    ).toBe(false);
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignPrivateProject,
      }),
    ).toBe(false);
  });

  it("denies when userId or project is missing", () => {
    expect(
      canUserAccessProjectInternally({
        userId: null,
        project: ownedProject,
      }),
    ).toBe(false);
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: null,
      }),
    ).toBe(false);
  });

  it("does not grant access from public visibility alone", () => {
    const result = canUserAccessProjectInternally({
      userId: ownerId,
      project: foreignPublicProject,
    });

    expect(result).toBe(false);
    expect(foreignPublicProject.visibility).toBe("public");
  });

  it("allows explicit authorized membership in project workspace (future)", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignPublicProject,
        membership: {
          userId: ownerId,
          workspaceId: otherId,
          role: "viewer",
        },
        activeWorkspaceId: otherId,
      }),
    ).toBe(true);
  });

  it("denies membership for unauthorized role", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignPublicProject,
        membership: {
          userId: ownerId,
          workspaceId: otherId,
          role: "guest",
        },
      }),
    ).toBe(false);
  });

  it("does not grant access from activeWorkspaceId alone", () => {
    expect(
      canUserAccessProjectInternally({
        userId: ownerId,
        project: foreignPublicProject,
        activeWorkspaceId: otherId,
      }),
    ).toBe(false);
  });
});

describe("logInternalProjectAccessDenied", () => {
  it("logs only in development without project payload", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    logInternalProjectAccessDenied("proj-1", "not_owner_or_member");

    expect(spy).toHaveBeenCalledWith(
      "[ProjectAccess] internal access denied",
      expect.objectContaining({
        projectId: "proj-1",
        reason: "not_owner_or_member",
      }),
    );

    process.env.NODE_ENV = prev;
    spy.mockRestore();
  });
});
