/**
 * RC-LP-PRELAUNCH-FORM-1 — phone mask
 */

import {
  formatBrazilPhoneMask,
  isPlausibleBrazilPhone,
} from "./formatBrazilPhoneMask";

describe("formatBrazilPhoneMask — RC-LP-PRELAUNCH-FORM-1", () => {
  it("formats mobile mask", () => {
    expect(formatBrazilPhoneMask("21999999999")).toBe("(21) 99999-9999");
  });

  it("formats landline-length mask", () => {
    expect(formatBrazilPhoneMask("2133334444")).toBe("(21) 3333-4444");
  });

  it("isPlausibleBrazilPhone accepts 10-11 digits", () => {
    expect(isPlausibleBrazilPhone("(21) 99999-9999")).toBe(true);
    expect(isPlausibleBrazilPhone("21")).toBe(false);
  });
});
