/**
 * @jest-environment jsdom
 */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { UploadImageDialog } from "@/components/images/UploadImageDialog";

const mockUploadImage = jest.fn();
const mockAssertCanUploadImage = jest.fn();
const mockTrackEvent = jest.fn();
const mockPrepareUploadPreview = jest.fn();
const mockIsPlanLimitError = jest.fn(() => false);

jest.mock("@/services/images/imageService", () => ({
  uploadImage: (...args) => mockUploadImage(...args),
}));

jest.mock("@/services/plans/planService", () => ({
  assertCanUploadImage: (...args) => mockAssertCanUploadImage(...args),
  isPlanLimitError: (...args) => mockIsPlanLimitError(...args),
}));

jest.mock("@/services/analytics/analyticsService", () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

jest.mock("@/utils/prepareUploadPreview", () => ({
  prepareUploadPreview: (...args) => mockPrepareUploadPreview(...args),
}));

jest.mock("@/components/viewer/PanoramaViewer", () => {
  const ReactLib = require("react");
  return {
    PanoramaViewer: ({ panoramaUrl, mode, onReady }) => {
      ReactLib.useEffect(() => {
        if (panoramaUrl && onReady) {
          onReady();
        }
      }, [panoramaUrl, onReady]);

      return ReactLib.createElement("div", {
        "data-testid": "panorama-viewer-wrapper",
        "data-mode": mode,
        "data-url": panoramaUrl,
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

function buildFile(size = 5000) {
  const file = new File(["raw-bytes"], "sala.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function preparedResult(overrides = {}) {
  return {
    processedBlob: { size: 1200, type: "image/webp" },
    previewUrl: "blob:prepared",
    width: 4000,
    height: 2000,
    originalSizeBytes: 5000,
    fileName: "sala.jpg",
    format: "JPG",
    showQualityWarning: false,
    showAspectWarning: false,
    ...overrides,
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("UploadImageDialog preview flow", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  /** @type {HTMLDivElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    mockUploadImage.mockReset();
    mockAssertCanUploadImage.mockReset();
    mockAssertCanUploadImage.mockResolvedValue(undefined);
    mockTrackEvent.mockReset();
    mockPrepareUploadPreview.mockReset();
    mockIsPlanLimitError.mockReturnValue(false);
    URL.createObjectURL = jest.fn(() => "blob:dialog");
    URL.revokeObjectURL = jest.fn();
    mockPrepareUploadPreview.mockResolvedValue(preparedResult());

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

  it("validates quota before processing and does not upload before confirm", async () => {
    const file = buildFile(5000);
    const callOrder = [];

    mockAssertCanUploadImage.mockImplementation(async () => {
      callOrder.push("assert");
    });
    mockPrepareUploadPreview.mockImplementation(async () => {
      callOrder.push("prepare");
      return preparedResult();
    });

    await act(async () => {
      root.render(
        <UploadImageDialog
          open
          onOpenChange={jest.fn()}
          file={file}
          userId="user-1"
          projectId={null}
          onUploadComplete={jest.fn()}
        />,
      );
    });
    await flush();

    const viewer = container.querySelector(
      '[data-testid="panorama-viewer-wrapper"]',
    );
    expect(viewer).toBeTruthy();
    expect(viewer.getAttribute("data-url")).toBe("blob:prepared");
    expect(viewer.getAttribute("data-mode")).toBe("upload-preview");
    expect(callOrder).toEqual(["assert", "prepare"]);
    expect(mockAssertCanUploadImage).toHaveBeenCalledWith("user-1", 5000);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Visualizar antes de enviar");
    expect(
      container.querySelector('[data-testid="upload-image-size"]')?.textContent,
    ).toBe("4.9 KB");
    expect(container.textContent).not.toMatch(/comprim/i);
  });

  it("confirms upload once with processedBlob and blocks double click", async () => {
    const file = buildFile(5000);
    let resolveUpload;
    mockUploadImage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );

    const onUploadComplete = jest.fn();

    await act(async () => {
      root.render(
        <UploadImageDialog
          open
          onOpenChange={jest.fn()}
          file={file}
          userId="user-1"
          projectId="project-1"
          onUploadComplete={onUploadComplete}
        />,
      );
    });
    await flush();

    const confirmBtn = container.querySelector(
      '[data-testid="upload-image-save-btn"]',
    );
    expect(confirmBtn.disabled).toBe(false);

    await act(async () => {
      confirmBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      confirmBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    expect(mockUploadImage).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      file,
      "Sala",
      expect.objectContaining({
        processedBlob: preparedResult().processedBlob,
        width: 4000,
        height: 2000,
      }),
    );

    await act(async () => {
      resolveUpload({
        id: "img-1",
        originalSizeBytes: 5000,
        storedSizeBytes: 1200,
      });
    });
    await flush();

    expect(onUploadComplete).toHaveBeenCalled();
  });

  it("keeps preview available after upload failure for retry", async () => {
    const file = buildFile(5000);
    mockUploadImage.mockRejectedValueOnce(new Error("network fail"));

    await act(async () => {
      root.render(
        <UploadImageDialog
          open
          onOpenChange={jest.fn()}
          file={file}
          userId="user-1"
          projectId={null}
          onUploadComplete={jest.fn()}
        />,
      );
    });
    await flush();

    const confirmBtn = container.querySelector(
      '[data-testid="upload-image-save-btn"]',
    );

    await act(async () => {
      confirmBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(
      container.querySelector('[data-testid="upload-image-error"]')?.textContent,
    ).toContain("network fail");
    expect(
      container
        .querySelector('[data-testid="panorama-viewer-wrapper"]')
        ?.getAttribute("data-url"),
    ).toBe("blob:prepared");
    expect(confirmBtn.disabled).toBe(false);
    expect(mockPrepareUploadPreview).toHaveBeenCalledTimes(1);
  });

  it("cancel closes without upload", async () => {
    const file = buildFile(5000);
    const onOpenChange = jest.fn();

    await act(async () => {
      root.render(
        <UploadImageDialog
          open
          onOpenChange={onOpenChange}
          file={file}
          userId="user-1"
          projectId={null}
          onUploadComplete={jest.fn()}
        />,
      );
    });
    await flush();

    const cancelBtn = container.querySelector(
      '[data-testid="upload-image-cancel-btn"]',
    );

    await act(async () => {
      cancelBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockUploadImage).not.toHaveBeenCalled();
  });
});
