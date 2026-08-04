/**
 * RC-STORAGE-QUOTA-ORIGINAL-SIZE-1 — toasts de limite de storage.
 */

jest.mock("@/config/firebase", () => ({
  db: {},
  storage: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock("@/services/projects/projectService", () => ({
  getProjectsByUserId: jest.fn(),
}));

jest.mock("@/services/users/userService", () => ({
  getUser: jest.fn(),
}));

import { PLAN_LIMIT_CODES } from "@/services/plans/planService";
import { showImageUploadBlockedToast } from "@/utils/planToast";

describe("showImageUploadBlockedToast storage message", () => {
  test("includes selected and available space without compression wording", () => {
    const toast = jest.fn();
    const MB = 1024 * 1024;
    const limits = {
      maxTotalImages: null,
      maxStorageBytes: 25 * MB,
    };
    const usage = { imageCount: 1, storageBytes: 20 * MB };

    const blocked = showImageUploadBlockedToast(
      limits,
      usage,
      8 * MB,
      toast,
    );

    expect(blocked).toBe(true);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Limite do plano",
        description: expect.stringMatching(
          /ultrapassa o limite de armazenamento/i,
        ),
      }),
    );

    const description = toast.mock.calls[0][0].description;
    expect(description).toMatch(/Selecionado:/i);
    expect(description).toMatch(/Disponível:/i);
    expect(description).not.toMatch(/comprim/i);
    expect(description).not.toMatch(/Firebase/i);
    expect(description).not.toMatch(/economia/i);
  });

  test("returns false when under limit", () => {
    const toast = jest.fn();
    const blocked = showImageUploadBlockedToast(
      { maxTotalImages: null, maxStorageBytes: 100 },
      { imageCount: 0, storageBytes: 10 },
      20,
      toast,
    );

    expect(blocked).toBe(false);
    expect(toast).not.toHaveBeenCalled();
  });

  test("image limit uses generic message", () => {
    const toast = jest.fn();
    showImageUploadBlockedToast(
      { maxTotalImages: 10, maxStorageBytes: 1000 },
      { imageCount: 10, storageBytes: 0 },
      1,
      toast,
    );

    expect(toast.mock.calls[0][0].description).toMatch(/limite de imagens/i);
    expect(toast.mock.calls[0][0].description).not.toMatch(/Selecionado:/);
  });
});

describe("PLAN_LIMIT_CODES", () => {
  test("exposes STORAGE_LIMIT", () => {
    expect(PLAN_LIMIT_CODES.STORAGE_LIMIT).toBe("STORAGE_LIMIT");
  });
});
