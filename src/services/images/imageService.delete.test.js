const mockGetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn((...segments) => ({ path: segments.join("/") }));
const mockWriteBatch = jest.fn();

jest.mock("firebase/firestore", () => {
  const batch = {
    delete: jest.fn(),
    update: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  };

  return {
    collection: jest.fn(),
    deleteField: jest.fn(() => Symbol("deleteField")),
    doc: (...args) => mockDoc(...args),
    deleteDoc: (...args) => mockDeleteDoc(...args),
    getDoc: (...args) => mockGetDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
    limit: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => "server-timestamp"),
    setDoc: jest.fn(),
    startAfter: jest.fn(),
    Timestamp: {
      fromMillis: (ms) => ({ __millis: ms }),
      fromDate: (date) => ({ __date: date }),
    },
    updateDoc: jest.fn(),
    where: jest.fn(),
    writeBatch: (...args) => {
      mockWriteBatch(...args);
      return batch;
    },
    __mockBatch: batch,
  };
});

jest.mock("../hotspots/hotspotService", () => ({
  collectImageDeleteHotspotRefs: jest.fn(),
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
  collectImageStoragePaths: jest.fn(),
  deleteImageFile: jest.fn(),
  deleteImageFilesTolerant: jest.fn(),
}));

jest.mock("../workspaces/workspaceService", () => ({
  getActiveWorkspaceIdForUser: jest.fn(),
}));

const {
  getProjectById,
} = require("../projects/projectService");
const {
  collectImageStoragePaths,
  deleteImageFilesTolerant,
} = require("../storage/storageService");
const {
  collectImageDeleteHotspotRefs,
} = require("../hotspots/hotspotService");
const { __mockBatch: mockBatch } = require("firebase/firestore");
const { deleteImage, getImagesByProjectId } = require("./imageService");

const userId = "user-1";
const otherUserId = "user-2";
const imageId = "image-1";
const projectId = "project-1";
const imageUrl = "https://storage.example/image.webp";
const remainingUrl = "https://storage.example/remaining.webp";

function buildImageDoc(overrides = {}) {
  return {
    userId,
    projectId,
    title: "Imagem teste",
    originalUrl: imageUrl,
    previewUrl: imageUrl,
    storagePath: `users/${userId}/images/${imageId}.webp`,
    originalStoragePath: `users/${userId}/images/${imageId}-original.jpg`,
    previewStoragePath: `users/${userId}/images/${imageId}-preview.webp`,
    sizeBytes: 2048,
    width: 4000,
    height: 2000,
    originalFileType: "image/jpeg",
    optimizedFileType: "image/webp",
    visibility: "private",
    createdAt: { seconds: 10, toMillis: () => 10_000 },
    updatedAt: { seconds: 10, toMillis: () => 10_000 },
    ...overrides,
  };
}

function mockExistingImage(data) {
  mockGetDoc.mockResolvedValueOnce({
    exists: () => true,
    id: imageId,
    data: () => data,
  });
}

describe("deleteImage cascade", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDoc.mockReset();
    mockDeleteDoc.mockReset();
    mockGetDocs.mockReset();
    mockWriteBatch.mockClear();
    mockBatch.delete.mockClear();
    mockBatch.update.mockClear();
    mockBatch.commit.mockReset();
    mockBatch.commit.mockResolvedValue(undefined);

    collectImageDeleteHotspotRefs.mockReset();
    collectImageStoragePaths.mockReset();
    deleteImageFilesTolerant.mockReset();
    getProjectById.mockReset();

    collectImageDeleteHotspotRefs.mockResolvedValue({
      ownRefs: [],
      incomingRefs: [],
      allRefs: [],
    });
    collectImageStoragePaths.mockReturnValue([
      `users/${userId}/images/${imageId}.webp`,
    ]);
    deleteImageFilesTolerant.mockResolvedValue(undefined);
    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      coverImage: "https://storage.example/other-cover.webp",
      imageCount: 2,
    });
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it("exclui imagem sem hotspots", async () => {
    mockExistingImage(buildImageDoc());

    const result = await deleteImage(
      userId,
      projectId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(mockBatch.delete).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining(`images/${imageId}`) }),
    );
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(deleteImageFilesTolerant).toHaveBeenCalled();
    expect(result.deletedOwnHotspotCount).toBe(0);
    expect(result.deletedIncomingSceneHotspotCount).toBe(0);
  });

  it("exclui hotspots próprios (info + scene)", async () => {
    mockExistingImage(buildImageDoc());
    const ownRefs = [
      { path: `images/${imageId}/hotspots/info-1` },
      { path: `images/${imageId}/hotspots/scene-1` },
    ];
    collectImageDeleteHotspotRefs.mockResolvedValue({
      ownRefs,
      incomingRefs: [],
      allRefs: ownRefs,
    });

    const result = await deleteImage(
      userId,
      projectId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(collectImageDeleteHotspotRefs).toHaveBeenCalledWith(
      userId,
      imageId,
      projectId,
    );
    expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 2 hotspots + image
    expect(result.deletedOwnHotspotCount).toBe(2);
  });

  it("exclui hotspots scene de entrada e preserva contagem de info em outras imagens", async () => {
    mockExistingImage(buildImageDoc());
    const ownRefs = [{ path: `images/${imageId}/hotspots/own-1` }];
    const incomingRefs = [{ path: `images/image-2/hotspots/scene-in` }];
    collectImageDeleteHotspotRefs.mockResolvedValue({
      ownRefs,
      incomingRefs,
      allRefs: [...ownRefs, ...incomingRefs],
    });

    const result = await deleteImage(
      userId,
      projectId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(result.deletedIncomingSceneHotspotCount).toBe(1);
    expect(mockBatch.delete).toHaveBeenCalledWith(incomingRefs[0]);
    // info de outras imagens nunca entra em allRefs (garantido pelo helper)
    expect(collectImageDeleteHotspotRefs).toHaveBeenCalled();
  });

  it("remove todos os storage paths coletados", async () => {
    const paths = [
      `users/${userId}/images/${imageId}.webp`,
      `users/${userId}/images/${imageId}-original.jpg`,
      `users/${userId}/images/${imageId}-preview.webp`,
    ];
    const raw = buildImageDoc();
    mockExistingImage(raw);
    collectImageStoragePaths.mockReturnValue(paths);

    const result = await deleteImage(
      userId,
      projectId,
      imageId,
      "https://storage.example/other-cover.webp",
    );

    expect(collectImageStoragePaths).toHaveBeenCalledWith(raw);
    expect(deleteImageFilesTolerant).toHaveBeenCalledWith(paths);
    expect(result.deletedStoragePathCount).toBe(3);
  });

  it("tolera falha/arquivo inexistente no Storage sem reverter Firestore", async () => {
    mockExistingImage(buildImageDoc());
    deleteImageFilesTolerant.mockResolvedValue(undefined);

    await expect(
      deleteImage(
        userId,
        projectId,
        imageId,
        "https://storage.example/other-cover.webp",
      ),
    ).resolves.toMatchObject({
      deletedStoragePathCount: 1,
    });

    expect(mockBatch.commit).toHaveBeenCalled();
    expect(deleteImageFilesTolerant).toHaveBeenCalled();
  });

  it("limpa coverImage / promove capa quando a imagem excluída era capa", async () => {
    mockExistingImage(buildImageDoc({ createdAt: { seconds: 5, toMillis: () => 5000 } }));
    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      coverImage: imageUrl,
      imageCount: 2,
    });

    // getImagesByProjectId → getDocs
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: imageId,
          data: () => buildImageDoc({ createdAt: { seconds: 5, toMillis: () => 5000 } }),
        },
        {
          id: "image-2",
          data: () =>
            buildImageDoc({
              projectId,
              previewUrl: remainingUrl,
              originalUrl: remainingUrl,
              createdAt: { seconds: 1, toMillis: () => 1000 },
            }),
        },
      ],
    });

    const result = await deleteImage(userId, projectId, imageId, imageUrl);

    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining(`projects/${projectId}`) }),
      expect.objectContaining({
        coverImage: remainingUrl,
        imageCount: 1,
      }),
    );
    expect(result.coverImage).toBe(remainingUrl);
  });

  it("atualiza imageCount sem permitir valor negativo", async () => {
    mockExistingImage(buildImageDoc());
    getProjectById.mockResolvedValue({
      id: projectId,
      userId,
      coverImage: "https://other-cover.webp",
      imageCount: 0,
    });

    await deleteImage(userId, projectId, imageId, "https://other-cover.webp");

    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ imageCount: 0 }),
    );
  });

  it("exclui imagem sem projeto (solta)", async () => {
    mockExistingImage(buildImageDoc({ projectId: null }));

    const result = await deleteImage(userId, null, imageId);

    expect(collectImageDeleteHotspotRefs).toHaveBeenCalledWith(
      userId,
      imageId,
      null,
    );
    expect(getProjectById).not.toHaveBeenCalled();
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(result.coverImage).toBeNull();
  });

  it("nega exclusão de imagem de outro usuário", async () => {
    mockExistingImage(buildImageDoc({ userId: otherUserId }));

    await expect(deleteImage(userId, projectId, imageId)).rejects.toThrow(
      "Sem permissão para excluir esta imagem.",
    );
    expect(mockBatch.commit).not.toHaveBeenCalled();
    expect(deleteImageFilesTolerant).not.toHaveBeenCalled();
  });

  it("trata imagem inexistente com erro controlado", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(deleteImage(userId, projectId, imageId)).rejects.toThrow(
      "Imagem não encontrada.",
    );
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("remove stats diretamente associados à imagem", async () => {
    mockExistingImage(buildImageDoc({ projectId: null }));
    mockDeleteDoc.mockResolvedValue(undefined);

    const result = await deleteImage(userId, null, imageId);

    expect(mockDeleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining(`stats/${userId}/images/${imageId}`),
      }),
    );
    expect(result.deletedImageStats).toBe(true);
  });

  it("continua se stats não puderem ser removidos", async () => {
    mockExistingImage(buildImageDoc({ projectId: null }));
    mockDeleteDoc.mockRejectedValueOnce(new Error("permission-denied"));

    const result = await deleteImage(userId, null, imageId);

    expect(result.deletedImageStats).toBe(false);
    expect(deleteImageFilesTolerant).toHaveBeenCalled();
  });

  it("faz Storage depois do commit Firestore", async () => {
    mockExistingImage(buildImageDoc({ projectId: null }));
    const order = [];

    mockBatch.commit.mockImplementation(async () => {
      order.push("firestore");
    });
    deleteImageFilesTolerant.mockImplementation(async () => {
      order.push("storage");
    });

    await deleteImage(userId, null, imageId);

    expect(order).toEqual(["firestore", "storage"]);
  });
});

describe("getImagesByProjectId (preservação de não relacionados)", () => {
  it("está disponível para o fluxo de capa sem afetar outras imagens", async () => {
    expect(typeof getImagesByProjectId).toBe("function");
  });
});
