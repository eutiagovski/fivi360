/**
 * @jest-environment jsdom
 */

import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useUploadPreview } from "@/hooks/useUploadPreview";

const mockPrepareUploadPreview = jest.fn();

jest.mock("@/utils/prepareUploadPreview", () => ({
  prepareUploadPreview: (...args) => mockPrepareUploadPreview(...args),
}));

function HookHarness({ apiRef }) {
  const value = useUploadPreview();

  useEffect(() => {
    if (apiRef) {
      apiRef.current = value;
    }
  });

  return null;
}

describe("useUploadPreview", () => {
  const originalRevokeObjectURL = URL.revokeObjectURL;
  /** @type {HTMLDivElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;
  /** @type {{ current: ReturnType<typeof useUploadPreview> | null }} */
  let apiRef;

  beforeEach(() => {
    mockPrepareUploadPreview.mockReset();
    URL.revokeObjectURL = jest.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    apiRef = { current: null };
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      root.unmount();
    });
    container.remove();
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  function buildPrepared(overrides = {}) {
    return {
      processedBlob: { size: 50, type: "image/webp" },
      previewUrl: "blob:test-url",
      width: 4000,
      height: 2000,
      originalSizeBytes: 999,
      fileName: "pano.jpg",
      format: "JPG",
      showQualityWarning: false,
      showAspectWarning: false,
      ...overrides,
    };
  }

  function mount() {
    act(() => {
      root.render(<HookHarness apiRef={apiRef} />);
    });
  }

  it("runs beforeProcess before conversion and stores preview state", async () => {
    const beforeProcess = jest.fn().mockResolvedValue(undefined);
    const file = new File(["x"], "pano.jpg", { type: "image/jpeg" });
    mockPrepareUploadPreview.mockResolvedValue(buildPrepared());
    mount();

    await act(async () => {
      await apiRef.current.prepareFile(file, { beforeProcess });
    });

    expect(beforeProcess).toHaveBeenCalledWith(file);
    expect(mockPrepareUploadPreview).toHaveBeenCalledWith(file);
    expect(apiRef.current.phase).toBe("preview_ready");
    expect(apiRef.current.previewUrl).toBe("blob:test-url");
    expect(apiRef.current.imageMeta.sizeBytes).toBe(999);
  });

  it("does not call prepare when beforeProcess rejects", async () => {
    const file = new File(["x"], "pano.jpg", { type: "image/jpeg" });
    const beforeProcess = jest.fn().mockRejectedValue(new Error("quota"));
    mount();

    await act(async () => {
      await apiRef.current.prepareFile(file, { beforeProcess });
    });

    expect(mockPrepareUploadPreview).not.toHaveBeenCalled();
    expect(apiRef.current.phase).toBe("error");
    expect(apiRef.current.error).toMatch(/quota/);
  });

  it("revokes previous object URL when choosing another file", async () => {
    const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const fileB = new File(["b"], "b.jpg", { type: "image/jpeg" });

    mockPrepareUploadPreview
      .mockResolvedValueOnce(buildPrepared({ previewUrl: "blob:a" }))
      .mockResolvedValueOnce(buildPrepared({ previewUrl: "blob:b" }));

    mount();

    await act(async () => {
      await apiRef.current.prepareFile(fileA);
    });
    await act(async () => {
      await apiRef.current.prepareFile(fileB);
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:a");
    expect(apiRef.current.previewUrl).toBe("blob:b");
  });

  it("revokes object URL on reset", async () => {
    const file = new File(["x"], "pano.jpg", { type: "image/jpeg" });
    mockPrepareUploadPreview.mockResolvedValue(
      buildPrepared({ previewUrl: "blob:cleanup" }),
    );
    mount();

    await act(async () => {
      await apiRef.current.prepareFile(file);
    });

    act(() => {
      apiRef.current.reset();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cleanup");
    expect(apiRef.current.phase).toBe("idle");
    expect(apiRef.current.processedBlob).toBeNull();
  });

  it("keeps blob available across uploading → preview_ready retry", async () => {
    const file = new File(["x"], "pano.jpg", { type: "image/jpeg" });
    mockPrepareUploadPreview.mockResolvedValue(buildPrepared());
    mount();

    await act(async () => {
      await apiRef.current.prepareFile(file);
    });

    act(() => {
      apiRef.current.markUploading();
    });
    expect(apiRef.current.phase).toBe("uploading");

    act(() => {
      apiRef.current.setError("network");
      apiRef.current.markPreviewReady();
    });

    expect(apiRef.current.phase).toBe("preview_ready");
    expect(apiRef.current.processedBlob).toBeTruthy();
    expect(apiRef.current.error).toBe("network");
  });
});
