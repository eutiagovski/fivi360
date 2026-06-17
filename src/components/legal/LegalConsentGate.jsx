import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { LegalConsentModal } from "@/components/legal/LegalConsentModal";
import {
  createUserProfile,
  getUserFirestoreData,
  maybeEnqueueWelcomeEmailForAuthUser,
  saveLegalConsent,
} from "@/services/users/userService";
import { canReceiveWelcomeEmail } from "@/services/auth/authService";
import { isLegalConsentCurrent } from "@/utils/legalConsent";

/**
 * Bloqueia o app autenticado até o aceite legal estar registrado e atualizado.
 */
export function LegalConsentGate({ children }) {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    setProfileChecked(false);
    const data = await getUserFirestoreData(userId);
    setProfileData(data);
    setProfileChecked(true);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setProfileData(null);
      setProfileChecked(true);
      return;
    }

    loadProfile(user.uid);
  }, [user?.uid, loadProfile]);

  const needsConsent =
    user &&
    profileChecked &&
    !isLegalConsentCurrent(profileData?.legalConsent);

  const handleAccept = async () => {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const acceptedSource = profileData ? "modal_existing_user" : "signup";

      if (!profileData) {
        await createUserProfile(user.uid, {
          displayName: user.displayName?.trim() || "",
          email: user.email ?? "",
          acceptedSource,
          enqueueVerifyEmail: user.usesPasswordAuth && !user.usesGoogleAuth,
        });

        if (canReceiveWelcomeEmail(user)) {
          try {
            await maybeEnqueueWelcomeEmailForAuthUser(user);
          } catch {
            // Não bloqueia o aceite legal.
          }
        }
      } else {
        await saveLegalConsent(user.uid, acceptedSource);
      }

      await loadProfile(user.uid);
    } catch (error) {
      const code =
        error != null && typeof error === "object" && "code" in error
          ? String(error.code)
          : null;

      if (process.env.NODE_ENV === "development") {
        console.error("[FIVI360] Legal consent submit failed:", error);
      }

      setSubmitError(
        code === "permission-denied"
          ? "Não foi possível criar seu perfil. Tente novamente ou entre em contato com o suporte."
          : "Não foi possível registrar o aceite. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);

    try {
      await signOut();
      setProfileData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profileChecked) {
    return <AuthLoadingScreen />;
  }

  if (needsConsent) {
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
          isSubmitting={isSubmitting}
          errorMessage={submitError}
        />
      </>
    );
  }

  return children;
}
