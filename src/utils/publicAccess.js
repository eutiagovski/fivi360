import { isPubliclyAccessible } from "@/utils/visibility";

/**
 * @param {import("@/services/images/imageService").Image | null} image
 * @param {import("@/services/projects/projectService").Project | null} project
 * @returns {boolean}
 */
export function canAccessPublicImage(image, project) {
  if (!image) {
    return false;
  }

  if (isPubliclyAccessible(image.visibility)) {
    return true;
  }

  if (project && isPubliclyAccessible(project.visibility)) {
    return true;
  }

  return false;
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
