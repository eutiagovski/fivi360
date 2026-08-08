import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { LegalConsentGate } from "@/components/legal/LegalConsentGate";
import { useAuth } from "@/hooks/useAuth";
import { resolveProtectedRoute } from "./authRouteGuards";

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
 * PRIVATE — rotas exclusivas da aplicação autenticada.
 * Redireciona para /login quando não há usuário; aplica LegalConsentGate.
 * Durante `signUpInProgress`, mantém loading para evitar flash /verify-email.
 *
 * Não usar em Home, Landing Pages, Share, Embed ou Portfólio (PUBLIC_ALWAYS).
 */
export function ProtectedRoute({ children }) {
  const { user, loading, signUpInProgress } = useAuth();
  const decision = resolveProtectedRoute({ user, loading, signUpInProgress });

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "login") {
    return <Navigate to="/login" replace />;
  }

  if (decision === "verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  return <LegalConsentGate>{children}</LegalConsentGate>;
}
