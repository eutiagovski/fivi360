import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const NotFound = () => {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = isAuthenticated ? "/dashboard" : "/";
  };

  const homePath = isAuthenticated ? "/dashboard" : "/";

  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 md:p-12 fade-in"
      data-testid="not-found-page"
    >
      <div className="w-full max-w-lg text-center">
        <h1
          className="text-2xl font-light tracking-tighter text-white mb-10"
          data-testid="not-found-logo"
        >
          FIVI<span className="font-medium">360</span>
        </h1>

        <p className="text-5xl font-light text-zinc-700 mb-6" aria-hidden="true">
          404
        </p>

        <h2
          className="text-xl font-light text-white mb-4 tracking-tight"
          data-testid="not-found-title"
        >
          Página não encontrada
        </h2>

        <p className="text-zinc-400 mb-10 leading-relaxed">
          O endereço acessado não existe ou foi removido.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={homePath}
            data-testid="not-found-home-btn"
            className="w-full sm:w-auto px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors text-center"
          >
            Voltar para o início
          </Link>

          {!loading && isAuthenticated && (
            <Link
              to="/dashboard"
              data-testid="not-found-dashboard-btn"
              className="w-full sm:w-auto px-8 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-full font-medium btn-scale hover:bg-zinc-700 transition-colors text-center"
            >
              Ir para o dashboard
            </Link>
          )}

          <button
            type="button"
            onClick={handleGoBack}
            data-testid="not-found-back-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
