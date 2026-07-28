import { createSceneHotspotClickHandler } from "@/utils/sceneHotspotNavigation";
import {
  SCENE_HOTSPOT_CONTEXT,
  SCENE_HOTSPOT_TARGET_REASON,
  SCENE_HOTSPOT_UNAVAILABLE_MESSAGE,
} from "@/utils/sceneHotspotTarget";

const HOTSPOT_TYPE_INFO = "info";
const HOTSPOT_TYPE_SCENE = "scene";

describe("createSceneHotspotClickHandler", () => {
  const images = [
    {
      id: "img-a",
      userId: "user-1",
      projectId: "project-1",
      originalUrl: "https://cdn.example/a.jpg",
    },
    {
      id: "img-b",
      userId: "user-1",
      projectId: "project-1",
      originalUrl: "https://cdn.example/b.jpg",
    },
  ];

  it("11. clique em scene válida navega", () => {
    const onNavigate = jest.fn();
    const onUnavailable = jest.fn();
    const onAnalyticsSuccess = jest.fn();

    const handler = createSceneHotspotClickHandler({
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
      imagesLoadState: "loaded",
      onNavigate,
      onUnavailable,
      onAnalyticsSuccess,
    });

    const navigated = handler({
      id: "hs-1",
      type: HOTSPOT_TYPE_SCENE,
      targetImageId: "img-b",
    });

    expect(navigated).toBe(true);
    expect(onNavigate).toHaveBeenCalledWith(
      "img-b",
      expect.objectContaining({ available: true }),
    );
    expect(onUnavailable).not.toHaveBeenCalled();
    expect(onAnalyticsSuccess).toHaveBeenCalled();
  });

  it("12-15. clique inválido não navega, mostra feedback e não dispara analytics de sucesso", () => {
    const onNavigate = jest.fn();
    const onUnavailable = jest.fn();
    const onAnalyticsSuccess = jest.fn();
    const onAnalyticsUnavailable = jest.fn();

    const handler = createSceneHotspotClickHandler({
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
      imagesLoadState: "loaded",
      onNavigate,
      onUnavailable,
      onAnalyticsSuccess,
      onAnalyticsUnavailable,
    });

    const navigated = handler({
      id: "hs-orphan",
      type: HOTSPOT_TYPE_SCENE,
      targetImageId: "missing",
    });

    expect(navigated).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onUnavailable).toHaveBeenCalledWith(
      SCENE_HOTSPOT_UNAVAILABLE_MESSAGE,
      expect.objectContaining({
        reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_IMAGE_NOT_FOUND,
      }),
    );
    expect(onAnalyticsSuccess).not.toHaveBeenCalled();
    expect(onAnalyticsUnavailable).toHaveBeenCalled();
  });

  it("16. info hotspot não dispara navegação scene", () => {
    const onNavigate = jest.fn();

    const handler = createSceneHotspotClickHandler({
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      onNavigate,
    });

    expect(
      handler({
        id: "info-1",
        type: HOTSPOT_TYPE_INFO,
        title: "Info",
        description: "Ok",
      }),
    ).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("17-19. viewer público: válido navega; privado/inexistente não navega", () => {
    const onNavigate = jest.fn();
    const onUnavailable = jest.fn();

    const handler = createSceneHotspotClickHandler({
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      imagesLoadState: "loaded",
      onNavigate,
      onUnavailable,
    });

    expect(
      handler({
        type: HOTSPOT_TYPE_SCENE,
        targetImageId: "img-b",
      }),
    ).toBe(true);
    expect(onNavigate).toHaveBeenCalledWith("img-b", expect.any(Object));

    onNavigate.mockClear();
    expect(
      handler({
        type: HOTSPOT_TYPE_SCENE,
        targetImageId: "private-id",
      }),
    ).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onUnavailable).toHaveBeenCalled();
  });

  it("20. erro de rede não trata como target inexistente (sem feedback de órfão)", () => {
    const onNavigate = jest.fn();
    const onUnavailable = jest.fn();

    const handler = createSceneHotspotClickHandler({
      availableImages: [],
      context: SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      imagesLoadState: "failed",
      onNavigate,
      onUnavailable,
    });

    expect(
      handler({
        type: HOTSPOT_TYPE_SCENE,
        targetImageId: "img-b",
      }),
    ).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it("bloqueia clique repetido durante transição", () => {
    const onNavigate = jest.fn();
    let locked = false;

    const handler = createSceneHotspotClickHandler({
      availableImages: images,
      context: SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER,
      sourceImageId: "img-a",
      expectedProjectId: "project-1",
      expectedUserId: "user-1",
      onNavigate,
      isTransitionLocked: () => locked,
      lockTransition: () => {
        locked = true;
      },
    });

    expect(
      handler({ type: HOTSPOT_TYPE_SCENE, targetImageId: "img-b" }),
    ).toBe(true);
    expect(
      handler({ type: HOTSPOT_TYPE_SCENE, targetImageId: "img-b" }),
    ).toBe(false);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
