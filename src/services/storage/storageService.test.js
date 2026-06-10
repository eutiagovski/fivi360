import {
  collectImageStoragePaths,
  deleteImageFile,
  deleteImageFilesTolerant,
  relocateImageFile,
} from "./storageService";

jest.mock("../../config/firebase", () => ({
  storage: {},
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn((_storage, path) => ({ path })),
  deleteObject: jest.fn(),
  getDownloadURL: jest.fn(),
  uploadBytes: jest.fn(),
}));

const { deleteObject, getDownloadURL, ref, uploadBytes } = require("firebase/storage");

const originalFetch = global.fetch;

describe("collectImageStoragePaths", () => {
  it("returns unique non-empty paths from known fields", () => {
    const paths = collectImageStoragePaths({
      storagePath: "users/u1/projects/p1/images/i1.webp",
      originalStoragePath: "users/u1/original/i1.jpg",
      previewStoragePath: "users/u1/preview/i1.webp",
      duplicate: "users/u1/projects/p1/images/i1.webp",
    });

    expect(paths).toEqual([
      "users/u1/projects/p1/images/i1.webp",
      "users/u1/original/i1.jpg",
      "users/u1/preview/i1.webp",
    ]);
  });

  it("ignores empty or missing fields", () => {
    expect(collectImageStoragePaths({ storagePath: "  " })).toEqual([]);
    expect(collectImageStoragePaths({})).toEqual([]);
  });
});

describe("deleteImageFilesTolerant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("continues when a storage file is missing", async () => {
    deleteObject
      .mockRejectedValueOnce({ code: "storage/object-not-found" })
      .mockResolvedValueOnce(undefined);

    await expect(
      deleteImageFilesTolerant(["missing.webp", "exists.webp"]),
    ).resolves.toBeUndefined();

    expect(deleteObject).toHaveBeenCalledTimes(2);
  });

  it("does not throw when deleteImageFile reports failure", async () => {
    deleteObject.mockRejectedValueOnce({ code: "storage/unauthorized" });

    await expect(deleteImageFilesTolerant(["forbidden.webp"])).resolves.toBeUndefined();
  });
});

describe("relocateImageFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ref.mockImplementation((_storage, path) => ({ path }));
    global.fetch = jest.fn();
    uploadBytes.mockResolvedValue(undefined);
    getDownloadURL.mockResolvedValue("https://storage.example/new.webp");
    deleteObject.mockResolvedValue(undefined);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("uploads blob to new path, returns download URL and deletes old file", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(["webp"], { type: "image/webp" })),
    });

    const result = await relocateImageFile(
      "https://storage.example/old.webp",
      "users/u1/images/i1.webp",
      "users/u1/projects/p1/images/i1.webp",
    );

    expect(uploadBytes).toHaveBeenCalledWith(
      { path: "users/u1/images/i1.webp" },
      expect.any(Blob),
      { contentType: "image/webp" },
    );
    expect(getDownloadURL).toHaveBeenCalledWith({ path: "users/u1/images/i1.webp" });
    expect(deleteObject).toHaveBeenCalledWith({
      path: "users/u1/projects/p1/images/i1.webp",
    });
    expect(result).toEqual({
      downloadUrl: "https://storage.example/new.webp",
      storagePath: "users/u1/images/i1.webp",
    });
  });

  it("throws when source fetch fails and does not delete old file", async () => {
    global.fetch.mockResolvedValue({ ok: false });

    await expect(
      relocateImageFile(
        "https://storage.example/missing.webp",
        "users/u1/images/i1.webp",
        "users/u1/projects/p1/images/i1.webp",
      ),
    ).rejects.toThrow("Não foi possível obter o arquivo da imagem.");

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("keeps relocation when old file deletion fails", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(["webp"], { type: "image/webp" })),
    });
    deleteObject.mockRejectedValueOnce({ code: "storage/unauthorized" });

    const result = await relocateImageFile(
      "https://storage.example/old.webp",
      "users/u1/images/i1.webp",
      "users/u1/projects/p1/images/i1.webp",
    );

    expect(result.downloadUrl).toBe("https://storage.example/new.webp");
  });
});

describe("deleteImageFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ref.mockImplementation((_storage, path) => ({ path }));
  });

  it("treats object-not-found as success", async () => {
    deleteObject.mockRejectedValueOnce({ code: "storage/object-not-found" });

    const result = await deleteImageFile("gone.webp");

    expect(result).toEqual({ success: true, skipped: true });
  });
});
