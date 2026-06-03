import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";

/**
 * Wrapper para páginas de autenticação (login, cadastro, recuperação).
 * Redireciona usuários já autenticados para /dashboard.
 */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
