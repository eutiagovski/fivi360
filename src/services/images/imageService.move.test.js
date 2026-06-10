import {
  moveImageToProject,
  moveImageToUnassigned,
} from "./imageService";

const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn((...segments) => ({ path: segments.join("/") }));

jest.mock("firebase/firestore", () => ({
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
}));

jest.mock("../plans/planService", () => ({
  assertCanReplaceImageStorage: jest.fn(),
  assertCanUploadImage: jest.fn(),
}));

jest.mock("../storage/storageService", () => ({
  deleteImageFile: jest.fn(),
  relocateImageFile: jest.fn(),
}));

const { getProjectById, updateProject } = require("../projects/projectService");
const { relocateImageFile } = require("../storage/storageService");

const userId = "user-1";
const imageId = "image-1";
const projectId = "project-1";

function buildImageDoc(overrides = {}) {
  return {
    userId,
    projectId: null,
    title: "Imagem teste",
    originalUrl: "https://storage.example/old.webp",
    previewUrl: "https://storage.example/old.webp",
    storagePath: `users/${userId}/images/${imageId}.webp`,
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
    updateProject.mockReset();
    mockUpdateDoc.mockResolvedValue(undefined);
    updateProject.mockResolvedValue(undefined);
    relocateImageFile.mockResolvedValue({
      downloadUrl: "https://storage.example/new-project.webp",
      storagePath: `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
    });
  });

  it("relocates storage and updates Firestore when moving loose image to project", async () => {
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

    expect(relocateImageFile).toHaveBeenCalledWith(
      "https://storage.example/old.webp",
      `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
      `users/${userId}/images/${imageId}.webp`,
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: `[object Object]/images/${imageId}` },
      expect.objectContaining({
        projectId,
        projectVisibility: "private",
        storagePath: `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
        originalUrl: "https://storage.example/new-project.webp",
        previewUrl: "https://storage.example/new-project.webp",
      }),
    );

    expect(result.image).toMatchObject({
      id: imageId,
      projectId,
      storagePath: `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
      originalUrl: "https://storage.example/new-project.webp",
      previewUrl: "https://storage.example/new-project.webp",
      title: "Imagem teste",
      sizeBytes: 1024,
      width: 4000,
      height: 2000,
    });
    expect(result.coverImage).toBeNull();
  });

  it("sets project cover with new URL when project has no cover", async () => {
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

    expect(updateProject).toHaveBeenCalledWith(projectId, {
      coverImage: "https://storage.example/new-project.webp",
    });
    expect(result.coverImage).toBe("https://storage.example/new-project.webp");
  });

  it("does not update Firestore when storage relocation fails", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () => buildImageDoc(),
    });

    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      visibility: "private",
      coverImage: "",
    });

    relocateImageFile.mockRejectedValue(new Error("upload failed"));

    await expect(
      moveImageToProject(userId, imageId, projectId),
    ).rejects.toThrow("upload failed");

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("moveImageToUnassigned", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockGetDocs.mockReset();
    relocateImageFile.mockReset();
    updateProject.mockReset();
    mockUpdateDoc.mockResolvedValue(undefined);
    updateProject.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });
    relocateImageFile.mockResolvedValue({
      downloadUrl: "https://storage.example/new-loose.webp",
      storagePath: `users/${userId}/images/${imageId}.webp`,
    });
  });

  it("relocates storage and clears projectId when moving to loose gallery", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          originalUrl: "https://storage.example/project.webp",
          previewUrl: "https://storage.example/project.webp",
          storagePath: `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
        }),
    });

    const result = await moveImageToUnassigned(
      userId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(relocateImageFile).toHaveBeenCalledWith(
      "https://storage.example/project.webp",
      `users/${userId}/images/${imageId}.webp`,
      `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: `[object Object]/images/${imageId}` },
      expect.objectContaining({
        projectId: null,
        storagePath: `users/${userId}/images/${imageId}.webp`,
        originalUrl: "https://storage.example/new-loose.webp",
        previewUrl: "https://storage.example/new-loose.webp",
      }),
    );

    expect(result.image).toMatchObject({
      id: imageId,
      projectId: null,
      storagePath: `users/${userId}/images/${imageId}.webp`,
      title: "Imagem teste",
    });
    expect(result.coverImage).toBeNull();
  });

  it("promotes oldest remaining image cover when moved image was cover", async () => {
    const coverUrl = "https://storage.example/project.webp";

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: imageId,
      data: () =>
        buildImageDoc({
          projectId,
          projectVisibility: "private",
          originalUrl: coverUrl,
          previewUrl: coverUrl,
          storagePath: `users/${userId}/projects/${projectId}/images/${imageId}.webp`,
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

    const result = await moveImageToUnassigned(userId, imageId, coverUrl);

    expect(updateProject).toHaveBeenCalledWith(projectId, {
      coverImage: "https://storage.example/remaining.webp",
    });
    expect(result.coverImage).toBe("https://storage.example/remaining.webp");
  });
});
