/**
 * @jest-environment jsdom
 */

jest.mock("@/utils/hotspotPannellum", () => ({
  mapHotspotsToPannellum: () => [],
}));

jest.mock("pannellum/build/pannellum.css", () => ({}), { virtual: true });
jest.mock("@/components/viewer/panorama-viewer.css", () => ({}), {
  virtual: true,
});

jest.mock("@/hooks/useViewerInteractionHint", () => ({
  useViewerInteractionHint: () => false,
}));

jest.mock("@/components/viewer/ViewerInteractionHint", () => ({
  ViewerInteractionHint: () => null,
}));

const {
  getPanoramaViewerCapabilities,
} = require("@/components/viewer/PanoramaViewer");

describe("getPanoramaViewerCapabilities", () => {
  it("enables fullscreen and inert hotspots for upload-preview by default", () => {
    const caps = getPanoramaViewerCapabilities("upload-preview");
    expect(caps.allowFullscreen).toBe(true);
    expect(caps.hotspotsInteractive).toBe(false);
    expect(caps.showHotspots).toBe(true);
    expect(caps.allowSceneNavigation).toBe(false);
    expect(caps.allowEditing).toBe(false);
    expect(caps.trackAnalytics).toBe(false);
    expect(caps.allowPlacement).toBe(false);
    expect(caps.showInteractionHint).toBe(false);
  });

  it("allows overriding fullscreen off for upload-preview", () => {
    const caps = getPanoramaViewerCapabilities("upload-preview", {
      showFullscreenCtrl: false,
    });
    expect(caps.allowFullscreen).toBe(false);
  });

  it("keeps interactive hotspots for default mode", () => {
    const caps = getPanoramaViewerCapabilities("default", {
      showFullscreenCtrl: true,
    });
    expect(caps.hotspotsInteractive).toBe(true);
    expect(caps.allowFullscreen).toBe(true);
    expect(caps.allowSceneNavigation).toBe(true);
  });
});
