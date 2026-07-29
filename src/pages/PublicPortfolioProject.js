import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ImageCard } from "@/components/common/ImageCard";
import {
  hasProjectCover,
  ProjectCoverPlaceholder,
} from "@/components/common/ProjectCoverPlaceholder";
import { PublicContactSection } from "@/components/public/PublicContactSection";
import {
  PublicPageMessage,
  PublicPageShell,
} from "@/components/public/PublicPageShell";
import { getProjectById } from "@/services/projects/projectService";
import {
  getImagesByProjectIdPublic,
  mapImageToCard,
} from "@/services/images/imageService";
import { getPublicUserBySlug } from "@/services/users/userService";
import { recordPublicProjectView } from "@/services/stats/publicViewTracking";
import {
  canAccessPortfolioProject,
} from "@/utils/publicAccess";
import {
  buildProjectDescription,
  buildProjectTitle,
} from "@/utils/publicSeo";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

export const PublicPortfolioProject = () => {
  const { slug: rawSlug, projectId } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: null,
    project: null,
    owner: null,
    images: [],
    slug: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const slug = normalizeSlug(rawSlug ?? "");

      if (!projectId || !slug || !isValidSlugFormat(slug)) {
        if (!cancelled) {
          setState({
            loading: false,
            error: "not_found",
            project: null,
            owner: null,
            images: [],
            slug,
          });
        }
        return;
      }

      setState({
        loading: true,
        error: null,
        project: null,
        owner: null,
        images: [],
        slug,
      });

      try {
        const owner = await getPublicUserBySlug(slug);

        if (!owner?.portfolioAvailable) {
          if (!cancelled) {
            setState({
              loading: false,
              error: "unavailable",
              project: null,
              owner: null,
              images: [],
              slug,
            });
          }
          return;
        }

        const project = await getProjectById(projectId);

        if (cancelled) {
          return;
        }

        if (!project) {
          setState({
            loading: false,
            error: "not_found",
            project: null,
            owner: null,
            images: [],
            slug,
          });
          return;
        }

        if (!canAccessPortfolioProject(project, owner.id)) {
          setState({
            loading: false,
            error: "unavailable",
            project: null,
            owner: null,
            images: [],
            slug,
          });
          return;
        }

        const images = await getImagesByProjectIdPublic(project.id);

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: null,
          project,
          owner,
          images,
          slug,
        });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            error: "load_failed",
            project: null,
            owner: null,
            images: [],
            slug,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [rawSlug, projectId]);

  useEffect(() => {
    if (state.loading || state.error || !state.project?.id) {
      return;
    }

    recordPublicProjectView(state.project.userId, state.project.id);
  }, [state.loading, state.error, state.project]);

  const cardImages = useMemo(
    () => state.images.map(mapImageToCard),
    [state.images],
  );

  const seo = useMemo(() => {
    if (state.loading) {
      return { title: "", description: "", enabled: false };
    }

    if (state.error === "not_found") {
      return {
        title: "Projeto não encontrado | FIVI360",
        description: "Este link pode estar incorreto ou o projeto foi removido.",
        enabled: true,
      };
    }

    if (state.error === "unavailable") {
      return {
        title: "Projeto indisponível | FIVI360",
        description: "O projeto não faz parte deste portfólio ou não é público.",
        enabled: true,
      };
    }

    if (state.error === "load_failed" || !state.project) {
      return {
        title: "Erro ao carregar projeto | FIVI360",
        description: "Tente novamente em alguns instantes.",
        enabled: true,
      };
    }

    return {
      title: buildProjectTitle(state.project, state.owner),
      description: buildProjectDescription(state.project, state.owner),
      enabled: true,
    };
  }, [state.loading, state.error, state.project, state.owner]);

  usePageSeo(seo);

  if (state.loading) {
    return (
      <PublicPageShell headerMode="minimal">
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          data-testid="portfolio-project-loading"
        >
          <Loader2 size={32} className="animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-400">Carregando projeto...</p>
        </div>
      </PublicPageShell>
    );
  }

  if (state.error === "not_found") {
    return (
      <PublicPageMessage
        title="Projeto não encontrado"
        description="Este link pode estar incorreto ou o projeto foi removido."
        dataTestId="portfolio-project-not-found"
        headerMode="minimal"
      />
    );
  }

  if (state.error === "unavailable") {
    return (
      <PublicPageMessage
        title="Este projeto não está disponível"
        description="O projeto não faz parte deste portfólio ou não é público."
        dataTestId="portfolio-project-unavailable"
        headerMode="minimal"
      />
    );
  }

  if (state.error === "load_failed" || !state.project) {
    return (
      <PublicPageMessage
        title="Não foi possível carregar o projeto"
        description="Tente novamente em alguns instantes."
        dataTestId="portfolio-project-error"
        headerMode="minimal"
      />
    );
  }

  const { project, owner, slug } = state;
  const hasCover = hasProjectCover(project.coverImage);

  return (
    <PublicPageShell office={owner}>
      <div className="mb-8">
        <Link
          to={`/u/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
          data-testid="portfolio-back-to-list"
        >
          <ArrowLeft size={16} />
          Voltar ao portfólio
        </Link>
      </div>

      <div className="mb-12">
        <div className="relative mb-8">
          {hasCover ? (
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover"
                data-testid="portfolio-project-cover"
              />
            </div>
          ) : (
            <ProjectCoverPlaceholder
              variant="hero"
              dataTestId="portfolio-project-cover-empty"
            />
          )}
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tighter text-white mb-4"
          data-testid="portfolio-project-name"
        >
          {project.title}
        </h1>

        {project.clientName && (
          <p
            className="text-sm text-zinc-400 mb-2"
            data-testid="portfolio-project-client"
          >
            Cliente: {project.clientName}
          </p>
        )}

        <p
          className="text-base text-zinc-300 leading-relaxed max-w-3xl"
          data-testid="portfolio-project-description"
        >
          {project.description || "Sem descrição."}
        </p>
      </div>

      <div>
        <SectionHeader
          title={`Imagens panorâmicas (${cardImages.length})`}
          dataTestId="portfolio-project-images-title"
        />

        {cardImages.length === 0 ? (
          <div
            className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
            data-testid="portfolio-project-images-empty"
          >
            <p className="text-zinc-400">
              Nenhuma imagem disponível neste projeto.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="portfolio-project-images-grid"
          >
            {cardImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                href={`/u/${slug}/project/${project.id}/image/${image.id}`}
                variant="public"
                dataTestId={`portfolio-image-card-${image.id}`}
              />
            ))}
          </div>
        )}
      </div>

      <PublicContactSection
        user={owner}
        testIdPrefix="portfolio-project-contact"
      />
    </PublicPageShell>
  );
};
