/**
 * RC-LP-PRELAUNCH-DATA-1 — getPrelaunchAttribution
 */

import { getPrelaunchAttribution } from "./getPrelaunchAttribution";

describe("getPrelaunchAttribution — RC-LP-PRELAUNCH-DATA-1", () => {
  it("maps UTMs and referrer from Instagram Stories example", () => {
    const attribution = getPrelaunchAttribution({
      search:
        "?utm_source=instagram&utm_medium=stories&utm_campaign=prelaunch_2026&utm_content=editorial_01",
      pathname: "/lp/acesso-antecipado",
      referrer: "https://instagram.com/",
    });

    expect(attribution).toEqual({
      source: "instagram",
      medium: "stories",
      utmCampaign: "prelaunch_2026",
      content: "editorial_01",
      term: null,
      referrer: "https://instagram.com/",
      landingPath: "/lp/acesso-antecipado",
    });
  });

  it("handles absence of params", () => {
    const attribution = getPrelaunchAttribution({
      search: "",
      pathname: "/lp/acesso-antecipado",
      referrer: "",
    });

    expect(attribution.source).toBeNull();
    expect(attribution.medium).toBeNull();
    expect(attribution.utmCampaign).toBeNull();
    expect(attribution.content).toBeNull();
    expect(attribution.term).toBeNull();
    expect(attribution.referrer).toBeNull();
    expect(attribution.landingPath).toBe("/lp/acesso-antecipado");
  });

  it("sanitizes long values", () => {
    const long = `x${"a".repeat(300)}`;
    const attribution = getPrelaunchAttribution({
      search: `?utm_source=${long}`,
      pathname: `/${"p".repeat(300)}`,
      referrer: `https://example.com/${"r".repeat(600)}`,
    });

    expect(attribution.source.length).toBeLessThanOrEqual(200);
    expect(attribution.landingPath.length).toBeLessThanOrEqual(200);
    expect(attribution.referrer.length).toBeLessThanOrEqual(500);
  });

  it("does not expose campaignId from URL (caller uses ACCESS_EARLY_CAMPAIGN)", () => {
    const attribution = getPrelaunchAttribution({
      search: "?utm_campaign=prelaunch_2026",
      pathname: "/lp/acesso-antecipado",
    });

    expect(attribution).not.toHaveProperty("campaignId");
    expect(attribution.utmCampaign).toBe("prelaunch_2026");
  });
});
