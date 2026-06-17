import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getImageById } from "@/services/images/imageService";
import { getProjectById } from "@/services/projects/projectService";
import {
  getPortfolioStats,
  getTopImageStats,
  getTopProjectStats,
} from "@/services/stats/statsService";

/**
 * @typedef {Object} EnrichedProjectStat
 * @property {string} projectId
 * @property {number} views
 * @property {string} title
 */

/**
 * @typedef {Object} EnrichedImageStat
 * @property {string} imageId
 * @property {number} views
 * @property {string} title
 * @property {string | null} projectTitle
 */

const REMOVED_PROJECT_LABEL = "Projeto removido";
const REMOVED_IMAGE_LABEL = "Imagem removida";

/**
 * Métricas públicas do portfólio para o dashboard (somente usuário autenticado).
 */
export function usePortfolioStats() {
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: null,
    portfolioViews: 0,
    projectViewsTotal: 0,
    imageViewsTotal: 0,
    topProjects: [],
    topImages: [],
    hasMetrics: false,
  });

  const loadStats = useCallback(async () => {
    if (!user?.uid) {
      setState({
        loading: false,
        error: null,
        portfolioViews: 0,
        projectViewsTotal: 0,
        imageViewsTotal: 0,
        topProjects: [],
        topImages: [],
        hasMetrics: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [portfolio, projects, images] = await Promise.all([
        getPortfolioStats(user.uid),
        getTopProjectStats(user.uid, 5),
        getTopImageStats(user.uid, 5),
      ]);

      const projectTitleCache = new Map();

      /** @type {EnrichedProjectStat[]} */
      const topProjects = await Promise.all(
        projects.items.map(async (entry) => {
          const project = await getProjectById(entry.projectId);
          return {
            projectId: entry.projectId,
            views: entry.views,
            title: project?.title?.trim() || REMOVED_PROJECT_LABEL,
          };
        }),
      );

      /** @type {EnrichedImageStat[]} */
      const topImages = await Promise.all(
        images.items.map(async (entry) => {
          const image = await getImageById(entry.imageId);

          if (!image) {
            return {
              imageId: entry.imageId,
              views: entry.views,
              title: REMOVED_IMAGE_LABEL,
              projectTitle: null,
            };
          }

          let projectTitle = null;

          if (image.projectId) {
            if (projectTitleCache.has(image.projectId)) {
              projectTitle = projectTitleCache.get(image.projectId);
            } else {
              const project = await getProjectById(image.projectId);
              projectTitle = project?.title?.trim() || REMOVED_PROJECT_LABEL;
              projectTitleCache.set(image.projectId, projectTitle);
            }
          }

          return {
            imageId: entry.imageId,
            views: entry.views,
            title: image.title?.trim() || REMOVED_IMAGE_LABEL,
            projectTitle,
          };
        }),
      );

      const hasMetrics =
        portfolio.portfolioViews > 0 ||
        projects.totalViews > 0 ||
        images.totalViews > 0;

      setState({
        loading: false,
        error: null,
        portfolioViews: portfolio.portfolioViews,
        projectViewsTotal: projects.totalViews,
        imageViewsTotal: images.totalViews,
        topProjects,
        topImages,
        hasMetrics,
      });
    } catch (err) {
      setState({
        loading: false,
        error: err,
        portfolioViews: 0,
        projectViewsTotal: 0,
        imageViewsTotal: 0,
        topProjects: [],
        topImages: [],
        hasMetrics: false,
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return state;
}
