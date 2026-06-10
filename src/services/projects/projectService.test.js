jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  increment: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  startAfter: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
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

import { mapProjectToCard } from "./projectService";

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
