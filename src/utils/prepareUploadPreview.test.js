import { prepareUploadPreview } from "@/utils/prepareUploadPreview";

const mockProcessImageForUpload = jest.fn();

jest.mock("@/utils/imageConversion", () => ({
  processImageForUpload: (...args) => mockProcessImageForUpload(...args),
}));

describe("prepareUploadPreview", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    mockProcessImageForUpload.mockReset();
    URL.createObjectURL = jest.fn(() => "blob:preview-1");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("captures original File.size and creates object URL from processed blob", async () => {
    const file = new File(["raw"], "pano.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 12_345 });
    const processedBlob = { size: 1111, type: "image/webp" };

    mockProcessImageForUpload.mockResolvedValue({
      processedBlob,
      width: 4000,
      height: 2000,
    });

    const result = await prepareUploadPreview(file);

    expect(mockProcessImageForUpload).toHaveBeenCalledWith(file);
    expect(result.originalSizeBytes).toBe(12_345);
    expect(result.processedBlob).toBe(processedBlob);
    expect(result.previewUrl).toBe("blob:preview-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(processedBlob);
    expect(result.width).toBe(4000);
    expect(result.height).toBe(2000);
    expect(result.showAspectWarning).toBe(false);
    expect(result.showQualityWarning).toBe(false);
  });

  it("flags atypical aspect ratio as warning only", async () => {
    const file = new File(["raw"], "flat.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1000 });

    mockProcessImageForUpload.mockResolvedValue({
      processedBlob: { size: 10, type: "image/webp" },
      width: 1920,
      height: 1080,
    });

    const result = await prepareUploadPreview(file);
    expect(result.showAspectWarning).toBe(true);
  });

  it("maps processing failures to controlled preview error", async () => {
    const file = new File(["raw"], "broken.jpg", { type: "image/jpeg" });
    mockProcessImageForUpload.mockRejectedValue(new Error("canvas fail"));

    await expect(prepareUploadPreview(file)).rejects.toThrow(
      "Não foi possível preparar esta imagem para visualização",
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
