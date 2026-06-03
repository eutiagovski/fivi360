import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getImageById,
  getImagesByProjectId,
  getLooseImagesByUserId,
} from "@/services/images/imageService";
import { getProjectById } from "@/services/projects/projectService";

/**
 * @typedef {'not_found' | 'unauthorized' | 'load_failed'} ViewerImageError
 */

/**
 * Carrega imagem e projeto para o viewer privado, validando ownership.
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
          setLoading(false);
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

        if (imageData.userId !== user.uid) {
          setError("unauthorized");
          return;
        }

        const [projectData, imagesInContext] = await Promise.all([
          imageData.projectId
            ? getProjectById(imageData.projectId)
            : Promise.resolve(null),
          imageData.projectId
            ? getImagesByProjectId(imageData.projectId, user.uid)
            : getLooseImagesByUserId(user.uid).then((looseImages) =>
                [...looseImages].reverse(),
              ),
        ]);

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
          setError("unauthorized");
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
