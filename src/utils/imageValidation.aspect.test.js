import {
  isAtypicalPanoramaAspectRatio,
  isBelowRecommendedResolution,
} from "@/utils/imageValidation";

describe("isAtypicalPanoramaAspectRatio", () => {
  it("accepts near 2:1 ratios", () => {
    expect(isAtypicalPanoramaAspectRatio(4000, 2000)).toBe(false);
    expect(isAtypicalPanoramaAspectRatio(4096, 2048)).toBe(false);
    expect(isAtypicalPanoramaAspectRatio(3800, 2000)).toBe(false);
  });

  it("flags clearly non-panoramic ratios without blocking", () => {
    expect(isAtypicalPanoramaAspectRatio(1920, 1080)).toBe(true);
    expect(isAtypicalPanoramaAspectRatio(1000, 1000)).toBe(true);
  });

  it("handles invalid dimensions", () => {
    expect(isAtypicalPanoramaAspectRatio(0, 2000)).toBe(false);
    expect(isAtypicalPanoramaAspectRatio(4000, 0)).toBe(false);
  });
});

describe("isBelowRecommendedResolution", () => {
  it("warns below 3000x1500", () => {
    expect(isBelowRecommendedResolution(2999, 1500)).toBe(true);
    expect(isBelowRecommendedResolution(3000, 1499)).toBe(true);
    expect(isBelowRecommendedResolution(3000, 1500)).toBe(false);
  });
});
