import { LEGAL_VERSIONS } from "@/config/legal";
import { isLegalConsentCurrent } from "./legalConsent";

describe("isLegalConsentCurrent — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("treats consent 1.0 as outdated", () => {
    expect(
      isLegalConsentCurrent({
        termsAccepted: true,
        privacyAccepted: true,
        termsVersion: "1.0",
        privacyVersion: "1.0",
      }),
    ).toBe(false);
  });

  it("treats consent 1.1 as current", () => {
    expect(LEGAL_VERSIONS.termsVersion).toBe("1.1");
    expect(LEGAL_VERSIONS.privacyVersion).toBe("1.1");
    expect(
      isLegalConsentCurrent({
        termsAccepted: true,
        privacyAccepted: true,
        termsVersion: "1.1",
        privacyVersion: "1.1",
      }),
    ).toBe(true);
  });
});
