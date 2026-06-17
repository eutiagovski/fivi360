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
 * Provider de autenticação conectado ao Firebase Auth.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
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
        const profile = await getUserFirestoreData(authUser.uid);

        if (profile) {
          try {
            await maybeEnqueueWelcomeEmailForAuthUser(authUser);
          } catch {
            // Não bloqueia o login.
          }
        }
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    setError(null);

    try {
      const authUser = await signUpWithEmail(email, password);
      await createUserProfile(authUser.uid, {
        displayName: name,
        email,
        acceptedSource: "signup",
        enqueueVerifyEmail: true,
      });
      await authLogout();
      trackEvent("sign_up", { method: "email" });
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);

    try {
      const { user: authUser, isNewUser } = await signInWithGoogle();
      trackEvent(isNewUser ? "sign_up" : "login", { method: "google" });

      const profile = await getUserFirestoreData(authUser.uid);

      if (profile) {
        try {
          await maybeEnqueueWelcomeEmailForAuthUser(authUser);
        } catch {
          // Não bloqueia o login.
        }
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);

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
      signIn,
      signUp,
      signInGoogle,
      signOut,
      resetPassword,
      setUserFromReload,
    }),
    [user, loading, error, signIn, signUp, signInGoogle, signOut, resetPassword, setUserFromReload],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
