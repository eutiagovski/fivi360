import { useEffect, useState } from "react";
import { getProjectById } from "@/services/projects/projectService";
import { getImagesByProjectIdPublic } from "@/services/images/imageService";
import { isPubliclyAccessible } from "@/utils/visibility";

/**
 * @typedef {'not_found' | 'private' | 'no_images' | 'load_failed'} LandingDemoError
 */

/**
 * Carrega projeto demo e imagens públicas para a seção Showcase da landing.
 * Espelha regras de visibilidade de PublicProject.js.
 *
 * @param {string | undefined} projectId
 * @param {{ enabled?: boolean }} [options]
 * @returns {{
 *   project: import("@/services/projects/projectService").Project | null,
 *   images: import("@/services/images/imageService").Image[],
 *   loading: boolean,
 *   error: LandingDemoError | null,
 *   isAvailable: boolean,
 * }}
 */
export function useLandingDemo(projectId, { enabled = true } = {}) {
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled || !projectId || projectId === "COLOCAR_ID_DO_PROJETO_AQUI") {
        if (!cancelled) {
          setProject(null);
          setImages([]);
          setLoading(false);
          setError(enabled ? "not_found" : null);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setProject(null);
      setImages([]);

      try {
        const projectData = await getProjectById(projectId);

        if (cancelled) {
          return;
        }

        if (!projectData) {
          setError("not_found");
          return;
        }

        if (!isPubliclyAccessible(projectData.visibility)) {
          setError("private");
          return;
        }

        const projectImages = await getImagesByProjectIdPublic(projectData.id);

        if (cancelled) {
          return;
        }

        if (projectImages.length === 0) {
          setError("no_images");
          return;
        }

        setProject(projectData);
        setImages(projectImages);
      } catch {
        if (!cancelled) {
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
  }, [projectId, enabled]);

  const isAvailable = !loading && !error && images.length > 0;

  return {
    project,
    images,
    loading,
    error,
    isAvailable,
  };
}
