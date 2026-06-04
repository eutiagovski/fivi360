import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { LegalConsentGate } from "@/components/legal/LegalConsentGate";
import { useAuth } from "@/hooks/useAuth";

export function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen bg-[#050505] flex items-center justify-center fade-in"
      data-testid="auth-loading"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-zinc-400"
        aria-label="Carregando"
      />
    </div>
  );
}

/**
 * Wrapper para rotas que exigem sessão autenticada.
 * Redireciona para /login enquanto carrega ou quando não há usuário.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <LegalConsentGate>{children}</LegalConsentGate>;
}
