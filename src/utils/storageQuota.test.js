/**
 * RC-STORAGE-QUOTA-ORIGINAL-SIZE-1 — helpers de quota comercial vs físico.
 */

import {
  getQuotaSizeBytes,
  getStoredSizeBytes,
} from "@/utils/storageQuota";

describe("getQuotaSizeBytes", () => {
  test("prefers originalSizeBytes", () => {
    expect(
      getQuotaSizeBytes({
        originalSizeBytes: 5_000_000,
        sizeBytes: 1_400_000,
        storedSizeBytes: 1_400_000,
      }),
    ).toBe(5_000_000);
  });

  test("falls back to legacy sizeBytes then storedSizeBytes", () => {
    expect(getQuotaSizeBytes({ sizeBytes: 2048 })).toBe(2048);
    expect(getQuotaSizeBytes({ storedSizeBytes: 1024 })).toBe(1024);
    expect(getQuotaSizeBytes({})).toBe(0);
    expect(getQuotaSizeBytes(null)).toBe(0);
  });

  test("ignores negative or non-finite values", () => {
    expect(
      getQuotaSizeBytes({
        originalSizeBytes: -1,
        sizeBytes: 100,
      }),
    ).toBe(100);
    expect(
      getQuotaSizeBytes({
        originalSizeBytes: Number.NaN,
        sizeBytes: 50,
      }),
    ).toBe(50);
  });
});

describe("getStoredSizeBytes", () => {
  test("prefers storedSizeBytes then sizeBytes", () => {
    expect(
      getStoredSizeBytes({
        storedSizeBytes: 1400,
        sizeBytes: 5000,
      }),
    ).toBe(1400);
    expect(getStoredSizeBytes({ sizeBytes: 512 })).toBe(512);
    expect(getStoredSizeBytes({})).toBe(0);
  });
});
