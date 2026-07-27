import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { ProjectCard } from "@/components/common/ProjectCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PublicContactSection } from "@/components/public/PublicContactSection";
import { PublicPageShell } from "@/components/public/PublicPageShell";
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

  return (
    <PublicPageShell
      office={!state.error ? state.user : undefined}
      headerMode={state.error ? "minimal" : "platform"}
    >
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
        <div className="pt-2">
          <SectionHeader
            title="Projetos públicos"
            dataTestId="portfolio-projects-title"
          />

          {cardProjects.length === 0 ? (
            <div
              className="text-center px-4 py-12 sm:px-6 sm:py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
              data-testid="portfolio-empty"
            >
              <p className="text-base font-medium text-white mb-2">
                Nenhum projeto público disponível.
              </p>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                Quando este portfólio tiver projetos publicados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
      )}

      {!state.error && state.user && (
        <PublicContactSection
          user={state.user}
          testIdPrefix="portfolio-contact"
        />
      )}
    </PublicPageShell>
  );
};
