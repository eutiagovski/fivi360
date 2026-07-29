jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((...segments) => ({ path: segments.join("/"), id: segments.at(-1) })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  increment: jest.fn(),
  limit: jest.fn((n) => ({ type: "limit", n })),
  orderBy: jest.fn((...args) => ({ type: "orderBy", args })),
  query: jest.fn((...args) => ({ type: "query", args })),
  serverTimestamp: jest.fn(),
  startAfter: jest.fn((value) => ({ type: "startAfter", value })),
  Timestamp: {
    fromMillis: (ms) => ({ __millis: ms }),
    fromDate: (date) => ({ __date: date }),
  },
  updateDoc: jest.fn(),
  where: jest.fn((...args) => ({ type: "where", args })),
}));

jest.mock("../../config/firebase", () => ({ db: {} }));

jest.mock("../images/imageService", () => ({
  getImagesByProjectId: jest.fn(),
}));

jest.mock("../hotspots/hotspotService", () => ({
  deleteAllHotspotsForImage: jest.fn(),
}));

jest.mock("../storage/storageService", () => ({
  collectImageStoragePaths: jest.fn(),
  deleteImageFilesTolerant: jest.fn(),
}));

jest.mock("../plans/planService", () => ({
  assertCanCreateProject: jest.fn(),
  assertPublicVisibilityEnabled: jest.fn(),
}));

jest.mock("../workspaces/workspaceService", () => ({
  getActiveWorkspaceIdForUser: jest.fn(),
}));

import { getDoc, getDocs, startAfter } from "firebase/firestore";
import {
  getProjectsPageByUserId,
  mapProjectToCard,
} from "./projectService";

describe("mapProjectToCard", () => {
  it("maps imageCount from project document to card images field", () => {
    const card = mapProjectToCard({
      id: "project-1",
      title: "Meu projeto",
      coverImage: "https://example.com/cover.webp",
      visibility: "private",
      imageCount: 7,
    });

    expect(card).toMatchObject({
      id: "project-1",
      name: "Meu projeto",
      cover: "https://example.com/cover.webp",
      images: 7,
      status: "Privado",
    });
  });

  it("defaults images to 0 when imageCount is missing", () => {
    const card = mapProjectToCard({
      id: "project-2",
      title: "Sem contador",
      coverImage: "",
      visibility: "shared",
    });

    expect(card.images).toBe(0);
  });
});

describe("getProjectsPageByUserId pagination cursor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeDoc(id, updatedAtMs) {
    return {
      id,
      data: () => ({
        userId: "user-1",
        title: id,
        description: "",
        clientName: "",
        visibility: "private",
        coverImage: "",
        imageCount: 0,
        updatedAt: {
          toMillis: () => updatedAtMs,
          toDate: () => new Date(updatedAtMs),
        },
        createdAt: {
          toMillis: () => updatedAtMs,
          toDate: () => new Date(updatedAtMs),
        },
      }),
    };
  }

  it("returns first page with serializable cursor (no QueryDocumentSnapshot)", async () => {
    const docs = [
      makeDoc("p1", 3000),
      makeDoc("p2", 2000),
      makeDoc("p3", 1000),
    ];
    getDocs.mockResolvedValue({ docs });

    const result = await getProjectsPageByUserId("user-1", { limitCount: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.cursor).toEqual({
      id: "p2",
      sortValue: 2000,
    });
    expect(result.lastDoc).toBeUndefined();
    expect(result.items[0].updatedAt).toBeInstanceOf(Date);
  });

  it("uses getDoc + startAfter(snapshot) for next page when cursor doc exists", async () => {
    const cursorSnap = makeDoc("p2", 2000);
    getDoc.mockResolvedValue({
      exists: () => true,
      id: cursorSnap.id,
      data: cursorSnap.data,
    });
    getDocs.mockResolvedValue({ docs: [makeDoc("p3", 1000)] });

    const result = await getProjectsPageByUserId("user-1", {
      limitCount: 2,
      cursor: { id: "p2", sortValue: 2000 },
    });

    expect(getDoc).toHaveBeenCalled();
    expect(startAfter).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toEqual({ id: "p3", sortValue: 1000 });
  });

  it("falls back to startAfter(sortValue) when cursor doc was deleted", async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    getDocs.mockResolvedValue({ docs: [makeDoc("p3", 1000)] });

    await getProjectsPageByUserId("user-1", {
      limitCount: 2,
      cursor: { id: "deleted", sortValue: 2000 },
    });

    expect(startAfter).toHaveBeenCalledWith({ __millis: 2000 });
  });

  it("ignores invalid cursor and loads from the start", async () => {
    getDocs.mockResolvedValue({ docs: [makeDoc("p1", 3000)] });

    const result = await getProjectsPageByUserId("user-1", {
      limitCount: 2,
      cursor: { id: "", sortValue: 1 },
    });

    expect(getDoc).not.toHaveBeenCalled();
    expect(startAfter).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
  });
});
