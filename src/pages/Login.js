import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/utils/authErrors";

export const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }

    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout pageTestId="login-page" logoTestId="login-logo">
      <AuthCard
        title="Entrar"
        subtitle="Acesse sua conta para continuar"
        titleTestId="login-title"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
              data-testid="login-error"
            >
              {formError}
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

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              <div className="flex items-center gap-2">
                <Lock size={16} />
                Senha
              </div>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handleChange}
              disabled={isSubmitting}
              data-testid="input-password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
                data-testid="login-forgot-password-link"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="login-btn"
            className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-white hover:underline"
              data-testid="login-register-link"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
