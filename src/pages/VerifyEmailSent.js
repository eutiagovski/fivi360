import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { readVerifyEmailSentState } from "@/utils/verifyEmailSentState";

/**
 * Tela pública pós-cadastro (estratégia B).
 * Não exige sessão Auth — permanece estável após logout e refresh.
 */
export const VerifyEmailSent = () => {
  const location = useLocation();

  const state = useMemo(() => {
    const fromNavigation = location.state;

    if (
      fromNavigation
      && typeof fromNavigation.email === "string"
      && fromNavigation.email
    ) {
      return {
        email: fromNavigation.email,
        verificationEmailQueued: Boolean(fromNavigation.verificationEmailQueued),
      };
    }

    return readVerifyEmailSentState();
  }, [location.state]);

  const email = state?.email ?? null;
  const queued = state?.verificationEmailQueued ?? false;
  const hasState = Boolean(email);

  return (
    <AuthLayout pageTestId="verify-email-sent-page" logoTestId="verify-email-sent-logo">
      <AuthCard
        title="Verifique seu e-mail"
        subtitle={
          queued
            ? "Enviamos um link de confirmação para o seu endereço"
            : hasState
              ? "Sua conta foi criada, mas o envio do e-mail falhou"
              : "Confirme o endereço usado no cadastro"
        }
        titleTestId="verify-email-sent-title"
      >
        <div className="space-y-6">
          {queued ? (
            <CheckCircle2
              className="mx-auto h-12 w-12 text-green-400"
              aria-hidden
            />
          ) : (
            <AlertTriangle
              className="mx-auto h-12 w-12 text-amber-400"
              aria-hidden
            />
          )}

          {email && (
            <div
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300"
              data-testid="verify-email-sent-address"
            >
              <Mail size={18} className="shrink-0 text-zinc-400" aria-hidden />
              <span>{email}</span>
            </div>
          )}

          {queued ? (
            <div className="space-y-2 text-center" data-testid="verify-email-sent-success">
              <p className="text-zinc-300">Conta criada com sucesso.</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Abra o e-mail que enviamos e clique em &quot;Confirmar e-mail&quot;
                para ativar sua conta. Verifique também a pasta de spam.
              </p>
            </div>
          ) : (
            <div
              role="alert"
              className="space-y-2 text-center"
              data-testid="verify-email-sent-queue-error"
            >
              <p className="text-zinc-300">
                {hasState
                  ? "Seu cadastro foi criado, mas não conseguimos enviar o e-mail de verificação. Tente reenviar em instantes."
                  : "Se você acabou de se cadastrar, faça login com a conta criada para solicitar um novo e-mail de verificação."}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                O reenvio exige login na conta recém-criada. Após entrar, use a tela
                de verificação para solicitar um novo e-mail.
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="inline-block w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors text-center"
            data-testid="verify-email-sent-login-link"
          >
            Ir para login
          </Link>

          {!queued && (
            <p className="text-center text-xs text-zinc-500" data-testid="verify-email-sent-resend-hint">
              Após o login, se o e-mail ainda não estiver verificado, você poderá
              reenviar o link na tela de verificação.
            </p>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
