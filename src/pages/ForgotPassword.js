import { Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { PASSWORD_RESET_SUCCESS_MESSAGE } from "@/services/auth/passwordResetService";
import { getResetPasswordErrorMessage } from "@/utils/authErrors";

export const ForgotPassword = () => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setEmail(e.target.value);

    if (formError) {
      setFormError(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await resetPassword(email);
      setSuccessMessage(result?.message || PASSWORD_RESET_SUCCESS_MESSAGE);
    } catch (err) {
      setFormError(getResetPasswordErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout pageTestId="forgot-password-page" logoTestId="forgot-password-logo">
      <AuthCard
        title="Recuperar senha"
        subtitle="Informe seu email para receber um link de redefinição"
        titleTestId="forgot-password-title"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
              data-testid="forgot-password-error"
            >
              {formError}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-300"
              data-testid="forgot-password-success"
            >
              {successMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </div>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleChange}
              disabled={isSubmitting}
              data-testid="input-email"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="forgot-password-btn"
            className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
          >
            {isSubmitting ? "Enviando..." : "Enviar link"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Lembrou sua senha?{" "}
            <Link
              to="/login"
              className="text-white hover:underline"
              data-testid="forgot-password-login-link"
            >
              Entrar
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
