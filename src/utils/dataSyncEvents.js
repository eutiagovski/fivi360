/** Evento disparado após exclusão em cascata de um projeto. */
export const PROJECT_DELETED_EVENT = "fivi360:project-deleted";

/**
 * @typedef {Object} ProjectDeletedDetail
 * @property {string} projectId
 * @property {string[]} [imageIds]
 */

/**
 * Notifica hooks com cache local (Dashboard, listas) para remover dados do projeto excluído.
 *
 * @param {ProjectDeletedDetail} detail
 */
export function emitProjectDeleted(detail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(PROJECT_DELETED_EVENT, { detail }));
}
