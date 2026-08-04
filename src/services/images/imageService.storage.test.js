import { replaceImageFile, uploadImage } from "./imageService";

const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockStorageRef = jest.fn((path) => ({ path }));
const mockGetDownloadURL = jest.fn(() =>
  Promise.resolve("https://storage.example/new.webp"),
);

jest.mock("firebase/firestore", () => ({
  collection: (...args) => mockCollection(...args),
  deleteField: jest.fn(),
  doc: (...args) => mockDoc(...args),
  deleteDoc: jest.fn(),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => "server-timestamp"),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  where: jest.fn(),
  Timestamp: {
    fromMillis: (ms) => ({ __millis: ms }),
    fromDate: (date) => ({ __date: date }),
  },
}));

jest.mock("../../config/firebase", () => ({
  db: {},
  storage: {},
}));

jest.mock("firebase/storage", () => ({
  getDownloadURL: (...args) => mockGetDownloadURL(...args),
  ref: (...args) => mockStorageRef(...args),
  uploadBytes: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/utils/imageConversion", () => ({
  convertToWebp: jest.fn(),
}));

jest.mock("../projects/projectService", () => ({
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
  adjustProjectImageCount: jest.fn(),
}));

jest.mock("../plans/planService", () => ({
  assertCanReplaceImageStorage: jest.fn(),
  assertCanUploadImage: jest.fn(),
}));

jest.mock("../storage/storageService", () => ({
  deleteImageFile: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock("@/services/workspaces/workspaceService", () => ({
  getActiveWorkspaceIdForUser: jest.fn(async () => "user-1"),
}));

const { getProjectById, updateProject } = require("../projects/projectService");
const { deleteImageFile } = require("../storage/storageService");
const { convertToWebp } = require("@/utils/imageConversion");
const {
  assertCanReplaceImageStorage,
  assertCanUploadImage,
} = require("../plans/planService");
const {
  getActiveWorkspaceIdForUser,
} = require("@/services/workspaces/workspaceService");

const webpBlob = { size: 1024, type: "image/webp" };
const ORIGINAL_FILE_SIZE = 5000;

const userId = "user-1";
const projectId = "project-1";
const imageId = "image-new";

function buildFile(size = ORIGINAL_FILE_SIZE) {
  const file = new File(["x"], "panorama.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function buildExistingImage(overrides = {}) {
  return {
    userId,
    projectId: null,
    title: "Existente",
    originalUrl: "https://storage.example/old.webp",
    previewUrl: "https://storage.example/old.webp",
    storagePath: `users/${userId}/images/${imageId}.webp`,
    sizeBytes: 512,
    originalSizeBytes: 2048,
    storedSizeBytes: 512,
    width: 4000,
    height: 2000,
    originalFileType: "image/jpeg",
    optimizedFileType: "image/webp",
    visibility: "private",
    createdAt: { seconds: 1 },
    updatedAt: { seconds: 1 },
    ...overrides,
  };
}

describe("uploadImage storage path", () => {
  beforeEach(() => {
    convertToWebp.mockReset();
    convertToWebp.mockResolvedValue(webpBlob);
    assertCanUploadImage.mockReset();
    assertCanUploadImage.mockResolvedValue(undefined);
    getActiveWorkspaceIdForUser.mockReset();
    getActiveWorkspaceIdForUser.mockResolvedValue(userId);
    mockDoc.mockReset();
    mockCollection.mockReset();
    mockSetDoc.mockReset();
    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    getProjectById.mockReset();
    updateProject.mockReset();

    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    mockCollection.mockReturnValue("images-collection");
    mockDoc.mockImplementation((...segments) => {
      if (segments[0] === "images-collection") {
        return { id: imageId, path: `images/${imageId}` };
      }
      return { path: segments.join("/") };
    });
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });
    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      visibility: "private",
    });
    updateProject.mockResolvedValue(undefined);
    mockStorageRef.mockClear();
    mockGetDownloadURL.mockClear();
    mockGetDownloadURL.mockResolvedValue("https://storage.example/new.webp");
  });

  it("uses unified path for loose gallery upload", async () => {
    await uploadImage(userId, null, buildFile(), "Galeria");

    expect(mockStorageRef).toHaveBeenCalledWith(
      {},
      `users/${userId}/images/${imageId}.webp`,
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: imageId }),
      expect.objectContaining({
        storagePath: `users/${userId}/images/${imageId}.webp`,
        projectId: null,
        workspaceId: userId,
      }),
    );
  });

  it("uses unified path for project upload", async () => {
    await uploadImage(userId, projectId, buildFile(), "Projeto");

    expect(mockStorageRef).toHaveBeenCalledWith(
      {},
      `users/${userId}/images/${imageId}.webp`,
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: imageId }),
      expect.objectContaining({
        storagePath: `users/${userId}/images/${imageId}.webp`,
        projectId,
        workspaceId: userId,
      }),
    );
  });

  it("validates quota with original File.size before compression", async () => {
    const callOrder = [];
    assertCanUploadImage.mockImplementation(async () => {
      callOrder.push("assert");
    });
    convertToWebp.mockImplementation(async () => {
      callOrder.push("convert");
      return webpBlob;
    });

    await uploadImage(userId, null, buildFile(ORIGINAL_FILE_SIZE), "Quota");

    expect(assertCanUploadImage).toHaveBeenCalledWith(
      userId,
      ORIGINAL_FILE_SIZE,
    );
    expect(callOrder).toEqual(["assert", "convert"]);
  });

  it("persists originalSizeBytes and storedSizeBytes separately", async () => {
    const result = await uploadImage(
      userId,
      null,
      buildFile(ORIGINAL_FILE_SIZE),
      "Sizes",
    );

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        originalSizeBytes: ORIGINAL_FILE_SIZE,
        storedSizeBytes: webpBlob.size,
        sizeBytes: webpBlob.size,
      }),
    );
    expect(result.originalSizeBytes).toBe(ORIGINAL_FILE_SIZE);
    expect(result.storedSizeBytes).toBe(webpBlob.size);
    expect(result.sizeBytes).toBe(webpBlob.size);
  });

  it("does not upload when quota assert rejects", async () => {
    assertCanUploadImage.mockRejectedValue(
      Object.assign(new Error("storage"), { code: "STORAGE_LIMIT" }),
    );

    await expect(
      uploadImage(userId, null, buildFile(), "Blocked"),
    ).rejects.toMatchObject({ code: "STORAGE_LIMIT" });

    expect(convertToWebp).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe("replaceImageFile storage path", () => {
  beforeEach(() => {
    convertToWebp.mockReset();
    convertToWebp.mockResolvedValue(webpBlob);
    assertCanReplaceImageStorage.mockReset();
    assertCanReplaceImageStorage.mockResolvedValue(undefined);
    mockDoc.mockReset();
    mockGetDoc.mockReset();
    mockUpdateDoc.mockReset();
    deleteImageFile.mockReset();
    updateProject.mockReset();

    mockDoc.mockImplementation((...segments) => ({
      path: segments.join("/"),
    }));
    mockUpdateDoc.mockResolvedValue(undefined);
    updateProject.mockResolvedValue(undefined);
    deleteImageFile.mockResolvedValue({ success: true });
    mockStorageRef.mockClear();
    mockGetDownloadURL.mockClear();
    mockGetDownloadURL.mockResolvedValue("https://storage.example/new.webp");
  });

  it("uploads to unified path when replacing legacy storagePath", async () => {
    const legacyPath = `users/${userId}/projects/${projectId}/images/${imageId}.webp`;

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildExistingImage({
          projectId,
          projectVisibility: "private",
          storagePath: legacyPath,
        }),
    });

    await replaceImageFile(userId, projectId, imageId, buildFile());

    expect(mockStorageRef).toHaveBeenCalledWith(
      {},
      `users/${userId}/images/${imageId}.webp`,
    );
    expect(deleteImageFile).toHaveBeenCalledWith(legacyPath);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        storagePath: `users/${userId}/images/${imageId}.webp`,
        originalUrl: "https://storage.example/new.webp",
        previewUrl: "https://storage.example/new.webp",
      }),
    );
  });

  it("asserts replace quota with original sizes before compression", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () => buildExistingImage({ storagePath: `users/${userId}/images/${imageId}.webp` }),
    });

    const callOrder = [];
    assertCanReplaceImageStorage.mockImplementation(async () => {
      callOrder.push("assert");
    });
    convertToWebp.mockImplementation(async () => {
      callOrder.push("convert");
      return webpBlob;
    });

    await replaceImageFile(userId, null, imageId, buildFile(9000));

    expect(assertCanReplaceImageStorage).toHaveBeenCalledWith(
      userId,
      9000,
      2048,
    );
    expect(callOrder).toEqual(["assert", "convert"]);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        originalSizeBytes: 9000,
        storedSizeBytes: webpBlob.size,
        sizeBytes: webpBlob.size,
      }),
    );
  });

  it("does not delete old file when replace uses same storagePath", async () => {
    const unifiedPath = `users/${userId}/images/${imageId}.webp`;

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () => buildExistingImage({ storagePath: unifiedPath }),
    });

    await replaceImageFile(userId, null, imageId, buildFile());

    expect(deleteImageFile).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        storagePath: unifiedPath,
      }),
    );
  });

  it("continues when legacy delete fails on replace", async () => {
    const legacyPath = `users/${userId}/projects/${projectId}/images/${imageId}.webp`;

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildExistingImage({
          projectId,
          storagePath: legacyPath,
        }),
    });
    deleteImageFile.mockResolvedValue({
      success: false,
      error: new Error("delete failed"),
    });

    await expect(
      replaceImageFile(userId, projectId, imageId, buildFile()),
    ).resolves.toMatchObject({
      image: expect.objectContaining({
        storagePath: `users/${userId}/images/${imageId}.webp`,
      }),
    });
  });
});
