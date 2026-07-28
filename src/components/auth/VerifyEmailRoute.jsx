import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";
import { resolveVerifyEmailRoute } from "./authRouteGuards";

/**
 * Rota para usuários autenticados que ainda precisam verificar o e-mail.
 * Pós-cadastro usa `/verify-email-sent` (pública) — esta rota cobre login
 * com conta ainda não verificada.
 */
export function VerifyEmailRoute({ children }) {
  const { user, loading, signUpInProgress } = useAuth();
  const decision = resolveVerifyEmailRoute({ user, loading, signUpInProgress });

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "login") {
    return <Navigate to="/login" replace />;
  }

  if (decision === "dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
