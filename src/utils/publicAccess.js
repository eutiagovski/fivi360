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
 * @param {string} projectId
 * @returns {string}
 */
export function buildShareProjectUrl(projectId) {
  return `${window.location.origin}/share/project/${projectId}`;
}

/**
 * @param {string} imageId
 * @returns {string}
 */
export function buildShareImageUrl(imageId) {
  return `${window.location.origin}/share/image/${imageId}`;
}
