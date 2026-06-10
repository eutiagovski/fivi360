import { isPortfolioPubliclyAvailable } from "./portfolio";

describe("isPortfolioPubliclyAvailable", () => {
  it("returns true only when portfolioEnabled is strictly true", () => {
    expect(isPortfolioPubliclyAvailable({ portfolioEnabled: true })).toBe(true);
  });

  it("returns false when portfolioEnabled is false", () => {
    expect(isPortfolioPubliclyAvailable({ portfolioEnabled: false })).toBe(false);
  });

  it("returns false when portfolioEnabled is missing or profile is null", () => {
    expect(isPortfolioPubliclyAvailable({})).toBe(false);
    expect(isPortfolioPubliclyAvailable(null)).toBe(false);
    expect(isPortfolioPubliclyAvailable(undefined)).toBe(false);
  });
});
