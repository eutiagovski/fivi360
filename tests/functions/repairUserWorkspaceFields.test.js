/**
 * Testes da lógica de patch usada por repairUserWorkspaceFields (callable).
 * Espelha o comportamento do Admin SDK sem subir o runtime das Functions.
 */

function buildRepairPatch(userData, uid) {
  const defaultWorkspaceId =
    typeof userData?.defaultWorkspaceId === "string"
      ? userData.defaultWorkspaceId.trim()
      : "";
  const activeWorkspaceId =
    typeof userData?.activeWorkspaceId === "string"
      ? userData.activeWorkspaceId.trim()
      : "";

  /** @type {Record<string, string>} */
  const patch = {};

  if (!defaultWorkspaceId) {
    patch.defaultWorkspaceId = uid;
  }

  if (!activeWorkspaceId) {
    patch.activeWorkspaceId = defaultWorkspaceId || uid;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

describe("repairUserWorkspaceFields patch logic", () => {
  it("repairs missing defaultWorkspaceId and activeWorkspaceId", () => {
    expect(buildRepairPatch({}, "uid-1")).toEqual({
      defaultWorkspaceId: "uid-1",
      activeWorkspaceId: "uid-1",
    });
  });

  it("repairs only activeWorkspaceId when default exists", () => {
    expect(
      buildRepairPatch({ defaultWorkspaceId: "uid-1" }, "uid-1"),
    ).toEqual({
      activeWorkspaceId: "uid-1",
    });
  });

  it("does not overwrite existing workspace ids", () => {
    expect(
      buildRepairPatch(
        {
          defaultWorkspaceId: "existing-ws",
          activeWorkspaceId: "existing-ws",
          plan: "studio",
          billing: { planId: "studio" },
        },
        "uid-1",
      ),
    ).toBeNull();
  });

  it("never includes plan, billing or entitlements", () => {
    const patch = buildRepairPatch({}, "uid-1");
    expect(patch).not.toHaveProperty("plan");
    expect(patch).not.toHaveProperty("billing");
    expect(patch).not.toHaveProperty("portfolioAvailable");
    expect(patch).not.toHaveProperty("legalConsent");
  });
});
