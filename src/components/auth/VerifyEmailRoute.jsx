import { Navigate } from "react-router-dom";
import { needsEmailVerification } from "@/services/auth/authService";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";

/**
 * Rota para usuários autenticados que ainda precisam verificar o e-mail.
 */
export function VerifyEmailRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!needsEmailVerification(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
