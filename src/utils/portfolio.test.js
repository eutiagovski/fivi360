import {
  computePortfolioAvailable,
  isPortfolioPubliclyAvailable,
  isPortfolioPubliclyAvailableFromUserData,
} from "./portfolio";

describe("computePortfolioAvailable", () => {
  it("returns false when portfolioEnabled is not true", () => {
    expect(
      computePortfolioAvailable(false, { id: "professional", status: "active" }),
    ).toBe(false);
  });

  it("returns true for professional plan with portfolio enabled", () => {
    expect(
      computePortfolioAvailable(true, { id: "professional", status: "active", source: "stripe" }),
    ).toBe(true);
  });

  it("returns false for starter plan even when portfolioEnabled is true", () => {
    expect(
      computePortfolioAvailable(true, {
        id: "starter",
        status: "active",
        source: "system",
        cancelAtPeriodEnd: false,
      }),
    ).toBe(false);
  });
});

describe("isPortfolioPubliclyAvailable", () => {
  it("returns true only when portfolioAvailable is strictly true", () => {
    expect(isPortfolioPubliclyAvailable({ portfolioAvailable: true })).toBe(true);
  });

  it("returns false when portfolioAvailable is false", () => {
    expect(isPortfolioPubliclyAvailable({ portfolioAvailable: false })).toBe(false);
  });

  it("returns false when portfolioAvailable is missing or profile is null", () => {
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
