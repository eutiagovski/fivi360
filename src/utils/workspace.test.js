import {
  getPersonalWorkspaceId,
  getPersonalWorkspaceName,
  resolveWorkspaceId,
} from "./workspace";

describe("workspace utils", () => {
  it("uses uid as personal workspace id", () => {
    expect(getPersonalWorkspaceId("user-abc")).toBe("user-abc");
  });

  it("resolves activeWorkspaceId with fallback to uid", () => {
    expect(resolveWorkspaceId({ activeWorkspaceId: "ws-1" }, "user-abc")).toBe("ws-1");
    expect(resolveWorkspaceId({}, "user-abc")).toBe("user-abc");
    expect(resolveWorkspaceId(null, "user-abc")).toBe("user-abc");
  });

  it("builds personal workspace name from displayName", () => {
    expect(getPersonalWorkspaceName("Tiago")).toBe("Tiago");
    expect(getPersonalWorkspaceName("  ")).toBe("Meu workspace");
    expect(getPersonalWorkspaceName()).toBe("Meu workspace");
  });
});
