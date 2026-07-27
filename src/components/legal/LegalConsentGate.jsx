import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AuthErrorScreen } from "@/components/auth/AuthErrorScreen";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { LegalConsentModal } from "@/components/legal/LegalConsentModal";
import { useAuth } from "@/hooks/useAuth";
import { canReceiveWelcomeEmail } from "@/services/auth/authService";
import { ensureUserStructure } from "@/services/users/ensureUserStructure";
import {
  createUserProfile,
  getUserFirestoreData,
  maybeEnqueueWelcomeEmailForAuthUser,
  saveLegalConsent,
} from "@/services/users/userService";
import { isLegalConsentCurrent } from "@/utils/legalConsent";
import {
  LEGAL_CONSENT_GATE_STATUS,
  buildLocalLegalConsent,
  canRetryLegalConsentLoad,
  createInitialLegalConsentGateState,
  legalConsentGateReducer,
} from "@/utils/legalConsentGateState";

const LOAD_ERROR_MESSAGE =
  "Não foi possível carregar as informações da sua conta. Verifique sua conexão e tente novamente.";

/**
 * Bloqueia o app autenticado até o aceite legal estar registrado e atualizado.
 *
 * Máquina de estados: loading | ready | consent_required | saving | error
 */
export function LegalConsentGate({ children }) {
  const { user, signOut } = useAuth();
  const [state, dispatch] = useReducer(
    legalConsentGateReducer,
    undefined,
    createInitialLegalConsentGateState,
  );
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userRef = useRef(user);
  const loadRequestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  userRef.current = user;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      loadRequestIdRef.current += 1;
    };
  }, []);

  const loadProfile = useCallback(async (userId, { clearError = true } = {}) => {
    if (!userId) {
      return;
    }

    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    if (mountedRef.current) {
      dispatch({ type: "LOAD_START", clearError });
    }

    try {
      const currentUser = userRef.current;
      const { profile } = await ensureUserStructure(userId, {
        displayName: currentUser?.displayName?.trim() || "",
        email: currentUser?.email ?? "",
      });

      if (!mountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }

      dispatch({
        type: "LOAD_SUCCESS",
        profileData: profile,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FIVI360] LegalConsentGate.loadProfile failed:", error);
      }

      if (!mountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }

      const code =
        error != null && typeof error === "object" && "code" in error
          ? String(error.code)
          : null;
      const technicalMessage =
        error != null && typeof error === "object" && "message" in error
          ? String(error.message)
          : String(error);

      dispatch({
        type: "LOAD_ERROR",
        error: {
          message: LOAD_ERROR_MESSAGE,
          technicalMessage: code
            ? `${code}: ${technicalMessage}`
            : technicalMessage,
        },
      });
    } finally {
      if (requestId === loadRequestIdRef.current) {
        loadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      dispatch({ type: "RESET" });
      return undefined;
    }

    loadProfile(user.uid);

    return undefined;
  }, [user?.uid, loadProfile]);

  const handleRetry = useCallback(() => {
    if (!user?.uid || !canRetryLegalConsentLoad(state.status) || loadingRef.current) {
      return;
    }

    loadProfile(user.uid, { clearError: true });
  }, [loadProfile, state.status, user?.uid]);

  const handleAccept = async () => {
    if (!user?.uid) {
      return;
    }

    if (state.status === LEGAL_CONSENT_GATE_STATUS.SAVING) {
      return;
    }

    dispatch({ type: "SAVE_START" });

    try {
      const acceptedSource = state.profileData
        ? "modal_existing_user"
        : "signup";

      if (!state.profileData) {
        await createUserProfile(user.uid, {
          displayName: user.displayName?.trim() || "",
          email: user.email ?? "",
          acceptedSource,
          enqueueVerifyEmail: user.usesPasswordAuth && !user.usesGoogleAuth,
        });
      } else {
        await saveLegalConsent(user.uid, acceptedSource);
      }

      if (canReceiveWelcomeEmail(user)) {
        try {
          await maybeEnqueueWelcomeEmailForAuthUser(user);
        } catch {
          // Não bloqueia o aceite legal.
        }
      }

      const localProfile = {
        ...(state.profileData ?? {
          id: user.uid,
          displayName: user.displayName?.trim() || "",
          email: user.email ?? "",
        }),
        id: user.uid,
        legalConsent: buildLocalLegalConsent(acceptedSource),
      };

      if (!mountedRef.current) {
        return;
      }

      // Write confirmado → libera o app sem releitura bloqueante.
      dispatch({ type: "SAVE_SUCCESS", profileData: localProfile });

      // Releitura em background; falha não prende o usuário nem reabre o modal.
      getUserFirestoreData(user.uid)
        .then((fresh) => {
          if (!mountedRef.current || !fresh) {
            return;
          }

          if (!isLegalConsentCurrent(fresh.legalConsent)) {
            return;
          }

          dispatch({ type: "LOAD_SUCCESS", profileData: fresh });
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[FIVI360] LegalConsentGate background reload after consent failed:",
              error,
            );
          }
        });
    } catch (error) {
      const code =
        error != null && typeof error === "object" && "code" in error
          ? String(error.code)
          : null;

      if (process.env.NODE_ENV === "development") {
        console.error("[FIVI360] Legal consent submit failed:", error);
      }

      if (!mountedRef.current) {
        return;
      }

      dispatch({
        type: "SAVE_ERROR",
        submitError:
          code === "permission-denied"
            ? "Não foi possível criar seu perfil. Tente novamente ou entre em contato com o suporte."
            : "Não foi possível registrar o aceite. Tente novamente.",
      });
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      if (mountedRef.current) {
        dispatch({ type: "RESET" });
      }
    } finally {
      if (mountedRef.current) {
        setIsSigningOut(false);
      }
    }
  };

  if (state.status === LEGAL_CONSENT_GATE_STATUS.LOADING) {
    return <AuthLoadingScreen />;
  }

  if (state.status === LEGAL_CONSENT_GATE_STATUS.ERROR) {
    return (
      <AuthErrorScreen
        title="Não foi possível carregar sua conta"
        message={state.error?.message ?? LOAD_ERROR_MESSAGE}
        technicalMessage={state.error?.technicalMessage ?? null}
        onRetry={handleRetry}
        onSignOut={handleSignOut}
        isRetrying={false}
        isSigningOut={isSigningOut}
      />
    );
  }

  if (
    state.status === LEGAL_CONSENT_GATE_STATUS.CONSENT_REQUIRED
    || state.status === LEGAL_CONSENT_GATE_STATUS.SAVING
  ) {
    return (
      <>
        <div
          className="min-h-screen bg-[#050505]"
          aria-hidden="true"
          data-testid="legal-consent-blocker"
        />
        <LegalConsentModal
          open
          onAccept={handleAccept}
          onSignOut={handleSignOut}
          isSubmitting={
            state.status === LEGAL_CONSENT_GATE_STATUS.SAVING || isSigningOut
          }
          errorMessage={state.submitError}
        />
      </>
    );
  }

  return children;
}
