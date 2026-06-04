import { LEGAL_VERSIONS } from "@/config/legal";

/**
 * @param {import("firebase/firestore").DocumentData["legalConsent"] | undefined} legalConsent
 * @returns {boolean}
 */
export function isLegalConsentCurrent(legalConsent) {
  if (!legalConsent) {
    return false;
  }

  return (
    legalConsent.termsAccepted === true &&
    legalConsent.privacyAccepted === true &&
    legalConsent.termsVersion === LEGAL_VERSIONS.termsVersion &&
    legalConsent.privacyVersion === LEGAL_VERSIONS.privacyVersion
  );
}
