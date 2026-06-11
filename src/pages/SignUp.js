import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LegalConsentCheckbox } from "@/components/legal/LegalConsentCheckbox";
import { CONSENT_REQUIRED_MESSAGE } from "@/components/legal/LegalConsentModal";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/utils/authErrors";
import {
  appendPlanQueryToPath,
  getPostAuthRedirectPath,
} from "@/utils/billingPlanFlow";

export const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");
  const { signUp, signInGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target;

    if (fieldName === "name") {
      setName(value);
    } else if (fieldName === "email") {
      setEmail(value);
    } else if (fieldName === "password") {
      setPassword(value);
    }

    if (formError) {
      setFormError(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signInGoogle();
      navigate(getPostAuthRedirectPath(plan), { replace: true });
    } catch (err) {
      setFormError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!acceptedLegal) {
      setFormError(CONSENT_REQUIRED_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, name);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setFormError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout pageTestId="signup-page" logoTestId="signup-logo">
      <AuthCard
        title="Criar conta"
        subtitle="Cadastre-se para começar a usar o FIVI360"
        titleTestId="signup-title"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
              data-testid="signup-error"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              <div className="flex items-center gap-2">
                <User size={16} />
                Nome
              </div>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={handleChange}
              disabled={isSubmitting}
              data-testid="input-name"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={handleChange}
              disabled={isSubmitting}
              data-testid="input-password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <LegalConsentCheckbox
            id="signup-legal-consent"
            checked={acceptedLegal}
            onCheckedChange={(value) => {
              setAcceptedLegal(value === true);
              if (formError) {
                setFormError(null);
              }
            }}
            disabled={isSubmitting}
            testId="signup-legal-consent-checkbox"
          />

          <button
            type="submit"
            disabled={isSubmitting || !acceptedLegal}
            data-testid="signup-btn"
            className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
          >
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900/50 px-3 text-zinc-500">ou</span>
            </div>
          </div>

          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            testId="signup-google-btn"
          />

          <p className="text-center text-sm text-zinc-400">
            Já tem uma conta?{" "}
            <Link
              to={appendPlanQueryToPath("/login", plan)}
              className="text-white hover:underline"
              data-testid="signup-login-link"
            >
              Entrar
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
