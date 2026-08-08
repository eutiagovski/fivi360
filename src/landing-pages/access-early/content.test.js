/**
 * RC-LP-PRELAUNCH-STRUCTURE-1 — video section + content helpers
 */

import { ACCESS_EARLY_CONFIG } from "./config";
import {
  ACCESS_EARLY_CONTENT,
  ACCESS_EARLY_FORM_ANCHOR,
  scrollToAccessEarlyForm,
} from "./content";

describe("access-early content — RC-LP-PRELAUNCH-STRUCTURE-1", () => {
  it("keeps videoUrl and social URLs empty by default", () => {
    expect(ACCESS_EARLY_CONFIG.videoUrl).toBe("");
    expect(ACCESS_EARLY_CONFIG.whatsappGroupUrl).toBe("");
    expect(ACCESS_EARLY_CONFIG.instagramUrl).toBe("");
    expect(ACCESS_EARLY_CONFIG.youtubeUrl).toBe("");
  });

  it("defines 3 benefits and 3 how-it-works steps", () => {
    expect(ACCESS_EARLY_CONTENT.benefits.items).toHaveLength(3);
    expect(ACCESS_EARLY_CONTENT.howItWorks.steps).toHaveLength(3);
  });

  it("scroll helper targets form anchor", () => {
    const el = document.createElement("div");
    el.id = ACCESS_EARLY_FORM_ANCHOR;
    el.scrollIntoView = jest.fn();
    document.body.appendChild(el);

    scrollToAccessEarlyForm();
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    el.remove();
  });
});
