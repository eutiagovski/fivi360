import { useEffect, useState } from "react";
import {
  getImageById,
  getImagesByProjectIdPublic,
} from "@/services/images/imageService";
import { getProjectById } from "@/services/projects/projectService";
import { getPublicUserBySlug } from "@/services/users/userService";
import {
  canAccessPortfolioImage,
  canAccessSharedProject,
  canAccessSharedProjectImage,
  canAccessStandaloneImage,
} from "@/utils/publicAccess";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

/**
 * @typedef {'shared-project' | 'standalone' | 'portfolio'} PublicViewerAccessMode
 */

/**
 * @typedef {'not_found' | 'unavailable' | 'load_failed'} PublicViewerImageError
 */

/**
 * Carrega imagem e projeto para o viewer público, validando visibilidade.
 *
 * @param {string | undefined} imageId
 * @param {{
 *   accessMode?: PublicViewerAccessMode,
 *   expectedProjectId?: string,
 *   portfolioSlug?: string,
 * }} [options]
 * @returns {{
 *   image: import("@/services/images/imageService").Image | null,
 *   project: import("@/services/projects/projectService").Project | null,
 *   projectImages: import("@/services/images/imageService").Image[],
 *   previousImage: import("@/services/images/imageService").Image | null,
 *   nextImage: import("@/services/images/imageService").Image | null,
 *   isProjectContext: boolean,
 *   loading: boolean,
 *   error: PublicViewerImageError | null,
 * }}
 */
export function usePublicViewerImage(imageId, options = {}) {
  const {
    accessMode = "shared-project",
    expectedProjectId,
    portfolioSlug,
  } = options;

  const [image, setImage] = useState(null);
  const [project, setProject] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [isProjectContext, setIsProjectContext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!imageId) {
        if (!cancelled) {
          setImage(null);
          setProject(null);
          setProjectImages([]);
          setLoading(false);
          setError("not_found");
        }
        return;
      }

      setLoading(true);
      setError(null);
      setImage(null);
      setProject(null);
      setProjectImages([]);
      setIsProjectContext(false);

      try {
        const imageData = await getImageById(imageId);

        if (cancelled) {
          return;
        }

        if (!imageData) {
          setError("not_found");
          return;
        }

        if (
          expectedProjectId &&
          imageData.projectId !== expectedProjectId
        ) {
          setError("unavailable");
          return;
        }

        const projectData = imageData.projectId
          ? await getProjectById(imageData.projectId)
          : null;

        if (cancelled) {
          return;
        }

        let hasAccess = false;
        let projectContext = accessMode !== "standalone";

        if (accessMode === "standalone") {
          hasAccess = canAccessStandaloneImage(imageData);
          projectContext = false;
        } else if (accessMode === "shared-project") {
          hasAccess =
            Boolean(projectData) &&
            canAccessSharedProject(projectData) &&
            canAccessSharedProjectImage(imageData, projectData);
          projectContext = hasAccess;
        } else if (accessMode === "portfolio") {
          const slug = normalizeSlug(portfolioSlug ?? "");

          if (!slug || !isValidSlugFormat(slug)) {
            setError("unavailable");
            return;
          }

          const owner = await getPublicUserBySlug(slug);

          if (!owner?.portfolioAvailable) {
            setError("unavailable");
            return;
          }

          hasAccess = canAccessPortfolioImage(
            imageData,
            projectData,
            owner.id,
          );
          projectContext = hasAccess;
        }

        if (cancelled) {
          return;
        }

        if (!hasAccess) {
          setError("unavailable");
          return;
        }

        const imagesInProject = projectContext
          ? await getImagesByProjectIdPublic(imageData.projectId)
          : [];

        if (cancelled) {
          return;
        }

        setImage(imageData);
        setProject(projectData);
        setProjectImages(imagesInProject);
        setIsProjectContext(projectContext);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err?.code === "permission-denied" ||
          err?.code === "unauthenticated"
        ) {
          setError("unavailable");
        } else {
          setError("load_failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [imageId, accessMode, expectedProjectId, portfolioSlug]);

  const currentIndex = projectImages.findIndex((img) => img.id === imageId);
  const previousImage =
    currentIndex > 0 ? projectImages[currentIndex - 1] : null;
  const nextImage =
    currentIndex >= 0 && currentIndex < projectImages.length - 1
      ? projectImages[currentIndex + 1]
      : null;

  return {
    image,
    project,
    projectImages,
    previousImage,
    nextImage,
    isProjectContext,
    loading,
    error,
  };
}
