import { LEGAL_VERSIONS } from "@/config/legal";
import { isLegalConsentCurrent } from "@/utils/legalConsent";

/** @typedef {'loading' | 'ready' | 'consent_required' | 'saving' | 'error'} LegalConsentGateStatus */

export const LEGAL_CONSENT_GATE_STATUS = Object.freeze({
  LOADING: "loading",
  READY: "ready",
  CONSENT_REQUIRED: "consent_required",
  SAVING: "saving",
  ERROR: "error",
});

/**
 * Decide o status pós-carga a partir do documento users/{uid}.
 *
 * @param {({ legalConsent?: unknown } & Record<string, unknown>) | null | undefined} profileData
 * @returns {'ready' | 'consent_required'}
 */
export function decideConsentStatusAfterLoad(profileData) {
  return isLegalConsentCurrent(profileData?.legalConsent)
    ? LEGAL_CONSENT_GATE_STATUS.READY
    : LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED;
}

/**
 * Consentimento espelhado localmente após write confirmado (sem serverTimestamp).
 *
 * @param {"signup" | "modal_existing_user"} acceptedSource
 * @param {Date} [acceptedAt]
 */
export function buildLocalLegalConsent(acceptedSource, acceptedAt = new Date()) {
  return {
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion: LEGAL_VERSIONS.termsVersion,
    privacyVersion: LEGAL_VERSIONS.privacyVersion,
    acceptedAt,
    acceptedSource,
  };
}

/**
 * @typedef {{
 *   status: LegalConsentGateStatus,
 *   profileData: (Record<string, unknown> & { id?: string }) | null,
 *   error: { message: string, technicalMessage?: string | null } | null,
 *   submitError: string | null,
 * }} LegalConsentGateState
 */

/** @returns {LegalConsentGateState} */
export function createInitialLegalConsentGateState() {
  return {
    status: LEGAL_CONSENT_GATE_STATUS.LOADING,
    profileData: null,
    error: null,
    submitError: null,
  };
}

/**
 * @param {LegalConsentGateState} state
 * @param {{
 *   type: string,
 *   profileData?: LegalConsentGateState['profileData'],
 *   error?: LegalConsentGateState['error'],
 *   submitError?: string | null,
 *   clearError?: boolean,
 * }} action
 * @returns {LegalConsentGateState}
 */
export function legalConsentGateReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        status: LEGAL_CONSENT_GATE_STATUS.LOADING,
        error: action.clearError === false ? state.error : null,
        submitError: null,
      };

    case "LOAD_SUCCESS":
      return {
        status: decideConsentStatusAfterLoad(action.profileData),
        profileData: action.profileData ?? null,
        error: null,
        submitError: null,
      };

    case "LOAD_ERROR":
      return {
        status: LEGAL_CONSENT_GATE_STATUS.ERROR,
        profileData: null,
        error: action.error ?? {
          message:
            "Não foi possível carregar as informações da sua conta. Verifique sua conexão e tente novamente.",
        },
        submitError: null,
      };

    case "SAVE_START":
      if (
        state.status !== LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED
        && state.status !== LEGAL_CONSENT_GATE_STATUS.SAVING
      ) {
        return state;
      }

      return {
        ...state,
        status: LEGAL_CONSENT_GATE_STATUS.SAVING,
        submitError: null,
      };

    case "SAVE_SUCCESS":
      return {
        status: LEGAL_CONSENT_GATE_STATUS.READY,
        profileData: action.profileData ?? state.profileData,
        error: null,
        submitError: null,
      };

    case "SAVE_ERROR":
      return {
        ...state,
        status: LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED,
        submitError:
          action.submitError
          ?? "Não foi possível registrar o aceite. Tente novamente.",
      };

    case "RESET":
      return createInitialLegalConsentGateState();

    default:
      return state;
  }
}

/**
 * Retry só é permitido fora de loading/saving.
 *
 * @param {LegalConsentGateStatus} status
 * @returns {boolean}
 */
export function canRetryLegalConsentLoad(status) {
  return (
    status === LEGAL_CONSENT_GATE_STATUS.ERROR
    || status === LEGAL_CONSENT_GATE_STATUS.READY
    || status === LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED
  );
}
