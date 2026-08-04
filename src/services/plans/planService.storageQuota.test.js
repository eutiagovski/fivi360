/**
 * RC-STORAGE-QUOTA-ORIGINAL-SIZE-1 — quota comercial por tamanho original.
 */

import {
  PLAN_LIMIT_CODES,
  assertCanReplaceImageStorage,
  assertCanUploadImage,
  canUploadImageWithSize,
  getImageUploadBlockCode,
  getUserUsage,
} from "@/services/plans/planService";
import { getPlanLimits, PLAN_IDS } from "@/config/planLimits";

const mockGetDocs = jest.fn();
const mockGetProjectsByUserId = jest.fn();
const mockGetUser = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "images"),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn((...args) => args),
  where: jest.fn((...args) => args),
}));

jest.mock("@/config/firebase", () => ({
  db: {},
}));

jest.mock("@/services/projects/projectService", () => ({
  getProjectsByUserId: (...args) => mockGetProjectsByUserId(...args),
}));

jest.mock("@/services/users/userService", () => ({
  getUser: (...args) => mockGetUser(...args),
}));

const MB = 1024 * 1024;
const userId = "user-1";

function mockImageDocs(docs) {
  mockGetDocs.mockResolvedValue({
    docs: docs.map((data, index) => ({
      id: `img-${index}`,
      data: () => data,
    })),
  });
}

describe("getUserUsage storage quota (original size)", () => {
  beforeEach(() => {
    mockGetProjectsByUserId.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ planId: PLAN_IDS.PROFESSIONAL });
  });

  test("sums originalSizeBytes for commercial storageBytes", async () => {
    mockImageDocs([
      { originalSizeBytes: 5_000_000, sizeBytes: 1_400_000, storedSizeBytes: 1_400_000 },
      { originalSizeBytes: 3_000_000, sizeBytes: 900_000, storedSizeBytes: 900_000 },
    ]);

    const usage = await getUserUsage(userId);

    expect(usage.imageCount).toBe(2);
    expect(usage.storageBytes).toBe(8_000_000);
  });

  test("legacy docs without originalSizeBytes fall back to sizeBytes", async () => {
    mockImageDocs([{ sizeBytes: 2048 }]);

    const usage = await getUserUsage(userId);

    expect(usage.storageBytes).toBe(2048);
  });

  test("compression does not reduce commercial usage", async () => {
    mockImageDocs([
      {
        originalSizeBytes: 5 * MB,
        sizeBytes: 1.4 * MB,
        storedSizeBytes: 1.4 * MB,
      },
    ]);

    const usage = await getUserUsage(userId);

    expect(usage.storageBytes).toBe(5 * MB);
    expect(usage.storageBytes).not.toBe(1.4 * MB);
  });
});

describe("assertCanUploadImage uses original bytes", () => {
  beforeEach(() => {
    mockGetProjectsByUserId.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ planId: PLAN_IDS.STARTER });
    mockImageDocs([]);
  });

  test("accepts upload within limit", async () => {
    await expect(assertCanUploadImage(userId, 10 * MB)).resolves.toBeUndefined();
  });

  test("rejects upload above limit before any write", async () => {
    await expect(assertCanUploadImage(userId, 26 * MB)).rejects.toMatchObject({
      code: PLAN_LIMIT_CODES.STORAGE_LIMIT,
    });
  });

  test("batch sum of original sizes is checked via additionalBytes", async () => {
    mockImageDocs([{ originalSizeBytes: 20 * MB, sizeBytes: 1 * MB }]);

    const limits = getPlanLimits(PLAN_IDS.STARTER);
    const usage = await getUserUsage(userId);
    const selectedTotal = 6 * MB;

    expect(getImageUploadBlockCode(limits, usage, selectedTotal)).toBe(
      PLAN_LIMIT_CODES.STORAGE_LIMIT,
    );
    expect(canUploadImageWithSize(limits, usage, selectedTotal)).toBe(false);
  });
});

describe("assertCanReplaceImageStorage uses quota sizes", () => {
  beforeEach(() => {
    mockGetProjectsByUserId.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ planId: PLAN_IDS.STARTER });
    mockImageDocs([{ originalSizeBytes: 20 * MB, sizeBytes: 2 * MB }]);
  });

  test("allows replace when net delta stays within limit", async () => {
    await expect(
      assertCanReplaceImageStorage(userId, 22 * MB, 20 * MB),
    ).resolves.toBeUndefined();
  });

  test("rejects replace when projected quota exceeds limit", async () => {
    await expect(
      assertCanReplaceImageStorage(userId, 30 * MB, 20 * MB),
    ).rejects.toMatchObject({
      code: PLAN_LIMIT_CODES.STORAGE_LIMIT,
    });
  });
});

describe("plan storage limits unchanged", () => {
  test("Professional remains 250 MB and Studio 2 GB", () => {
    expect(getPlanLimits(PLAN_IDS.PROFESSIONAL).maxStorageBytes).toBe(250 * MB);
    expect(getPlanLimits(PLAN_IDS.STUDIO).maxStorageBytes).toBe(2 * 1024 * MB);
  });
});
