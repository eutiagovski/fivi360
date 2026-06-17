const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn((...segments) => ({ path: segments.join("/") }));

jest.mock("firebase/firestore", () => {
  const batch = {
    delete: jest.fn(),
    update: jest.fn(),
    commit: jest.fn(),
  };

  return {
    collection: jest.fn(),
    deleteField: jest.fn(() => Symbol("deleteField")),
    doc: (...args) => mockDoc(...args),
    getDoc: (...args) => mockGetDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => "server-timestamp"),
    setDoc: jest.fn(),
    updateDoc: (...args) => mockUpdateDoc(...args),
    where: jest.fn(),
    writeBatch: () => batch,
    __mockBatch: batch,
  };
});

jest.mock("../hotspots/hotspotService", () => ({
  collectSceneHotspotDeletionRefs: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  db: {},
  storage: {},
}));

jest.mock("firebase/storage", () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
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
  deleteImageFile: jest.fn(),
  relocateImageFile: jest.fn(),
}));

const { getProjectById, adjustProjectImageCount } = require("../projects/projectService");
const { relocateImageFile } = require("../storage/storageService");
const { collectSceneHotspotDeletionRefs } = require("../hotspots/hotspotService");
const { __mockBatch: mockBatch } = require("firebase/firestore");
const {
  moveImageToProject,
  moveImageToUnassigned,
} = require("./imageService");

const userId = "user-1";
const imageId = "image-1";
const projectId = "project-1";
const looseStoragePath = `users/${userId}/images/${imageId}.webp`;
const legacyStoragePath = `users/${userId}/projects/${projectId}/images/${imageId}.webp`;
const imageUrl = "https://storage.example/image.webp";

function buildImageDoc(overrides = {}) {
  return {
    userId,
    projectId: null,
    title: "Imagem teste",
    originalUrl: imageUrl,
    previewUrl: imageUrl,
    storagePath: looseStoragePath,
    sizeBytes: 1024,
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

describe("moveImageToProject", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockGetDocs.mockReset();
    relocateImageFile.mockReset();
    getProjectById.mockReset();
    adjustProjectImageCount.mockReset();
    mockUpdateDoc.mockResolvedValue(undefined);
    adjustProjectImageCount.mockResolvedValue(undefined);
  });

  it("updates only Firestore when moving loose image to project", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () => buildImageDoc(),
    });

    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      visibility: "private",
      coverImage: "https://storage.example/existing-cover.webp",
    });

    const result = await moveImageToProject(userId, imageId, projectId);

    expect(relocateImageFile).not.toHaveBeenCalled();

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: `[object Object]/images/${imageId}` },
      expect.objectContaining({
        projectId,
        projectVisibility: "private",
      }),
    );

    expect(result.image).toMatchObject({
      id: imageId,
      projectId,
      storagePath: looseStoragePath,
      originalUrl: imageUrl,
      previewUrl: imageUrl,
      title: "Imagem teste",
      sizeBytes: 1024,
      width: 4000,
      height: 2000,
    });
    expect(result.coverImage).toBeNull();
  });

  it("sets project cover with existing URL when project has no cover", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () => buildImageDoc(),
    });

    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      visibility: "shared",
      coverImage: "",
    });

    const result = await moveImageToProject(userId, imageId, projectId);

    expect(adjustProjectImageCount).toHaveBeenCalledWith(projectId, 1, {
      coverImage: imageUrl,
    });
    expect(result.coverImage).toBe(imageUrl);
  });

  it("keeps legacy storagePath unchanged when moving legacy loose image", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          storagePath: legacyStoragePath,
        }),
    });

    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      visibility: "private",
      coverImage: "",
    });

    const result = await moveImageToProject(userId, imageId, projectId);

    expect(relocateImageFile).not.toHaveBeenCalled();
    expect(result.image.storagePath).toBe(legacyStoragePath);
    expect(result.image.originalUrl).toBe(imageUrl);
  });
});

describe("moveImageToUnassigned", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockGetDocs.mockReset();
    mockBatch.delete.mockReset();
    mockBatch.update.mockReset();
    mockBatch.commit.mockReset();
    relocateImageFile.mockReset();
    adjustProjectImageCount.mockReset();
    collectSceneHotspotDeletionRefs.mockReset();
    mockUpdateDoc.mockResolvedValue(undefined);
    adjustProjectImageCount.mockResolvedValue(undefined);
    mockBatch.commit.mockResolvedValue(undefined);
    collectSceneHotspotDeletionRefs.mockResolvedValue([]);
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it("commits scene hotspot cleanup and image update atomically", async () => {
    const sceneRef = { path: "images/image-1/hotspots/scene-1" };

    collectSceneHotspotDeletionRefs.mockResolvedValue([sceneRef]);

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          storagePath: legacyStoragePath,
        }),
    });

    const result = await moveImageToUnassigned(
      userId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(collectSceneHotspotDeletionRefs).toHaveBeenCalledWith(
      userId,
      imageId,
      projectId,
    );
    expect(mockBatch.delete).toHaveBeenCalledWith(sceneRef);
    expect(mockBatch.update).toHaveBeenCalledWith(
      { path: `[object Object]/images/${imageId}` },
      expect.objectContaining({
        projectId: null,
      }),
    );
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(result.image.projectId).toBeNull();
  });

  it("does not move image when batch commit fails", async () => {
    collectSceneHotspotDeletionRefs.mockResolvedValue([
      { path: "images/image-1/hotspots/scene-1" },
    ]);
    mockBatch.commit.mockRejectedValue(new Error("batch failed"));

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
        }),
    });

    await expect(
      moveImageToUnassigned(userId, imageId, ""),
    ).rejects.toThrow("batch failed");

    expect(adjustProjectImageCount).not.toHaveBeenCalled();
  });

  it("updates only Firestore when moving project image to loose gallery", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          storagePath: legacyStoragePath,
        }),
    });

    const result = await moveImageToUnassigned(
      userId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(relocateImageFile).not.toHaveBeenCalled();

    expect(mockBatch.update).toHaveBeenCalledWith(
      { path: `[object Object]/images/${imageId}` },
      expect.objectContaining({
        projectId: null,
      }),
    );
    expect(mockBatch.commit).toHaveBeenCalled();

    expect(result.image).toMatchObject({
      id: imageId,
      projectId: null,
      storagePath: legacyStoragePath,
      originalUrl: imageUrl,
      previewUrl: imageUrl,
      title: "Imagem teste",
    });
    expect(result.coverImage).toBeNull();
  });

  it("promotes oldest remaining image cover when moved image was cover", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          storagePath: legacyStoragePath,
        }),
    });

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "image-2",
          data: () => ({
            userId,
            projectId,
            title: "Mais antiga",
            originalUrl: "https://storage.example/remaining.webp",
            previewUrl: "https://storage.example/remaining.webp",
            createdAt: { seconds: 1 },
          }),
        },
      ],
    });

    const result = await moveImageToUnassigned(userId, imageId, imageUrl);

    expect(adjustProjectImageCount).toHaveBeenCalledWith(projectId, -1, {
      coverImage: "https://storage.example/remaining.webp",
    });
    expect(result.coverImage).toBe("https://storage.example/remaining.webp");
  });

  it("keeps unified storagePath when moving from project to gallery", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          storagePath: looseStoragePath,
        }),
    });

    const result = await moveImageToUnassigned(userId, imageId, "");

    expect(relocateImageFile).not.toHaveBeenCalled();
    expect(result.image.storagePath).toBe(looseStoragePath);
    expect(result.image.projectId).toBeNull();
  });
});
