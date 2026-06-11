import { Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { enqueueVerifyEmail } from "@/services/email/emailQueueService";

const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmail = () => {
  const { user, signOut } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const [resendError, setResendError] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = useCallback(async () => {
    if (!user?.email || cooldownSeconds > 0) {
      return;
    }

    setResendError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      await enqueueVerifyEmail({
        to: user.email,
        userId: user.uid,
        name: user.displayName || "",
      });
      setResendMessage("Enviamos um novo e-mail de verificação.");
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendError("Não foi possível reenviar o e-mail. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  }, [cooldownSeconds, user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const resendDisabled = isResending || cooldownSeconds > 0;

  return (
    <AuthLayout pageTestId="verify-email-page" logoTestId="verify-email-logo">
      <AuthCard
        title="Verifique seu e-mail"
        subtitle="Enviamos um link de confirmação para o seu endereço de e-mail"
        titleTestId="verify-email-title"
      >
        <div className="space-y-6">
          {user?.email && (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
              <Mail size={18} className="shrink-0 text-zinc-400" aria-hidden />
              <span data-testid="verify-email-address">{user.email}</span>
            </div>
          )}

          <p className="text-sm text-zinc-400 leading-relaxed">
            Abra o e-mail que enviamos e clique em &quot;Confirmar e-mail&quot; para
            ativar sua conta. Verifique também a pasta de spam.
          </p>

          {resendError && (
            <div
              role="alert"
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
              data-testid="verify-email-resend-error"
            >
              {resendError}
            </div>
          )}

          {resendMessage && (
            <div
              role="status"
              className="rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-300"
              data-testid="verify-email-resend-success"
            >
              {resendMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            data-testid="verify-email-resend-button"
            className="w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldownSeconds > 0
              ? `Reenviar e-mail (${cooldownSeconds}s)`
              : "Reenviar e-mail"}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            data-testid="verify-email-sign-out-button"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-medium hover:bg-zinc-800 transition-all"
          >
            Sair
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
