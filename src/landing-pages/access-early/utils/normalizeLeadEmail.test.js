/**
 * RC-LP-PRELAUNCH-DATA-1 — normalizeLeadEmail (frontend)
 */

import { normalizeLeadEmail } from "./normalizeLeadEmail";

describe("normalizeLeadEmail (LP) — RC-LP-PRELAUNCH-DATA-1", () => {
  it("trims and lowercases", () => {
    expect(normalizeLeadEmail(" Pedro@Email.COM ")).toBe("pedro@email.com");
  });

  it("does not strip gmail dots or plus aliases", () => {
    expect(normalizeLeadEmail("a.b+c@gmail.com")).toBe("a.b+c@gmail.com");
  });
});
