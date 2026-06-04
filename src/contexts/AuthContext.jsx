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
  logout as authLogout,
  resetPassword as authResetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  subscribeToAuthChanges,
} from "@/services/auth/authService";
import { createUserProfile } from "@/services/users/userService";

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
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    setError(null);

    try {
      const user = await signUpWithEmail(email, password);
      await createUserProfile(user.uid, { name, email, acceptedSource: "signup" });
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);

    try {
      await signInWithGoogle();
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
      await authResetPassword(email);
    } catch (err) {
      setError(err);
      throw err;
    }
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
    }),
    [user, loading, error, signIn, signUp, signInGoogle, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
