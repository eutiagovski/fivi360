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

const { getProjectById, updateProject } = require("../projects/projectService");
const { deleteImageFile } = require("../storage/storageService");
const { convertToWebp } = require("@/utils/imageConversion");

const webpBlob = { size: 1024, type: "image/webp" };

const userId = "user-1";
const projectId = "project-1";
const imageId = "image-new";

function buildFile() {
  return new File(["data"], "panorama.jpg", { type: "image/jpeg" });
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
    convertToWebp.mockResolvedValue(webpBlob);
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
});

describe("replaceImageFile storage path", () => {
  beforeEach(() => {
    convertToWebp.mockResolvedValue(webpBlob);
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
