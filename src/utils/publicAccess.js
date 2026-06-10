import {
  isImageShared,
  isPubliclyAccessible,
} from "@/utils/visibility";

/**
 * Acesso via link do projeto compartilhado (não compartilhamento individual da imagem).
 *
 * @param {import("@/services/images/imageService").Image | null} image
 * @param {import("@/services/projects/projectService").Project | null} project
 * @returns {boolean}
 */
export function isProjectContextImageAccess(image, project) {
  if (!image?.projectId || !project) {
    return false;
  }

  if (isImageShared(image.visibility)) {
    return false;
  }

  return isPubliclyAccessible(project.visibility);
}

/**
 * @param {import("@/services/images/imageService").Image | null} image
 * @param {import("@/services/projects/projectService").Project | null} project
 * @returns {boolean}
 */
export function canAccessPublicImage(image, project) {
  if (!image) {
    return false;
  }

  if (isImageShared(image.visibility)) {
    return true;
  }

  return isProjectContextImageAccess(image, project);
}

/**
 * @param {import("@/services/projects/projectService").Project | null} project
 * @param {string | undefined} ownerUserId
 * @returns {boolean}
 */
export function canAccessPortfolioProject(project, ownerUserId) {
  if (!project || !ownerUserId) {
    return false;
  }

  if (project.userId !== ownerUserId) {
    return false;
  }

  return project.visibility === "public";
}

/**
 * @param {import("@/services/images/imageService").Image | null} image
 * @param {import("@/services/projects/projectService").Project | null} project
 * @param {string | undefined} ownerUserId
 * @returns {boolean}
 */
export function canAccessPortfolioImage(image, project, ownerUserId) {
  if (!image || !project || !ownerUserId) {
    return false;
  }

  if (image.projectId !== project.id) {
    return false;
  }

  return canAccessPortfolioProject(project, ownerUserId);
}

/**
 * @param {import("@/services/projects/projectService").Project | null} project
 * @returns {boolean}
 */
export function canAccessSharedProject(project) {
  return isPubliclyAccessible(project?.visibility);
}

/**
 * @param {import("@/services/images/imageService").Image | null} image
 * @param {import("@/services/projects/projectService").Project | null} project
 * @returns {boolean}
 */
export function canAccessSharedProjectImage(image, project) {
  if (!image || !project) {
    return false;
  }

  if (image.projectId !== project.id) {
    return false;
  }

  if (isImageShared(image.visibility)) {
    return true;
  }

  return isPubliclyAccessible(project.visibility);
}

/**
 * @param {import("@/services/images/imageService").Image | null} image
 * @returns {boolean}
 */
export function canAccessStandaloneImage(image) {
  if (!image) {
    return false;
  }

  if (image.projectId) {
    return false;
  }

  return image.visibility === "shared";
}

/**
 * @param {string} projectId
 * @returns {string}
 */
export function buildShareProjectUrl(projectId) {
  return `${window.location.origin}/share/project/${projectId}`;
}

/**
 * @param {{ id: string, projectId?: string | null } | string} imageOrId
 * @returns {string}
 */
export function buildShareImageUrl(imageOrId) {
  if (typeof imageOrId === "string") {
    return `${window.location.origin}/share/standalone/${imageOrId}`;
  }

  const { id, projectId } = imageOrId;

  if (projectId) {
    return `${window.location.origin}/share/project/${projectId}/image/${id}`;
  }

  return `${window.location.origin}/share/standalone/${id}`;
}

/**
 * @param {string} imageId
 * @returns {string}
 */
export function buildShareStandaloneImageUrl(imageId) {
  return `${window.location.origin}/share/standalone/${imageId}`;
}

/**
 * @param {string} slug
 * @param {string} projectId
 * @returns {string}
 */
export function buildPortfolioProjectUrl(slug, projectId) {
  return `${window.location.origin}/u/${slug}/project/${projectId}`;
}

/**
 * @param {string} slug
 * @param {string} projectId
 * @param {string} imageId
 * @returns {string}
 */
export function buildPortfolioImageUrl(slug, projectId, imageId) {
  return `${window.location.origin}/u/${slug}/project/${projectId}/image/${imageId}`;
}

/**
 * @param {import("@/services/images/imageService").Image | null | undefined} image
 * @returns {string | null}
 */
export function resolveLegacyShareImageRedirectPath(image) {
  if (!image) {
    return null;
  }

  if (image.projectId) {
    return `/share/project/${image.projectId}/image/${image.id}`;
  }

  return `/share/standalone/${image.id}`;
}
