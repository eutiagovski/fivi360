import {
  AUDIT_REASONS,
  assertAuditEnvironment,
  evaluateOrphanSceneHotspot,
  formatMarkdownReport,
  parseAuditArgs,
  shouldExecuteWrites,
} from "@/utils/orphanSceneHotspotAudit";

function makeImages() {
  return new Map([
    [
      "img-a",
      {
        id: "img-a",
        userId: "user-1",
        projectId: "project-1",
      },
    ],
    [
      "img-b",
      {
        id: "img-b",
        userId: "user-1",
        projectId: "project-1",
      },
    ],
    [
      "img-other-project",
      {
        id: "img-other-project",
        userId: "user-1",
        projectId: "project-2",
      },
    ],
  ]);
}

describe("orphanSceneHotspotAudit", () => {
  it("23. detecta TARGET_IMAGE_NOT_FOUND", () => {
    const result = evaluateOrphanSceneHotspot({
      hotspotId: "hs-1",
      hotspot: { type: "scene", targetImageId: "missing", userId: "user-1" },
      sourceImageId: "img-a",
      sourceImage: makeImages().get("img-a"),
      imagesById: makeImages(),
    });

    expect(result.orphan).toBe(true);
    expect(result.reason).toBe(AUDIT_REASONS.TARGET_IMAGE_NOT_FOUND);
    expect(result.finding.sourceImageId).toBe("img-a");
    expect(result.finding.targetImageId).toBe("missing");
  });

  it("24. detecta TARGET_OUTSIDE_PROJECT", () => {
    const result = evaluateOrphanSceneHotspot({
      hotspotId: "hs-2",
      hotspot: {
        type: "scene",
        targetImageId: "img-other-project",
        projectId: "project-1",
      },
      sourceImageId: "img-a",
      sourceImage: makeImages().get("img-a"),
      imagesById: makeImages(),
    });

    expect(result.orphan).toBe(true);
    expect(result.reason).toBe(AUDIT_REASONS.TARGET_OUTSIDE_PROJECT);
  });

  it("25. preserva hotspot info (não marca como órfão)", () => {
    const result = evaluateOrphanSceneHotspot({
      hotspotId: "info-1",
      hotspot: {
        type: "info",
        title: "Janela",
        description: "Ok",
      },
      sourceImageId: "img-a",
      sourceImage: makeImages().get("img-a"),
      imagesById: makeImages(),
    });

    expect(result.orphan).toBe(false);
    expect(result.finding).toBeNull();
  });

  it("26. dry-run não executa writes", () => {
    expect(shouldExecuteWrites(parseAuditArgs([]))).toBe(false);
    expect(shouldExecuteWrites(parseAuditArgs(["--apply"]))).toBe(true);
  });

  it("27. relatório contém origem, destino e motivo", () => {
    const finding = evaluateOrphanSceneHotspot({
      hotspotId: "hs-1",
      hotspot: { type: "scene", targetImageId: "missing", userId: "user-1" },
      sourceImageId: "img-a",
      sourceImage: makeImages().get("img-a"),
      imagesById: makeImages(),
    }).finding;

    const md = formatMarkdownReport([finding], {
      generatedAt: "2026-01-01T00:00:00.000Z",
      firebaseProject: "demo",
      emulatorHost: "127.0.0.1:8080",
      mode: "read-only",
      scope: "project:project-1",
      writesExecuted: 0,
    });

    expect(md).toContain("hs-1");
    expect(md).toContain("img-a");
    expect(md).toContain("missing");
    expect(md).toContain("TARGET_IMAGE_NOT_FOUND");
    expect(md).toContain("Writes executed: 0");
  });

  it("bloqueia apply global e exige confirmação de projeto", () => {
    expect(() =>
      assertAuditEnvironment(
        parseAuditArgs([
          "--firebase-project=demo",
          "--allow-emulator",
          "--global",
          "--confirm-global",
          "--apply",
        ]),
        { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
      ),
    ).toThrow(/--project-id/);

    expect(() =>
      assertAuditEnvironment(
        parseAuditArgs([
          "--firebase-project=demo",
          "--allow-emulator",
          "--project-id=p1",
          "--apply",
          "--confirm-project-id=other",
        ]),
        { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
      ),
    ).toThrow(/confirm-project-id/);
  });

  it("exige clareza de ambiente emulator/produção", () => {
    expect(() =>
      assertAuditEnvironment(
        parseAuditArgs(["--firebase-project=demo", "--project-id=p1"]),
        { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
      ),
    ).toThrow(/allow-emulator/);

    expect(() =>
      assertAuditEnvironment(
        parseAuditArgs(["--firebase-project=demo", "--project-id=p1"]),
        {},
      ),
    ).toThrow(/allow-production/);
  });
});
