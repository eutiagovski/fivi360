import {
  SCENE_HOTSPOT_CONTEXT,
  SCENE_HOTSPOT_TARGET_REASON,
  buildAvailableSceneTargetMap,
  evaluateSceneHotspotNavigation,
  filterNavigableHotspots,
  isConfirmedOrphanSceneHotspot,
  isSceneHotspotTargetAvailable,
  resolveInfoHotspotIndependence,
  resolveSceneHotspotTarget,
} from "@/utils/sceneHotspotTarget";

const HOTSPOT_TYPE_INFO = "info";
const HOTSPOT_TYPE_SCENE = "scene";

function makeImage(overrides = {}) {
  return {
    id: "img-b",
    userId: "user-1",
    projectId: "project-1",
    title: "Sala",
    originalUrl: "https://cdn.example/b.jpg",
    previewUrl: "https://cdn.example/b-preview.jpg",
    visibility: "private",
    ...overrides,
  };
}

function makeSceneHotspot(overrides = {}) {
  return {
    id: "hs-1",
    type: HOTSPOT_TYPE_SCENE,
    imageId: "img-a",
    userId: "user-1",
    projectId: "project-1",
    pitch: 0,
    yaw: 0,
    targetImageId: "img-b",
    ...overrides,
  };
}

describe("sceneHotspotTarget helper", () => {
  const baseImages = [
    makeImage({ id: "img-a", title: "Entrada" }),
    makeImage({ id: "img-b", title: "Sala" }),
  ];

  it("1. scene com target existente é válido", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot(),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
      imagesLoadState: "loaded",
    });

    expect(resolution.available).toBe(true);
    expect(resolution.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.VALID);
    expect(isSceneHotspotTargetAvailable(resolution)).toBe(true);
  });

  it("2. target inexistente é inválido", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot({ targetImageId: "missing" }),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(
      SCENE_HOTSPOT_TARGET_REASON.TARGET_IMAGE_NOT_FOUND,
    );
    expect(isConfirmedOrphanSceneHotspot(resolution)).toBe(true);
  });

  it("3. target fora do projeto é inválido", () => {
    const images = [
      makeImage({ id: "img-a" }),
      makeImage({ id: "img-b", projectId: "other-project" }),
    ];

    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot(),
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(
      SCENE_HOTSPOT_TARGET_REASON.TARGET_OUTSIDE_PROJECT,
    );
  });

  it("4. target de outro usuário é inválido no contexto interno", () => {
    const images = [
      makeImage({ id: "img-a" }),
      makeImage({ id: "img-b", userId: "user-2" }),
    ];

    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot(),
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(
      SCENE_HOTSPOT_TARGET_REASON.TARGET_OWNED_BY_ANOTHER_USER,
    );
  });

  it("5. target privado/indisponível é inválido no público", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot({ targetImageId: "private-elsewhere" }),
      availableImages: [makeImage({ id: "img-a" })],
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(
      SCENE_HOTSPOT_TARGET_REASON.TARGET_NOT_PUBLICLY_AVAILABLE,
    );
  });

  it("6. hotspot info não depende de target", () => {
    const resolution = resolveInfoHotspotIndependence({
      id: "info-1",
      type: HOTSPOT_TYPE_INFO,
      title: "Janela",
      description: "Vista",
    });

    expect(resolution.available).toBe(true);
    expect(resolution.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.VALID);

    const sceneResolution = resolveSceneHotspotTarget({
      hotspot: {
        id: "info-1",
        type: HOTSPOT_TYPE_INFO,
        title: "Janela",
        description: "Vista",
      },
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
    });

    expect(sceneResolution.available).toBe(true);
  });

  it("7. target vazio é inválido", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot({ targetImageId: "" }),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.TARGET_EMPTY);
  });

  it("8. hotspot malformado é inválido", () => {
    expect(
      resolveSceneHotspotTarget({
        hotspot: null,
        availableImages: baseImages,
        context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      }).reason,
    ).toBe(SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE);

    expect(
      resolveSceneHotspotTarget({
        hotspot: { type: HOTSPOT_TYPE_SCENE, targetImageId: 123 },
        availableImages: baseImages,
        context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      }).reason,
    ).toBe(SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE);
  });

  it("9. self-reference segue a regra (bloqueado por padrão)", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot({ targetImageId: "img-a" }),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.SELF_REFERENCE);
  });

  it("10. lista ainda carregando não produz falso órfão", () => {
    const resolution = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot({ targetImageId: "img-b" }),
      availableImages: [],
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      imagesLoadState: "loading",
    });

    expect(resolution.available).toBe(false);
    expect(resolution.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOADING);
    expect(isConfirmedOrphanSceneHotspot(resolution)).toBe(false);

    const failed = resolveSceneHotspotTarget({
      hotspot: makeSceneHotspot(),
      availableImages: [],
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      imagesLoadState: "failed",
    });

    expect(failed.reason).toBe(SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOAD_FAILED);
    expect(isConfirmedOrphanSceneHotspot(failed)).toBe(false);
  });

  it("buildAvailableSceneTargetMap faz lookup O(1)", () => {
    const map = buildAvailableSceneTargetMap(baseImages);
    expect(map.get("img-b")?.title).toBe("Sala");
    expect(map.has("missing")).toBe(false);
  });

  it("evaluateSceneHotspotNavigation bloqueia órfãos com feedback", () => {
    const result = evaluateSceneHotspotNavigation({
      hotspot: makeSceneHotspot({ targetImageId: "gone" }),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
    });

    expect(result.canNavigate).toBe(false);
    expect(result.shouldShowUnavailableFeedback).toBe(true);
  });

  it("filterNavigableHotspots remove scene inválidos e preserva info", () => {
    const hotspots = [
      {
        id: "info-1",
        type: HOTSPOT_TYPE_INFO,
        title: "Info",
        description: "Ok",
      },
      makeSceneHotspot({ id: "ok", targetImageId: "img-b" }),
      makeSceneHotspot({ id: "bad", targetImageId: "missing" }),
    ];

    const filtered = filterNavigableHotspots(hotspots, {
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      imagesLoadState: "loaded",
    });

    expect(filtered.map((h) => h.id)).toEqual(["info-1", "ok"]);
  });

  it("landing: target inválido não navega; válido navega", () => {
    const invalid = evaluateSceneHotspotNavigation({
      hotspot: makeSceneHotspot({ targetImageId: "missing" }),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.LANDING_DEMO,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
    });
    expect(invalid.canNavigate).toBe(false);

    const valid = evaluateSceneHotspotNavigation({
      hotspot: makeSceneHotspot(),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.LANDING_DEMO,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
    });
    expect(valid.canNavigate).toBe(true);
    expect(valid.resolution.targetImageId).toBe("img-b");
  });

  it("erro de rede (failed) não marca órfãos", () => {
    const result = evaluateSceneHotspotNavigation({
      hotspot: makeSceneHotspot(),
      availableImages: [],
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER,
      sourceImageId: "img-a",
      imagesLoadState: "failed",
    });

    expect(result.canNavigate).toBe(false);
    expect(result.shouldShowUnavailableFeedback).toBe(false);
    expect(isConfirmedOrphanSceneHotspot(result.resolution)).toBe(false);
  });

  it("standalone desabilita navegação scene", () => {
    const result = evaluateSceneHotspotNavigation({
      hotspot: makeSceneHotspot(),
      availableImages: baseImages,
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_STANDALONE_VIEWER,
      sourceImageId: "img-a",
    });

    expect(result.canNavigate).toBe(false);
    expect(result.resolution.reason).toBe(
      SCENE_HOTSPOT_TARGET_REASON.SCENE_NAVIGATION_DISABLED,
    );
  });
});
