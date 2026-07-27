import {
  collectSceneHotspotDeletionRefs,
  collectOwnHotspotDeletionRefs,
  collectIncomingSceneHotspotDeletionRefs,
  collectImageDeleteHotspotRefs,
  hasRelatedSceneHotspots,
  HOTSPOT_TYPE_INFO,
  HOTSPOT_TYPE_SCENE,
} from "./hotspotService";

const mockDoc = jest.fn((...segments) => ({ path: segments.join("/") }));
const mockGetDocs = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((db, ...segments) => ({ path: segments.join("/") })),
  doc: (...args) => mockDoc(...args),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: (...args) => mockGetDocs(...args),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  db: {},
}));

jest.mock("../images/imageService", () => ({
  getImageById: jest.fn(),
  getImagesByProjectId: jest.fn(),
}));

jest.mock("../plans/planService", () => ({
  assertHotspotsEnabled: jest.fn(),
}));

const { getImagesByProjectId } = require("../images/imageService");

const userId = "user-1";
const projectId = "project-1";
const imageA = "image-a";
const imageB = "image-b";

function buildHotspotDoc(id, type, extra = {}) {
  return {
    id,
    ref: { path: `images/${extra.imageId ?? imageA}/hotspots/${id}` },
    data: () => ({
      imageId: extra.imageId ?? imageA,
      userId,
      projectId,
      type,
      pitch: 0,
      yaw: 0,
      createdAt: { toMillis: () => 1 },
      ...extra,
    }),
  };
}

describe("collectSceneHotspotDeletionRefs", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDocs.mockReset();
    getImagesByProjectId.mockReset();
  });

  it("returns own scene hotspots and incoming scene hotspots from other images", async () => {
    getImagesByProjectId.mockResolvedValue([
      { id: imageA, userId, projectId },
      { id: imageB, userId, projectId },
    ]);

    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          buildHotspotDoc("scene-own", HOTSPOT_TYPE_SCENE, {
            imageId: imageA,
            targetImageId: imageB,
          }),
          buildHotspotDoc("info-own", HOTSPOT_TYPE_INFO, {
            imageId: imageA,
            title: "Info",
          }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          buildHotspotDoc("scene-in", HOTSPOT_TYPE_SCENE, {
            imageId: imageB,
            targetImageId: imageA,
          }),
        ],
      });

    const refs = await collectSceneHotspotDeletionRefs(userId, imageA, projectId);

    expect(refs).toHaveLength(2);
    expect(refs[0].path).toContain(`images/${imageA}/hotspots/scene-own`);
    expect(refs[1].path).toContain(`images/${imageB}/hotspots/scene-in`);
  });

  it("returns empty list when no scene hotspots are related", async () => {
    getImagesByProjectId.mockResolvedValue([
      { id: imageA, userId, projectId },
    ]);

    mockGetDocs.mockResolvedValue({
      docs: [
        buildHotspotDoc("info-only", HOTSPOT_TYPE_INFO, {
          imageId: imageA,
          title: "Info",
        }),
      ],
    });

    const refs = await collectSceneHotspotDeletionRefs(userId, imageA, projectId);

    expect(refs).toEqual([]);
    expect(await hasRelatedSceneHotspots(userId, imageA, projectId)).toBe(false);
  });
});

describe("collectImageDeleteHotspotRefs", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDocs.mockReset();
    getImagesByProjectId.mockReset();
  });

  it("coleta todos os hotspots próprios e apenas scene de entrada", async () => {
    getImagesByProjectId.mockResolvedValue([
      { id: imageA, userId, projectId },
      { id: imageB, userId, projectId },
    ]);

    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          buildHotspotDoc("info-own", HOTSPOT_TYPE_INFO, {
            imageId: imageA,
            title: "Info",
          }),
          buildHotspotDoc("scene-own", HOTSPOT_TYPE_SCENE, {
            imageId: imageA,
            targetImageId: imageB,
          }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          buildHotspotDoc("info-other", HOTSPOT_TYPE_INFO, {
            imageId: imageB,
            title: "Keep me",
          }),
          buildHotspotDoc("scene-in", HOTSPOT_TYPE_SCENE, {
            imageId: imageB,
            targetImageId: imageA,
          }),
        ],
      });

    const { ownRefs, incomingRefs, allRefs } = await collectImageDeleteHotspotRefs(
      userId,
      imageA,
      projectId,
    );

    expect(ownRefs).toHaveLength(2);
    expect(incomingRefs).toHaveLength(1);
    expect(incomingRefs[0].path).toContain(`images/${imageB}/hotspots/scene-in`);
    expect(allRefs).toHaveLength(3);
    expect(allRefs.map((ref) => ref.path).join(" ")).not.toContain("info-other");
  });

  it("sem projectId não busca scene de entrada", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        buildHotspotDoc("info-own", HOTSPOT_TYPE_INFO, {
          imageId: imageA,
          title: "Info",
        }),
      ],
    });

    const result = await collectImageDeleteHotspotRefs(userId, imageA, null);

    expect(result.ownRefs).toHaveLength(1);
    expect(result.incomingRefs).toEqual([]);
    expect(getImagesByProjectId).not.toHaveBeenCalled();
  });
});

describe("collectOwnHotspotDeletionRefs / collectIncomingSceneHotspotDeletionRefs", () => {
  beforeEach(() => {
    mockDoc.mockImplementation((...segments) => ({ path: segments.join("/") }));
    mockGetDocs.mockReset();
    getImagesByProjectId.mockReset();
  });

  it("collectOwnHotspotDeletionRefs retorna refs da subcoleção", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        buildHotspotDoc("h1", HOTSPOT_TYPE_INFO, { imageId: imageA }),
        buildHotspotDoc("h2", HOTSPOT_TYPE_SCENE, {
          imageId: imageA,
          targetImageId: imageB,
        }),
      ],
    });

    const refs = await collectOwnHotspotDeletionRefs(imageA);
    expect(refs).toHaveLength(2);
  });

  it("collectIncomingSceneHotspotDeletionRefs ignora hotspots info", async () => {
    getImagesByProjectId.mockResolvedValue([
      { id: imageA, userId, projectId },
      { id: imageB, userId, projectId },
    ]);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        buildHotspotDoc("info-other", HOTSPOT_TYPE_INFO, {
          imageId: imageB,
          title: "Keep",
        }),
        buildHotspotDoc("scene-in", HOTSPOT_TYPE_SCENE, {
          imageId: imageB,
          targetImageId: imageA,
        }),
      ],
    });

    const refs = await collectIncomingSceneHotspotDeletionRefs(
      userId,
      imageA,
      projectId,
    );

    expect(refs).toHaveLength(1);
    expect(refs[0].path).toContain("scene-in");
  });
});
