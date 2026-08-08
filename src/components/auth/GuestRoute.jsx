import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";
import { resolveGuestRoute } from "./authRouteGuards";

/**
 * GUEST_ONLY — páginas de autenticação (login, cadastro, recuperação).
 * Redireciona usuários já autenticados para /dashboard.
 * Durante `signUpInProgress`, não redireciona (evita race pós-createUser).
 *
 * @see resolveGuestRoute
 */
export function GuestRoute({ children }) {
  const { user, loading, signUpInProgress } = useAuth();
  const decision = resolveGuestRoute({ user, loading, signUpInProgress });

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
