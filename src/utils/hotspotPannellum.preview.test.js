jest.mock("@/services/hotspots/hotspotService", () => ({
  HOTSPOT_TYPE_INFO: "info",
  HOTSPOT_TYPE_SCENE: "scene",
}));

import {
  HOTSPOT_TYPE_INFO,
  HOTSPOT_TYPE_SCENE,
} from "@/services/hotspots/hotspotService";
import { mapHotspotsToPannellum } from "@/utils/hotspotPannellum";

describe("mapHotspotsToPannellum preview reference mode", () => {
  const infoHotspot = {
    id: "hs-info",
    type: HOTSPOT_TYPE_INFO,
    pitch: 10,
    yaw: 20,
    title: "Detalhe",
    description: "Texto",
  };

  const sceneHotspot = {
    id: "hs-scene",
    type: HOTSPOT_TYPE_SCENE,
    pitch: -5,
    yaw: 90,
    targetImageId: "img-2",
  };

  it("renders info and scene hotspots with pitch/yaw", () => {
    const mapped = mapHotspotsToPannellum([infoHotspot, sceneHotspot]);
    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toMatchObject({
      id: "hs-info",
      pitch: 10,
      yaw: 20,
      type: HOTSPOT_TYPE_INFO,
      text: "Detalhe",
    });
    expect(mapped[1]).toMatchObject({
      id: "hs-scene",
      pitch: -5,
      yaw: 90,
      type: "scene",
    });
  });

  it("omits click handlers when interactive is false", () => {
    const onInfoClick = jest.fn();
    const onSceneClick = jest.fn();

    const mapped = mapHotspotsToPannellum([infoHotspot, sceneHotspot], {
      interactive: false,
      onInfoClick,
      onSceneClick,
      cssClass: "pnlm-hotspot--preview-ref",
    });

    expect(mapped[0].clickHandlerFunc).toBeUndefined();
    expect(mapped[1].clickHandlerFunc).toBeUndefined();
    expect(mapped[0].cssClass).toBe("pnlm-hotspot--preview-ref");
    expect(mapped[1].cssClass).toBe("pnlm-hotspot--preview-ref");
    expect(mapped[1].text).toBe("Hotspot existente");
  });

  it("keeps click handlers when interactive", () => {
    const onInfoClick = jest.fn();
    const onSceneClick = jest.fn();

    const mapped = mapHotspotsToPannellum([infoHotspot, sceneHotspot], {
      interactive: true,
      onInfoClick,
      onSceneClick,
    });

    mapped[0].clickHandlerFunc();
    mapped[1].clickHandlerFunc();
    expect(onInfoClick).toHaveBeenCalledWith(infoHotspot);
    expect(onSceneClick).toHaveBeenCalledWith(sceneHotspot);
  });
});
