import { Loader2 } from "lucide-react";

/**
 * Tela de erro de autenticação / carregamento de conta (design alinhado ao AuthLoadingScreen).
 *
 * @param {{
 *   title?: string,
 *   message?: string,
 *   technicalMessage?: string | null,
 *   onRetry?: () => void,
 *   onSignOut?: () => void,
 *   isRetrying?: boolean,
 *   isSigningOut?: boolean,
 *   retryLabel?: string,
 *   signOutLabel?: string,
 * }} props
 */
export function AuthErrorScreen({
  title = "Não foi possível carregar sua conta",
  message = "Não foi possível carregar as informações da sua conta. Verifique sua conexão e tente novamente.",
  technicalMessage = null,
  onRetry,
  onSignOut,
  isRetrying = false,
  isSigningOut = false,
  retryLabel = "Tentar novamente",
  signOutLabel = "Sair da conta",
}) {
  const busy = isRetrying || isSigningOut;

  return (
    <div
      className="min-h-screen bg-[#050505] flex items-center justify-center fade-in px-6"
      data-testid="auth-error"
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1
            className="text-lg font-medium text-white"
            data-testid="auth-error-title"
          >
            {title}
          </h1>
          <p
            className="text-sm text-zinc-400 leading-relaxed"
            data-testid="auth-error-message"
          >
            {message}
          </p>
        </div>

        {process.env.NODE_ENV === "development" && technicalMessage ? (
          <p
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left text-xs text-zinc-500 font-mono break-all"
            data-testid="auth-error-technical"
          >
            {technicalMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              data-testid="auth-error-retry-btn"
              className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Carregando...
                </>
              ) : (
                retryLabel
              )}
            </button>
          ) : null}

          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={busy}
              data-testid="auth-error-signout-btn"
              className="w-full px-8 py-3 rounded-full font-medium text-sm bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? "Saindo..." : signOutLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
