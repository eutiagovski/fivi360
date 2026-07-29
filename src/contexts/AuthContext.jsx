/**
 * Contexto global de autenticação.
 *
 * Responsabilidade:
 * - Expor estado da sessão (user, loading, error) para a árvore React
 * - Delegar operações de login/logout ao authService
 * - Evitar prop drilling em páginas protegidas
 *
 * @see src/hooks/useAuth.js
 * @see src/services/auth/authService.js
 * @see docs/auth-foundation.md
 */

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  canReceiveWelcomeEmail,
  logout as authLogout,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  subscribeToAuthChanges,
} from "@/services/auth/authService";
import { requestPasswordResetEmail } from "@/services/auth/passwordResetService";
import {
  createUserProfile,
  getUserFirestoreData,
  maybeEnqueueWelcomeEmailForAuthUser,
} from "@/services/users/userService";
import {
  setAnalyticsUser,
  trackEvent,
} from "@/services/analytics/analyticsService";

export const AuthContext = createContext(undefined);

/**
 * @typedef {Object} SignUpResult
 * @property {true} userCreated
 * @property {true} profileCreated
 * @property {boolean} verificationEmailQueued
 * @property {string} email — e-mail canônico do Firebase Auth
 * @property {boolean} logoutCompleted
 * @property {"verification-email-queue-failed"} [errorCode]
 */

/**
 * Provider de autenticação conectado ao Firebase Auth.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** Impede PublicRoute de redirecionar durante o cadastro por e-mail. */
  const [signUpInProgress, setSignUpInProgress] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
      // Garante que signUpInProgress não sobreviva a logout / sessão nula
      // (RC-BUG-002 — não deve bloquear login normal nas guards).
      if (!nextUser) {
        setSignUpInProgress(false);
      }
      setAnalyticsUser(nextUser ? { uid: nextUser.uid } : null);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);

    try {
      const authUser = await signInWithEmail(email, password);
      trackEvent("login", { method: "email" });

      if (canReceiveWelcomeEmail(authUser)) {
        try {
          const profile = await getUserFirestoreData(authUser.uid);

          if (profile) {
            await maybeEnqueueWelcomeEmailForAuthUser(authUser);
          }
        } catch {
          // Não bloqueia o login (perfil/welcome são best-effort).
        }
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const clearSignUpInProgress = useCallback(() => {
    setSignUpInProgress(false);
  }, []);

  /**
   * Cadastro por e-mail (estratégia B):
   * Auth → Firestore → enqueue → logout → resultado estruturado.
   * A navegação para `/verify-email-sent` fica a cargo da UI.
   *
   * @returns {Promise<SignUpResult>}
   */
  const signUp = useCallback(async (email, password, name) => {
    setError(null);
    setSignUpInProgress(true);

    let userCreated = false;

    try {
      const authUser = await signUpWithEmail(email, password);
      userCreated = true;

      const canonicalEmail = authUser.email;

      if (!canonicalEmail) {
        const missingEmailError = new Error(
          "Authenticated user has no email after sign-up",
        );
        missingEmailError.code = "verification-email-missing-auth-email";
        throw missingEmailError;
      }

      const profileResult = await createUserProfile(authUser.uid, {
        displayName: name,
        email: canonicalEmail,
        acceptedSource: "signup",
        enqueueVerifyEmail: true,
      });

      let logoutCompleted = false;

      try {
        await authLogout();
        logoutCompleted = true;
      } catch (logoutErr) {
        console.error("[FIVI360] Signup logout failed:", {
          stage: "signUp.logout",
          code: logoutErr?.code,
          message: logoutErr?.message,
          stack: logoutErr?.stack,
        });
      }

      trackEvent("sign_up", { method: "email" });

      /** @type {SignUpResult} */
      const result = {
        userCreated: true,
        profileCreated: true,
        verificationEmailQueued: Boolean(profileResult.verificationEmailQueued),
        email: canonicalEmail,
        logoutCompleted,
      };

      if (!result.verificationEmailQueued) {
        result.errorCode = "verification-email-queue-failed";
      }

      return result;
    } catch (err) {
      if (userCreated) {
        try {
          await authLogout();
        } catch (logoutErr) {
          console.error("[FIVI360] Signup cleanup logout failed:", {
            stage: "signUp.cleanupLogout",
            code: logoutErr?.code,
            message: logoutErr?.message,
            stack: logoutErr?.stack,
          });
        }
      }

      console.error("[FIVI360] AuthContext.signUp failed:", {
        stage: "signUp",
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        userCreated,
      });

      setSignUpInProgress(false);
      setError(err);
      throw err;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);

    try {
      const { user: authUser, isNewUser } = await signInWithGoogle();
      trackEvent(isNewUser ? "sign_up" : "login", { method: "google" });

      try {
        const profile = await getUserFirestoreData(authUser.uid);

        if (profile) {
          await maybeEnqueueWelcomeEmailForAuthUser(authUser);
        }
      } catch {
        // Não bloqueia o login (perfil/welcome são best-effort).
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setSignUpInProgress(false);

    try {
      await authLogout();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError(null);

    try {
      return await requestPasswordResetEmail(email);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const setUserFromReload = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signUpInProgress,
      signIn,
      signUp,
      signInGoogle,
      signOut,
      resetPassword,
      setUserFromReload,
      clearSignUpInProgress,
    }),
    [
      user,
      loading,
      error,
      signUpInProgress,
      signIn,
      signUp,
      signInGoogle,
      signOut,
      resetPassword,
      setUserFromReload,
      clearSignUpInProgress,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
