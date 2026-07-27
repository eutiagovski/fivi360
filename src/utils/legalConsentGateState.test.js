import {
  LEGAL_CONSENT_GATE_STATUS,
  buildLocalLegalConsent,
  canRetryLegalConsentLoad,
  createInitialLegalConsentGateState,
  decideConsentStatusAfterLoad,
  legalConsentGateReducer,
} from "./legalConsentGateState";
import { LEGAL_VERSIONS } from "@/config/legal";

describe("decideConsentStatusAfterLoad", () => {
  it("returns ready when consent is current", () => {
    expect(
      decideConsentStatusAfterLoad({
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          termsVersion: LEGAL_VERSIONS.termsVersion,
          privacyVersion: LEGAL_VERSIONS.privacyVersion,
        },
      }),
    ).toBe(LEGAL_CONSENT_GATE_STATUS.READY);
  });

  it("returns consent_required when consent is missing", () => {
    expect(decideConsentStatusAfterLoad(null)).toBe(
      LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED,
    );
    expect(decideConsentStatusAfterLoad({})).toBe(
      LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED,
    );
  });

  it("returns consent_required when consent versions are outdated", () => {
    expect(
      decideConsentStatusAfterLoad({
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          termsVersion: "0.9",
          privacyVersion: LEGAL_VERSIONS.privacyVersion,
        },
      }),
    ).toBe(LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED);
  });
});

describe("legalConsentGateReducer", () => {
  it("LOAD_ERROR ends in error, never loading", () => {
    const next = legalConsentGateReducer(createInitialLegalConsentGateState(), {
      type: "LOAD_ERROR",
      error: { message: "falha" },
    });

    expect(next.status).toBe(LEGAL_CONSENT_GATE_STATUS.ERROR);
    expect(next.error?.message).toBe("falha");
  });

  it("LOAD_START clears previous error by default", () => {
    const errored = legalConsentGateReducer(createInitialLegalConsentGateState(), {
      type: "LOAD_ERROR",
      error: { message: "falha" },
    });

    const next = legalConsentGateReducer(errored, { type: "LOAD_START" });

    expect(next.status).toBe(LEGAL_CONSENT_GATE_STATUS.LOADING);
    expect(next.error).toBeNull();
  });

  it("SAVE_SUCCESS liberates app to ready with local profile", () => {
    const consentRequired = legalConsentGateReducer(
      createInitialLegalConsentGateState(),
      { type: "LOAD_SUCCESS", profileData: { id: "u1" } },
    );

    expect(consentRequired.status).toBe(
      LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED,
    );

    const saving = legalConsentGateReducer(consentRequired, { type: "SAVE_START" });
    expect(saving.status).toBe(LEGAL_CONSENT_GATE_STATUS.SAVING);

    const localConsent = buildLocalLegalConsent("modal_existing_user");
    const ready = legalConsentGateReducer(saving, {
      type: "SAVE_SUCCESS",
      profileData: { id: "u1", legalConsent: localConsent },
    });

    expect(ready.status).toBe(LEGAL_CONSENT_GATE_STATUS.READY);
    expect(ready.profileData?.legalConsent).toEqual(localConsent);
  });

  it("SAVE_ERROR keeps modal open (consent_required) with submit error", () => {
    const consentRequired = legalConsentGateReducer(
      createInitialLegalConsentGateState(),
      { type: "LOAD_SUCCESS", profileData: { id: "u1" } },
    );
    const saving = legalConsentGateReducer(consentRequired, { type: "SAVE_START" });
    const failed = legalConsentGateReducer(saving, {
      type: "SAVE_ERROR",
      submitError: "falha no save",
    });

    expect(failed.status).toBe(LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED);
    expect(failed.submitError).toBe("falha no save");
  });

  it("blocks retry while loading or saving", () => {
    expect(canRetryLegalConsentLoad(LEGAL_CONSENT_GATE_STATUS.LOADING)).toBe(false);
    expect(canRetryLegalConsentLoad(LEGAL_CONSENT_GATE_STATUS.SAVING)).toBe(false);
    expect(canRetryLegalConsentLoad(LEGAL_CONSENT_GATE_STATUS.ERROR)).toBe(true);
  });

  it("background reload failure path: SAVE_SUCCESS stays ready without second load", () => {
    const ready = legalConsentGateReducer(
      {
        status: LEGAL_CONSENT_GATE_STATUS.SAVING,
        profileData: { id: "u1" },
        error: null,
        submitError: null,
      },
      {
        type: "SAVE_SUCCESS",
        profileData: {
          id: "u1",
          legalConsent: buildLocalLegalConsent("signup"),
        },
      },
    );

    expect(ready.status).toBe(LEGAL_CONSENT_GATE_STATUS.READY);
    // Simula falha de releitura: nenhum LOAD_ERROR após save confirmado.
    expect(ready.error).toBeNull();
  });
});
