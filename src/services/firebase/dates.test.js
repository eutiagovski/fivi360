import {
  buildPaginationCursor,
  isPaginationCursor,
  toAppDate,
  toFirestoreDate,
  toMillis,
} from "./dates";

jest.mock("firebase/firestore", () => ({
  Timestamp: {
    fromDate: (date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
    fromMillis: (ms) => ({
      toDate: () => new Date(ms),
      toMillis: () => ms,
      seconds: Math.floor(ms / 1000),
      nanoseconds: 0,
    }),
  },
}));

describe("toAppDate", () => {
  it("returns null for null and undefined", () => {
    expect(toAppDate(null)).toBeNull();
    expect(toAppDate(undefined)).toBeNull();
  });

  it("keeps valid Date instances", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    expect(toAppDate(date)).toBe(date);
  });

  it("returns null for invalid Date", () => {
    expect(toAppDate(new Date("invalid"))).toBeNull();
  });

  it("converts Firebase Timestamp-like objects via toDate", () => {
    const date = new Date("2026-03-01T00:00:00.000Z");
    expect(toAppDate({ toDate: () => date })).toEqual(date);
  });

  it("converts objects with toMillis", () => {
    const ms = Date.parse("2026-04-01T00:00:00.000Z");
    expect(toAppDate({ toMillis: () => ms })).toEqual(new Date(ms));
  });

  it("converts { seconds, nanoseconds } payloads", () => {
    expect(toAppDate({ seconds: 1_700_000_000, nanoseconds: 0 })).toEqual(
      new Date(1_700_000_000_000),
    );
  });

  it("parses ISO strings", () => {
    expect(toAppDate("2026-07-29T15:00:00.000Z")).toEqual(
      new Date("2026-07-29T15:00:00.000Z"),
    );
  });

  it("parses epoch milliseconds", () => {
    expect(toAppDate(1_720_000_000_000)).toEqual(new Date(1_720_000_000_000));
  });

  it("returns null for unresolved serverTimestamp sentinels", () => {
    expect(toAppDate("SERVER_TIMESTAMP")).toBeNull();
    expect(toAppDate("server-timestamp")).toBeNull();
    expect(toAppDate({ _methodName: "serverTimestamp" })).toBeNull();
    expect(toAppDate({ type: "serverTimestamp" })).toBeNull();
    expect(toAppDate({ isEqual: () => false })).toBeNull();
  });

  it("returns null for empty string and garbage", () => {
    expect(toAppDate("")).toBeNull();
    expect(toAppDate("not-a-date")).toBeNull();
    expect(toAppDate({})).toBeNull();
  });
});

describe("toMillis", () => {
  it("returns 0 for missing values", () => {
    expect(toMillis(null)).toBe(0);
    expect(toMillis(undefined)).toBe(0);
  });

  it("returns epoch ms for Date", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(toMillis(date)).toBe(date.getTime());
  });
});

describe("toFirestoreDate", () => {
  it("returns null for null/invalid", () => {
    expect(toFirestoreDate(null)).toBeNull();
    expect(toFirestoreDate(new Date("bad"))).toBeNull();
  });

  it("wraps Date as Timestamp-like", () => {
    const date = new Date("2026-05-01T00:00:00.000Z");
    const ts = toFirestoreDate(date);
    expect(ts.toDate()).toEqual(date);
  });
});

describe("pagination cursor helpers", () => {
  it("buildPaginationCursor uses id and sortValue ms", () => {
    const date = new Date("2026-06-01T00:00:00.000Z");
    expect(buildPaginationCursor("proj-1", date)).toEqual({
      id: "proj-1",
      sortValue: date.getTime(),
    });
  });

  it("buildPaginationCursor uses null sortValue when missing", () => {
    expect(buildPaginationCursor("proj-2", null)).toEqual({
      id: "proj-2",
      sortValue: null,
    });
  });

  it("isPaginationCursor validates shape", () => {
    expect(isPaginationCursor({ id: "a", sortValue: 1 })).toBe(true);
    expect(isPaginationCursor({ id: "", sortValue: 1 })).toBe(false);
    expect(isPaginationCursor(null)).toBe(false);
    expect(isPaginationCursor({ sortValue: 1 })).toBe(false);
  });
});
