import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { PublicSocialLinks } from "@/components/public/PublicSocialLinks";
import { ProjectCard } from "@/components/common/ProjectCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePageSeo } from "@/hooks/usePageSeo";
import { recordPortfolioView } from "@/services/stats/publicViewTracking";
import {
  getPublicProjectsByUserId,
  mapProjectToCard,
} from "@/services/projects/projectService";
import { getPublicUserBySlug } from "@/services/users/userService";
import {
  buildPortfolioDescription,
  buildPortfolioTitle,
} from "@/utils/publicSeo";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

function PublicMessage({ title, description, dataTestId }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1
        className="text-3xl sm:text-4xl font-light tracking-tighter text-white mb-4"
        data-testid={dataTestId}
      >
        {title}
      </h1>
      {description && (
        <p className="text-base text-zinc-400 max-w-md">{description}</p>
      )}
    </div>
  );
}

export const PublicPortfolio = () => {
  const { slug: rawSlug } = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const recordedViewKeyRef = useRef(null);
  const [state, setState] = useState({
    loading: true,
    error: null,
    user: null,
    projects: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setState({ loading: true, error: null, user: null, projects: [] });

      const slug = normalizeSlug(rawSlug ?? "");

      if (!slug || !isValidSlugFormat(slug)) {
        if (!cancelled) {
          setState({ loading: false, error: "not_found", user: null, projects: [] });
        }
        return;
      }

      try {
        const user = await getPublicUserBySlug(slug);

        if (!user) {
          if (!cancelled) {
            setState({ loading: false, error: "not_found", user: null, projects: [] });
          }
          return;
        }

        if (!user?.portfolioAvailable) {
          if (!cancelled) {
            setState({ loading: false, error: "disabled", user: null, projects: [] });
          }
          return;
        }

        const projects = await getPublicProjectsByUserId(user.id);

        if (!cancelled) {
          setState({ loading: false, error: null, user, projects });
        }
      } catch {
        if (!cancelled) {
          setState({ loading: false, error: "not_found", user: null, projects: [] });
        }
      }
    }

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [rawSlug]);

  useEffect(() => {
    recordedViewKeyRef.current = null;
  }, [rawSlug]);

  useEffect(() => {
    if (state.loading || state.error || !state.user?.id || authLoading) {
      return;
    }

    const slug = normalizeSlug(rawSlug ?? "");
    const viewKey = `${slug}:${state.user.id}`;

    if (recordedViewKeyRef.current === viewKey) {
      return;
    }

    recordedViewKeyRef.current = viewKey;
    recordPortfolioView(state.user.id, Boolean(authUser));
    // authUser omitido das deps — valor lido no primeiro disparo; mudanças posteriores não reexecutam tracking.
  }, [state.loading, state.error, state.user?.id, rawSlug, authLoading]);

  const seo = useMemo(() => {
    if (state.error === "not_found") {
      return {
        title: "Página não encontrada | FIVI360",
        description: "Não há um portfólio público com este endereço.",
        enabled: !state.loading,
      };
    }

    if (state.error === "disabled") {
      return {
        title: "Portfólio indisponível | FIVI360",
        description: "O proprietário desativou este portfólio.",
        enabled: !state.loading,
      };
    }

    if (!state.user) {
      return { title: "", description: "", enabled: false };
    }

    return {
      title: buildPortfolioTitle(state.user),
      description: buildPortfolioDescription(state.user),
      enabled: true,
    };
  }, [state.loading, state.error, state.user]);

  usePageSeo(seo);

  if (state.loading) {
    return <AuthLoadingScreen />;
  }

  const cardProjects = state.projects.map(mapProjectToCard);
  const displayName =
    state.user?.companyName?.trim() || state.user?.displayName?.trim() || "Portfólio";
  const companyBio = state.user?.bio?.trim() ?? "";

  return (
    <div className="min-h-screen bg-[#050505] fade-in">
      <header className="border-b border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className="text-2xl font-light tracking-tighter text-white"
            data-testid="public-logo"
          >
            FIVI<span className="font-medium">360</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 md:p-12 lg:p-16">
        {state.error === "not_found" && (
          <PublicMessage
            title="Página não encontrada"
            description="Não há um portfólio público com este endereço."
            dataTestId="portfolio-not-found"
          />
        )}

        {state.error === "disabled" && (
          <PublicMessage
            title="Este portfólio não está disponível"
            description="O proprietário desativou este portfólio."
            dataTestId="portfolio-disabled"
          />
        )}

        {!state.error && state.user && (
          <>
            <div className="mb-12 max-w-2xl">
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white mb-3"
                data-testid="portfolio-user-name"
              >
                {displayName}
              </h2>
              {companyBio && (
                <p
                  className="text-lg text-zinc-400 leading-relaxed"
                  data-testid="portfolio-company-bio"
                >
                  {companyBio}
                </p>
              )}
              <PublicSocialLinks
                user={state.user}
                testIdPrefix="portfolio-social"
              />
            </div>

            <div>
              <SectionHeader
                title={`Projetos públicos`}
                dataTestId="portfolio-projects-title"
              />

              {cardProjects.length === 0 ? (
                <PublicMessage
                  title="Nenhum projeto público disponível."
                  dataTestId="portfolio-empty"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cardProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      href={`/u/${normalizeSlug(rawSlug ?? "")}/project/${project.id}`}
                      dataTestId={`portfolio-project-${project.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800 mt-16 p-6">
        <div className="max-w-7xl mx-auto text-center">
            <a href="https://fivi360.com.br" target="_blank" rel="noopener noreferrer" className="text-white font-medium">
          <p className="text-sm text-zinc-500">
            Powered by <span className="text-white font-medium">FIVI360</span>
          </p>
            </a>
        </div>
      </footer>
    </div>
  );
};
