import { sortByRecency } from "./recencySort";
import { sortImagesByRecency, toMillis } from "./imageRecencySort";
import { sortImagesByCreatedAt } from "./imageCreatedSort";

describe("date-aware sorting helpers", () => {
  it("sortByRecency orders Date updatedAt DESC", () => {
    const items = [
      { id: "a", updatedAt: new Date("2026-01-01T00:00:00.000Z") },
      { id: "b", updatedAt: new Date("2026-03-01T00:00:00.000Z") },
      { id: "c", createdAt: new Date("2026-02-01T00:00:00.000Z") },
    ];

    expect(sortByRecency(items).map((item) => item.id)).toEqual(["b", "c", "a"]);
  });

  it("image recency accepts Timestamp-like and Date", () => {
    const items = [
      { id: "old", updatedAt: { toMillis: () => 1000 } },
      { id: "new", updatedAt: new Date(3000) },
    ];

    expect(sortImagesByRecency(items).map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
    expect(toMillis(new Date(5000))).toBe(5000);
  });

  it("sortImagesByCreatedAt keeps gallery order with Date", () => {
    const items = [
      { id: "a", createdAt: new Date(1000) },
      { id: "b", createdAt: new Date(3000) },
    ];

    expect(sortImagesByCreatedAt(items).map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
  });
});
