import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";
import { resolvePublicRoute } from "./authRouteGuards";

/**
 * Wrapper para páginas de autenticação (login, cadastro, recuperação).
 * Redireciona usuários já autenticados para /dashboard.
 * Durante `signUpInProgress`, não redireciona (evita race pós-createUser).
 */
export function PublicRoute({ children }) {
  const { user, loading, signUpInProgress } = useAuth();
  const decision = resolvePublicRoute({ user, loading, signUpInProgress });

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
