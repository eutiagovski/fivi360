import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ImageCard } from "@/components/common/ImageCard";
import {
  hasProjectCover,
  ProjectCoverPlaceholder,
} from "@/components/common/ProjectCoverPlaceholder";
import {
  PublicPageMessage,
  PublicPageShell,
} from "@/components/public/PublicPageShell";
import { PublicSocialLinks } from "@/components/public/PublicSocialLinks";
import { getProjectById } from "@/services/projects/projectService";
import {
  getImagesByProjectIdPublic,
  mapImageToCard,
} from "@/services/images/imageService";
import { getPublicUserById } from "@/services/users/userService";
import { canAccessSharedProject } from "@/utils/publicAccess";

export const PublicSharedProject = () => {
  const { projectId } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: null,
    project: null,
    owner: null,
    images: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        if (!cancelled) {
          setState({
            loading: false,
            error: "not_found",
            project: null,
            owner: null,
            images: [],
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
      });

      try {
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
          });
          return;
        }

        if (!canAccessSharedProject(project)) {
          setState({
            loading: false,
            error: "private",
            project: null,
            owner: null,
            images: [],
          });
          return;
        }

        const [owner, images] = await Promise.all([
          getPublicUserById(project.userId).catch(() => null),
          getImagesByProjectIdPublic(project.id),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: null,
          project,
          owner,
          images,
        });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            error: "load_failed",
            project: null,
            owner: null,
            images: [],
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const cardImages = useMemo(
    () => state.images.map(mapImageToCard),
    [state.images],
  );

  if (state.loading) {
    return (
      <PublicPageShell>
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          data-testid="public-project-loading"
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
        dataTestId="public-project-not-found"
      />
    );
  }

  if (state.error === "private") {
    return (
      <PublicPageMessage
        title="Este projeto não está disponível"
        description="O proprietário definiu este projeto como privado."
        dataTestId="public-project-unavailable"
      />
    );
  }

  if (state.error === "load_failed" || !state.project) {
    return (
      <PublicPageMessage
        title="Não foi possível carregar o projeto"
        description="Tente novamente em alguns instantes."
        dataTestId="public-project-error"
      />
    );
  }

  const { project, owner } = state;
  const hasCover = hasProjectCover(project.coverImage);
  const officeName =
    owner?.companyName?.trim() || owner?.displayName?.trim() || "";
  const officeBio = owner?.bio?.trim() ?? "";

  return (
    <PublicPageShell>
      <div className="mb-12">
        <div className="relative mb-8">
          {hasCover ? (
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover"
                data-testid="public-project-cover"
              />
            </div>
          ) : (
            <ProjectCoverPlaceholder
              variant="hero"
              dataTestId="public-project-cover-empty"
            />
          )}
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tighter text-white mb-4"
          data-testid="public-project-name"
        >
          {project.title}
        </h1>

        {project.clientName && (
          <p
            className="text-sm text-zinc-400 mb-2"
            data-testid="public-project-client"
          >
            Cliente: {project.clientName}
          </p>
        )}

        <p
          className="text-base text-zinc-300 leading-relaxed max-w-3xl"
          data-testid="public-project-description"
        >
          {project.description || "Sem descrição."}
        </p>

        {officeName && (
          <div className="mt-8 pt-8 border-t border-zinc-800 max-w-2xl">
            <p
              className="text-sm text-zinc-500 mb-1"
              data-testid="public-project-office-label"
            >
              Escritório
            </p>
            <h2
              className="text-lg font-light text-white mb-2"
              data-testid="public-project-office-name"
            >
              {officeName}
            </h2>
            {officeBio && (
              <p
                className="text-sm text-zinc-400 leading-relaxed"
                data-testid="public-project-office-bio"
              >
                {officeBio}
              </p>
            )}
            {owner && <PublicSocialLinks user={owner} />}
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          title={`Imagens panorâmicas (${cardImages.length})`}
          dataTestId="public-project-images-title"
        />

        {cardImages.length === 0 ? (
          <div
            className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
            data-testid="public-project-images-empty"
          >
            <p className="text-zinc-400">
              Nenhuma imagem disponível neste projeto.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="public-project-images-grid"
          >
            {cardImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                href={`/share/project/${project.id}/image/${image.id}`}
                variant="public"
                dataTestId={`public-image-card-${image.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </PublicPageShell>
  );
};
