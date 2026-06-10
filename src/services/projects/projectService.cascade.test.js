import { deleteProjectCascade } from "./projectService";

const mockDeleteDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn((...segments) => ({ path: segments.join("/") }));
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: (...args) => mockCollection(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: (...args) => mockQuery(...args),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
  where: (...args) => mockWhere(...args),
}));

jest.mock("../../config/firebase", () => ({ db: {} }));

jest.mock("../images/imageService", () => ({
  getImagesByProjectId: jest.fn(),
}));

jest.mock("../hotspots/hotspotService", () => ({
  deleteAllHotspotsForImage: jest.fn(),
}));

jest.mock("../storage/storageService", () => ({
  collectImageStoragePaths: jest.fn((image) =>
    image.storagePath ? [image.storagePath] : [],
  ),
  deleteImageFilesTolerant: jest.fn(),
}));

const { getImagesByProjectId } = require("../images/imageService");
const { deleteAllHotspotsForImage } = require("../hotspots/hotspotService");
const { deleteImageFilesTolerant } = require("../storage/storageService");

describe("deleteProjectCascade", () => {
  const userId = "user-1";
  const projectId = "project-1";

  beforeEach(() => {
    mockDeleteDoc.mockReset();
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDoc.mockReset();
    mockDoc.mockClear();
    deleteAllHotspotsForImage.mockReset();
    deleteAllHotspotsForImage.mockResolvedValue(1);
    deleteImageFilesTolerant.mockReset();
    deleteImageFilesTolerant.mockResolvedValue(undefined);
    getImagesByProjectId.mockReset();
  });

  it("rejects when project does not belong to the user", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: projectId,
      data: () => ({ userId: "other-user", title: "Projeto" }),
    });

    await expect(deleteProjectCascade(projectId, userId)).rejects.toThrow(
      "Sem permissão para excluir este projeto.",
    );
  });

  it("deletes images, hotspots, storage files and project document", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: projectId,
      data: () => ({ userId, title: "Projeto Teste" }),
    });

    getImagesByProjectId.mockResolvedValue([
      {
        id: "img-1",
        userId,
        projectId,
        storagePath: "users/user-1/projects/project-1/images/img-1.webp",
        sizeBytes: 1000,
      },
      {
        id: "img-2",
        userId,
        projectId,
        storagePath: "users/user-1/projects/project-1/images/img-2.webp",
        sizeBytes: 2000,
      },
    ]);

    const result = await deleteProjectCascade(projectId, userId);

    expect(deleteAllHotspotsForImage).toHaveBeenCalledTimes(2);
    expect(deleteAllHotspotsForImage).toHaveBeenCalledWith("img-1");
    expect(deleteAllHotspotsForImage).toHaveBeenCalledWith("img-2");
    expect(deleteImageFilesTolerant).toHaveBeenCalledTimes(2);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
    expect(mockDoc).toHaveBeenCalledWith({}, "images", "img-1");
    expect(mockDoc).toHaveBeenCalledWith({}, "images", "img-2");
    expect(mockDoc).toHaveBeenCalledWith({}, "projects", projectId);
    expect(result).toEqual({
      deletedImageCount: 2,
      deletedStorageBytes: 3000,
      deletedHotspotCount: 2,
      imageIds: ["img-1", "img-2"],
    });
  });

  it("continues cascade when storage deletion is tolerant", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: projectId,
      data: () => ({ userId, title: "Projeto" }),
    });

    getImagesByProjectId.mockResolvedValue([
      {
        id: "img-1",
        userId,
        projectId,
        storagePath: "missing.webp",
        sizeBytes: 500,
      },
    ]);

    deleteImageFilesTolerant.mockResolvedValue(undefined);

    await expect(deleteProjectCascade(projectId, userId)).resolves.toMatchObject({
      deletedImageCount: 1,
      imageIds: ["img-1"],
    });

    expect(mockDoc).toHaveBeenCalledWith({}, "images", "img-1");
    expect(mockDoc).toHaveBeenCalledWith({}, "projects", projectId);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
  });

  it("throws when firestore image deletion fails", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: projectId,
      data: () => ({ userId, title: "Projeto" }),
    });

    getImagesByProjectId.mockResolvedValue([
      { id: "img-1", userId, projectId, storagePath: "a.webp", sizeBytes: 1 },
    ]);

    mockDeleteDoc.mockRejectedValueOnce(new Error("permission-denied"));

    await expect(deleteProjectCascade(projectId, userId)).rejects.toThrow(
      "Não foi possível excluir as imagens do projeto.",
    );

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});
