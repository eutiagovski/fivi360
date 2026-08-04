/**
 * @jest-environment jsdom
 */

import React, { act } from "react";
import { createRoot } from "react-dom/client";

jest.mock("pannellum/build/pannellum.js", () => ({}), { virtual: true });
jest.mock("pannellum/build/pannellum.css", () => ({}), { virtual: true });
jest.mock("@/components/viewer/panorama-viewer.css", () => ({}), {
  virtual: true,
});

jest.mock("@/utils/hotspotPannellum", () => ({
  mapHotspotsToPannellum: (hotspots, handlers = {}) =>
    (hotspots || []).map((hs) => ({
      id: hs.id,
      pitch: hs.pitch,
      yaw: hs.yaw,
      type: hs.type === "scene" ? "scene" : "info",
      text: hs.title || "Hotspot existente",
      cssClass: handlers.cssClass,
      clickHandlerFunc:
        handlers.interactive === true
          ? () => {
              if (hs.type === "scene") {
                handlers.onSceneClick?.(hs);
              } else {
                handlers.onInfoClick?.(hs);
              }
            }
          : undefined,
    })),
}));

jest.mock("@/hooks/useViewerInteractionHint", () => ({
  useViewerInteractionHint: () => false,
}));

jest.mock("@/components/viewer/ViewerInteractionHint", () => ({
  ViewerInteractionHint: () => null,
}));

const { PanoramaViewer } = require("@/components/viewer/PanoramaViewer");

describe("PanoramaViewer upload-preview fullscreen and reference hotspots", () => {
  /** @type {HTMLDivElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;
  let resizeMock;

  beforeEach(() => {
    resizeMock = jest.fn();
    window.pannellum = {
      viewer: jest.fn(() => ({
        on: jest.fn((event, cb) => {
          if (event === "load") {
            setTimeout(() => cb(), 0);
          }
        }),
        off: jest.fn(),
        destroy: jest.fn(),
        isLoaded: () => true,
        removeHotSpot: jest.fn(),
        addHotSpot: jest.fn(),
        resize: resizeMock,
      })),
    };
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 640,
      height: 360,
      top: 0,
      left: 0,
      bottom: 360,
      right: 640,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete window.pannellum;
  });

  async function flush() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
  }

  it("enables fullscreen and renders inert reference hotspots", async () => {
    const onInfo = jest.fn();
    const onScene = jest.fn();

    await act(async () => {
      root.render(
        <div style={{ width: 640, height: 360 }}>
          <PanoramaViewer
            panoramaUrl="blob:local-preview"
            mode="upload-preview"
            showZoomCtrl
            showFullscreenCtrl
            hotspotsInteractive={false}
            onInfoHotspotClick={onInfo}
            onSceneHotspotClick={onScene}
            hotspots={[
              {
                id: "hs-info",
                type: "info",
                pitch: 1,
                yaw: 2,
                title: "Info",
              },
              {
                id: "hs-scene",
                type: "scene",
                pitch: 3,
                yaw: 4,
                targetImageId: "x",
              },
            ]}
            className="h-full w-full min-h-[220px]"
          />
        </div>,
      );
    });
    await flush();

    const wrapper = container.querySelector(
      '[data-testid="panorama-viewer-wrapper"]',
    );
    expect(wrapper.getAttribute("data-mode")).toBe("upload-preview");
    expect(wrapper.getAttribute("data-fullscreen-enabled")).toBe("true");
    expect(wrapper.getAttribute("data-hotspots-interactive")).toBe("false");

    expect(window.pannellum.viewer).toHaveBeenCalled();
    const config = window.pannellum.viewer.mock.calls[0][1];
    expect(config.showFullscreenCtrl).toBe(true);
    expect(config.showZoomCtrl).toBe(true);
    expect(config.hotSpots).toHaveLength(2);
    expect(config.hotSpots[0].clickHandlerFunc).toBeUndefined();
    expect(config.hotSpots[1].clickHandlerFunc).toBeUndefined();
    expect(onInfo).not.toHaveBeenCalled();
    expect(onScene).not.toHaveBeenCalled();
  });

  it("calls resize on fullscreenchange without recreating viewer", async () => {
    await act(async () => {
      root.render(
        <PanoramaViewer
          panoramaUrl="blob:fs"
          mode="upload-preview"
          showFullscreenCtrl
          className="min-h-[220px]"
        />,
      );
    });
    await flush();

    const createCount = window.pannellum.viewer.mock.calls.length;

    await act(async () => {
      document.dispatchEvent(new Event("fullscreenchange"));
      await new Promise((r) => requestAnimationFrame(r));
    });

    expect(resizeMock).toHaveBeenCalled();
    expect(window.pannellum.viewer.mock.calls.length).toBe(createCount);
  });

  it("new upload style empty hotspots stay empty", async () => {
    await act(async () => {
      root.render(
        <PanoramaViewer
          panoramaUrl="blob:empty"
          mode="upload-preview"
          hotspots={[]}
          showFullscreenCtrl
        />,
      );
    });
    await flush();

    const config = window.pannellum.viewer.mock.calls[0][1];
    expect(config.hotSpots).toEqual([]);
  });
});
