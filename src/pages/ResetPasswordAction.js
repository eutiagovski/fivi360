import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  completePasswordReset,
  verifyPasswordResetOobCode,
} from "@/services/auth/authService";

const CONSUMED_ACTION_CODE_ERRORS = new Set([
  "auth/invalid-action-code",
  "auth/expired-action-code",
]);

export const ResetPasswordAction = () => {
  const [searchParams] = useSearchParams();
  const hasValidatedRef = useRef(false);

  const [status, setStatus] = useState("loading");
  const [oobCode, setOobCode] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasValidatedRef.current) {
      return;
    }
    hasValidatedRef.current = true;

    const mode = searchParams.get("mode");
    const code = searchParams.get("oobCode");

    if (mode !== "resetPassword" || !code) {
      setStatus("invalid");
      return;
    }

    (async () => {
      try {
        await verifyPasswordResetOobCode(code);
        setOobCode(code);
        setStatus("ready");
      } catch (err) {
        if (CONSUMED_ACTION_CODE_ERRORS.has(err?.code)) {
          setStatus("invalid");
          return;
        }

        setStatus("invalid");
      }
    })();
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }

    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await completePasswordReset(oobCode, password);
      setStatus("success");
    } catch (err) {
      if (CONSUMED_ACTION_CODE_ERRORS.has(err?.code)) {
        setStatus("invalid");
        return;
      }

      setFormError("Não foi possível redefinir sua senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout pageTestId="reset-password-action-page" logoTestId="reset-password-action-logo">
      <AuthCard
        title="Crie uma nova senha"
        subtitle="Digite sua nova senha para acessar o FIVI360."
        titleTestId="reset-password-action-title"
      >
        {status === "loading" && (
          <p className="text-center text-zinc-400" data-testid="reset-password-action-loading">
            Validando link...
          </p>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
                data-testid="reset-password-action-error"
              >
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-400 mb-2"
              >
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  Nova senha
                </div>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={handleChange}
                disabled={isSubmitting}
                data-testid="reset-password-input"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-400 mb-2"
              >
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  Confirmar nova senha
                </div>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                data-testid="reset-password-confirm-input"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="reset-password-submit-btn"
              className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
            >
              {isSubmitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {status === "success" && (
          <div className="space-y-6 text-center">
            <CheckCircle2
              className="mx-auto h-12 w-12 text-green-400"
              aria-hidden
            />
            <p className="text-zinc-300" data-testid="reset-password-action-success">
              Senha redefinida com sucesso.
            </p>
            <Link
              to="/login"
              className="inline-block w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all text-center"
              data-testid="reset-password-action-login"
            >
              Entrar
            </Link>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden />
            <p
              role="alert"
              className="text-red-300 text-sm"
              data-testid="reset-password-action-invalid"
            >
              Este link expirou ou já foi utilizado.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all text-center"
              data-testid="reset-password-action-request-new"
            >
              Solicitar novo link
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};
