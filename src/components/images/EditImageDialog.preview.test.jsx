/**
 * @jest-environment jsdom
 */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { EditImageDialog } from "@/components/images/EditImageDialog";

const mockReplaceImageFile = jest.fn();
const mockUpdateImageTitle = jest.fn();
const mockGetHotspotsByImage = jest.fn();
const mockAssertCanReplaceImageStorage = jest.fn();
const mockPrepareUploadPreview = jest.fn();
const mockIsPlanLimitError = jest.fn(() => false);

jest.mock("@/services/images/imageService", () => ({
  replaceImageFile: (...args) => mockReplaceImageFile(...args),
  updateImageTitle: (...args) => mockUpdateImageTitle(...args),
}));

jest.mock("@/services/hotspots/hotspotService", () => ({
  getHotspotsByImage: (...args) => mockGetHotspotsByImage(...args),
  HOTSPOT_TYPE_INFO: "info",
  HOTSPOT_TYPE_SCENE: "scene",
}));

jest.mock("@/services/plans/planService", () => ({
  assertCanReplaceImageStorage: (...args) =>
    mockAssertCanReplaceImageStorage(...args),
  isPlanLimitError: (...args) => mockIsPlanLimitError(...args),
}));

jest.mock("@/utils/prepareUploadPreview", () => ({
  prepareUploadPreview: (...args) => mockPrepareUploadPreview(...args),
}));

jest.mock("@/components/viewer/PanoramaViewer", () => {
  const ReactLib = require("react");
  return {
    PanoramaViewer: ({
      panoramaUrl,
      mode,
      hotspots,
      hotspotsInteractive,
      showFullscreenCtrl,
      onReady,
    }) => {
      ReactLib.useEffect(() => {
        if (panoramaUrl && onReady) {
          onReady();
        }
      }, [panoramaUrl, onReady]);

      return ReactLib.createElement("div", {
        "data-testid": "panorama-viewer-wrapper",
        "data-mode": mode,
        "data-url": panoramaUrl,
        "data-hotspots": String((hotspots || []).length),
        "data-hotspots-interactive": String(hotspotsInteractive !== false),
        "data-fullscreen": String(showFullscreenCtrl === true),
      });
    },
  };
});

jest.mock("@/components/ui/dialog", () => {
  const ReactLib = require("react");
  return {
    Dialog: ({ open, children }) =>
      open
        ? ReactLib.createElement("div", { "data-testid": "dialog-root" }, children)
        : null,
    DialogContent: ({ children, ...props }) =>
      ReactLib.createElement("div", props, children),
    DialogHeader: ({ children, ...props }) =>
      ReactLib.createElement("div", props, children),
    DialogTitle: ({ children, ...props }) =>
      ReactLib.createElement("h2", props, children),
    DialogDescription: ({ children, ...props }) =>
      ReactLib.createElement("p", props, children),
    DialogFooter: ({ children, ...props }) =>
      ReactLib.createElement("div", props, children),
  };
});

function buildFile(name = "nova.jpg", size = 4000) {
  const file = new File(["raw"], name, { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function preparedResult() {
  return {
    processedBlob: { size: 900, type: "image/webp" },
    previewUrl: "blob:replace",
    width: 4000,
    height: 2000,
    originalSizeBytes: 4000,
    fileName: "nova.jpg",
    format: "JPG",
    showQualityWarning: false,
    showAspectWarning: false,
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("EditImageDialog reference hotspots preview", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  /** @type {HTMLDivElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    mockReplaceImageFile.mockReset();
    mockUpdateImageTitle.mockReset();
    mockGetHotspotsByImage.mockReset();
    mockAssertCanReplaceImageStorage.mockReset();
    mockAssertCanReplaceImageStorage.mockResolvedValue(undefined);
    mockPrepareUploadPreview.mockReset();
    mockPrepareUploadPreview.mockResolvedValue(preparedResult());
    mockIsPlanLimitError.mockReturnValue(false);
    mockGetHotspotsByImage.mockResolvedValue([
      {
        id: "hs-info",
        type: "info",
        pitch: 1,
        yaw: 2,
        title: "Info",
        description: "d",
      },
      {
        id: "hs-scene",
        type: "scene",
        pitch: 3,
        yaw: 4,
        targetImageId: "other",
      },
    ]);
    URL.createObjectURL = jest.fn(() => "blob:test");
    URL.revokeObjectURL = jest.fn();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  async function openAndSelectFile() {
    await act(async () => {
      root.render(
        <EditImageDialog
          open
          onOpenChange={jest.fn()}
          imageId="image-1"
          userId="user-1"
          projectId="project-1"
          initialTitle="Sala"
          currentPreviewUrl="https://example/old.webp"
          currentSizeBytes={2000}
          enableFileReplace
        />,
      );
    });
    await flush();

    const input = container.querySelector(
      '[data-testid="edit-image-file-input"]',
    );
    const file = buildFile();

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [file],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flush();
  }

  it("loads hotspots once and shows them inert with fullscreen on replace preview", async () => {
    await openAndSelectFile();

    expect(mockGetHotspotsByImage).toHaveBeenCalledTimes(1);
    expect(mockGetHotspotsByImage).toHaveBeenCalledWith("image-1");

    const viewer = container.querySelector(
      '[data-testid="panorama-viewer-wrapper"]',
    );
    expect(viewer.getAttribute("data-hotspots")).toBe("2");
    expect(viewer.getAttribute("data-hotspots-interactive")).toBe("false");
    expect(viewer.getAttribute("data-fullscreen")).toBe("true");
    expect(
      container.querySelector('[data-testid="edit-image-hotspots-hint"]'),
    ).toBeTruthy();
    expect(mockReplaceImageFile).not.toHaveBeenCalled();
  });

  it("reuses hotspots when choosing another file", async () => {
    await openAndSelectFile();
    expect(mockGetHotspotsByImage).toHaveBeenCalledTimes(1);

    mockPrepareUploadPreview.mockResolvedValue({
      ...preparedResult(),
      previewUrl: "blob:replace-b",
      fileName: "outra.jpg",
    });

    const input = container.querySelector(
      '[data-testid="edit-image-file-input"]',
    );
    const fileB = buildFile("outra.jpg", 5000);

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [fileB],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flush();
    await flush();

    expect(mockGetHotspotsByImage).toHaveBeenCalledTimes(1);
    expect(mockPrepareUploadPreview).toHaveBeenCalledTimes(2);
    const viewer = container.querySelector(
      '[data-testid="panorama-viewer-wrapper"]',
    );
    expect(viewer.getAttribute("data-url")).toBe("blob:replace-b");
    expect(viewer.getAttribute("data-hotspots")).toBe("2");
  });

  it("does not block preview when hotspot load fails", async () => {
    mockGetHotspotsByImage.mockRejectedValue(new Error("firestore down"));

    await openAndSelectFile();

    const viewer = container.querySelector(
      '[data-testid="panorama-viewer-wrapper"]',
    );
    expect(viewer.getAttribute("data-url")).toBe("blob:replace");
    expect(viewer.getAttribute("data-hotspots")).toBe("0");
    expect(
      container.querySelector('[data-testid="edit-image-hotspots-error"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="edit-image-hotspots-hint"]'),
    ).toBeNull();

    const confirmBtn = container.querySelector(
      '[data-testid="edit-image-save-btn"]',
    );
    expect(confirmBtn.disabled).toBe(false);
  });

  it("confirm replace does not rewrite hotspots", async () => {
    mockReplaceImageFile.mockResolvedValue({
      image: { id: "image-1", originalSizeBytes: 4000 },
      coverImage: null,
    });

    await openAndSelectFile();

    const confirmBtn = container.querySelector(
      '[data-testid="edit-image-save-btn"]',
    );

    await act(async () => {
      confirmBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(mockReplaceImageFile).toHaveBeenCalledTimes(1);
    const options = mockReplaceImageFile.mock.calls[0][5];
    expect(options.hotspots).toBeUndefined();
    expect(options.processedBlob).toBeTruthy();
  });
});
