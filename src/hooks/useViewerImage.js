import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getImageById,
  getImagesByProjectId,
  getLooseImagesByUserId,
} from "@/services/images/imageService";
import { getOwnedOrAccessibleProject } from "@/services/projects/projectService";
import { logInternalProjectAccessDenied } from "@/utils/projectAccess";

/**
 * @typedef {'not_found' | 'unauthorized' | 'load_failed'} ViewerImageError
 */

/**
 * Carrega imagem e projeto para o viewer privado, validando ownership.
 * Projeto público de terceiro NÃO concede acesso ao viewer interno.
 *
 * @param {string | undefined} imageId
 * @returns {{
 *   image: import("@/services/images/imageService").Image | null,
 *   project: import("@/services/projects/projectService").Project | null,
 *   projectImages: import("@/services/images/imageService").Image[],
 *   previousImage: import("@/services/images/imageService").Image | null,
 *   nextImage: import("@/services/images/imageService").Image | null,
 *   loading: boolean,
 *   error: ViewerImageError | null,
 * }}
 */
export function useViewerImage(imageId) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [project, setProject] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!imageId || !user?.uid) {
        if (!cancelled) {
          setImage(null);
          setProject(null);
          setProjectImages([]);
          setLoading(Boolean(imageId) && !user?.uid);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setImage(null);
      setProject(null);
      setProjectImages([]);

      try {
        const imageData = await getImageById(imageId);

        if (cancelled) {
          return;
        }

        if (!imageData) {
          setError("not_found");
          return;
        }

        // Acesso interno exige ownership da imagem — não revelar existência.
        if (imageData.userId !== user.uid) {
          logInternalProjectAccessDenied(
            imageData.projectId || imageId,
            "foreign_image",
          );
          setError("not_found");
          return;
        }

        let projectData = null;

        if (imageData.projectId) {
          projectData = await getOwnedOrAccessibleProject(
            imageData.projectId,
            user.uid,
          );

          if (cancelled) {
            return;
          }

          // Imagem própria mas projeto inacessível no contexto interno.
          if (!projectData) {
            setError("not_found");
            return;
          }
        }

        const imagesInContext = imageData.projectId
          ? await getImagesByProjectId(imageData.projectId, user.uid)
          : await getLooseImagesByUserId(user.uid).then((looseImages) =>
              [...looseImages].reverse(),
            );

        if (cancelled) {
          return;
        }

        setImage(imageData);
        setProject(projectData);
        setProjectImages(imagesInContext);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err?.code === "permission-denied" ||
          err?.code === "unauthenticated"
        ) {
          // Preferência de não enumeração: trata como não encontrado.
          setError("not_found");
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
  }, [imageId, user?.uid]);

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
    loading,
    error,
  };
}
