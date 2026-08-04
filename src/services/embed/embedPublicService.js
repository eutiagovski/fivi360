/**
 * Cliente HTTP para a Cloud Function pública getPublicEmbeddedProject.
 */

/**
 * @typedef {Object} PublicEmbedHotspotDTO
 * @property {string} id
 * @property {number} pitch
 * @property {number} yaw
 * @property {'info' | 'scene'} type
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [targetImageId]
 */

/**
 * @typedef {Object} EmbeddedImageDTO
 * @property {string} id
 * @property {string} name
 * @property {string} panoramaUrl
 * @property {number} order
 * @property {PublicEmbedHotspotDTO[]} hotspots
 */

/**
 * @typedef {Object} PublicEmbedSettingsDTO
 * @property {boolean} enabled
 * @property {string | null} initialImageId
 * @property {boolean} allowFullscreen
 * @property {boolean} allowNavigation
 * @property {boolean} showBranding
 */

/**
 * @typedef {Object} EmbeddedProjectDTO
 * @property {string} id
 * @property {string} name
 * @property {string | null} initialImageId
 * @property {EmbeddedImageDTO[]} images
 * @property {PublicEmbedSettingsDTO} embedSettings
 * @property {boolean} [empty]
 */

/**
 * @returns {string}
 */
function getFunctionsBaseUrl() {
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || "fivi360";
  const useEmulator =
    process.env.NODE_ENV === "development" &&
    process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true";

  if (useEmulator) {
    const host =
      process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
    const port = Number(
      process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001,
    );
    return `http://${host}:${port}/${projectId}/southamerica-east1`;
  }

  return `https://southamerica-east1-${projectId}.cloudfunctions.net`;
}

/**
 * @param {string} projectId
 * @returns {Promise<EmbeddedProjectDTO>}
 */
export async function fetchPublicEmbeddedProject(projectId) {
  if (!projectId) {
    const error = new Error("unavailable");
    error.code = "unavailable";
    throw error;
  }

  const url = `${getFunctionsBaseUrl()}/getPublicEmbeddedProject?projectId=${encodeURIComponent(projectId)}`;

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    const error = new Error("load_failed");
    error.code = "load_failed";
    throw error;
  }

  if (response.status === 404) {
    const error = new Error("unavailable");
    error.code = "unavailable";
    throw error;
  }

  if (!response.ok) {
    const error = new Error("load_failed");
    error.code = "load_failed";
    throw error;
  }

  /** @type {EmbeddedProjectDTO} */
  const data = await response.json();

  if (!data || typeof data.id !== "string" || !Array.isArray(data.images)) {
    const error = new Error("load_failed");
    error.code = "load_failed";
    throw error;
  }

  return data;
}
