import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { LegalConsentModal } from "@/components/legal/LegalConsentModal";
import {
  createUserProfile,
  getUserFirestoreData,
  saveLegalConsent,
} from "@/services/users/userService";
import { completeEmailVerification } from "@/services/auth/emailVerificationService";
import { isLegalConsentCurrent } from "@/utils/legalConsent";

/**
 * Bloqueia o app autenticado até o aceite legal estar registrado e atualizado.
 */
export function LegalConsentGate({ children }) {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      const acceptedSource = profileData ? "modal_existing_user" : "signup";

      if (!profileData) {
        await createUserProfile(user.uid, {
          displayName: user.displayName?.trim() || "",
          email: user.email ?? "",
          acceptedSource,
        });

        if (acceptedSource === "signup" && user.emailVerified) {
          try {
            await completeEmailVerification();
          } catch {
            // Não bloqueia o aceite legal.
          }
        }
      } else {
        await saveLegalConsent(user.uid, acceptedSource);
      }

      await loadProfile(user.uid);
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
        />
      </>
    );
  }

  return children;
}
