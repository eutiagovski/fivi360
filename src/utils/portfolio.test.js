import {
  isPortfolioPubliclyAvailable,
  isPortfolioPubliclyAvailableFromUserData,
} from "./portfolio";

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

describe("isPortfolioPubliclyAvailableFromUserData", () => {
  it("returns false when portfolioEnabled is not true", () => {
    expect(
      isPortfolioPubliclyAvailableFromUserData({
        portfolioEnabled: false,
        plan: { id: "professional", status: "active" },
      }),
    ).toBe(false);
  });

  it("returns true for professional plan with portfolio enabled", () => {
    expect(
      isPortfolioPubliclyAvailableFromUserData({
        portfolioEnabled: true,
        plan: { id: "professional", status: "active", source: "stripe" },
      }),
    ).toBe(true);
  });

  it("returns false for starter plan even when portfolioEnabled is true", () => {
    expect(
      isPortfolioPubliclyAvailableFromUserData({
        portfolioEnabled: true,
        plan: {
          id: "starter",
          status: "active",
          source: "system",
          cancelAtPeriodEnd: false,
        },
      }),
    ).toBe(false);
  });
});
