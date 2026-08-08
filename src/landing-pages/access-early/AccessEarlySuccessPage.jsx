import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePageSeo } from "@/hooks/usePageSeo";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AccessEarlyFooter } from "./sections/AccessEarlyFooter";
import { SocialFollowActions } from "./components/SocialFollowActions";

const HOME_REDIRECT_MS = 20_000;

/**
 * Página dedicada de confirmação pós pré-cadastro.
 * PUBLIC_ALWAYS — sem Auth / LegalConsentGate.
 *
 * Navigation state esperado: `{ alreadyRegistered?: boolean }`
 * Sem state (refresh / acesso direto) → copy genérica de sucesso.
 * Não reenvia lead.
 * Redireciona para `/` após 10s.
 */
export function AccessEarlySuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const alreadyRegistered = location.state?.alreadyRegistered === true;
  const variant = alreadyRegistered ? "duplicate" : "success";

  usePageSeo({
    title: "FIVI360 | Você está na lista",
    description:
      "Seu pré-cadastro no FIVI360 foi confirmado. Acompanhe as novidades do acesso antecipado.",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, HOME_REDIRECT_MS);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-[#050505] text-white flex flex-col fade-in"
      data-testid="access-early-success-page"
      data-variant={variant}
      data-pathname={location.pathname}
      data-search={location.search}
    >
      <header
        className="w-full border-b border-zinc-800/60"
        data-testid="access-early-success-header"
      >
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center"
            data-testid="access-early-success-logo"
          >
            <BrandLogo className="h-4 md:h-5" />
          </Link>
          <Link
            to="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
            data-testid="access-early-success-home-link"
          >
            Voltar para o FIVI360
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12 md:py-16">
        <div className="max-w-md w-full space-y-10 text-center">
          <div
            className="space-y-4"
            role="status"
            aria-live="polite"
            data-testid="access-early-success-message"
          >
            <h1
              className="text-3xl md:text-4xl font-light tracking-tight"
              data-testid="access-early-success-title"
            >
              {alreadyRegistered
                ? "Você já está na lista! 🎉"
                : "Você está na lista! 🎉"}
            </h1>
            <p
              className="text-zinc-400 text-base leading-relaxed"
              data-testid="access-early-success-body"
            >
              {alreadyRegistered
                ? "Este e-mail já está cadastrado nesta campanha. Você continua na lista e receberá as novidades do acesso antecipado."
                : "Seu pré-cadastro no FIVI360 foi realizado com sucesso. Vamos avisar você assim que o acesso antecipado estiver disponível."}
            </p>
          </div>

          <SocialFollowActions />

          <p
            className="text-xs text-zinc-600"
            data-testid="access-early-success-redirect-hint"
          >
            Você será redirecionado para o início em alguns segundos.
          </p>

          {/* <Link
            to="/"
            className="inline-block text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
            data-testid="access-early-success-back"
          >
            Conhecer o FIVI360
          </Link> */}
        </div>
      </main>

      <AccessEarlyFooter />
    </div>
  );
}
