import {
  ALLOWED_IMAGE_EXTENSIONS,
  BLOCKED_IMAGE_EXTENSIONS,
  MIN_RECOMMENDED_HEIGHT,
  MIN_RECOMMENDED_WIDTH,
  PANORAMA_ASPECT_RATIO_TARGET,
  PANORAMA_ASPECT_RATIO_TOLERANCE,
  UNSUPPORTED_FORMAT_MESSAGE,
} from "@/utils/imageConstants";

/**
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

/**
 * @param {File} file
 * @returns {string}
 */
export function getImageFormat(file) {
  const extension = getFileExtension(file.name);
  return extension ? extension.toUpperCase() : "—";
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  const extension = getFileExtension(file.name);

  if (BLOCKED_IMAGE_EXTENSIONS.includes(extension)) {
    return { valid: false, error: UNSUPPORTED_FORMAT_MESSAGE };
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return { valid: false, error: UNSUPPORTED_FORMAT_MESSAGE };
  }

  const mimeType = file.type.toLowerCase();
  if (
    mimeType &&
    !mimeType.startsWith("image/") &&
    mimeType !== "application/octet-stream"
  ) {
    return { valid: false, error: UNSUPPORTED_FORMAT_MESSAGE };
  }

  return { valid: true };
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function isBelowRecommendedResolution(width, height) {
  return width < MIN_RECOMMENDED_WIDTH || height < MIN_RECOMMENDED_HEIGHT;
}

/**
 * Aviso (não bloqueante) quando a proporção foge do equirectangular ~2:1.
 *
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function isAtypicalPanoramaAspectRatio(width, height) {
  if (!width || !height) {
    return false;
  }

  const ratio = width / height;
  return Math.abs(ratio - PANORAMA_ASPECT_RATIO_TARGET) > PANORAMA_ASPECT_RATIO_TOLERANCE;
}

/**
 * @param {File} file
 * @returns {Promise<{ width: number, height: number, previewUrl: string }>}
 */
export function loadImagePreview(file) {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        previewUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Não foi possível carregar a imagem selecionada."));
    };

    img.src = previewUrl;
  });
}

/**
 * @param {string} filename
 * @returns {string}
 */
export function getDefaultImageTitle(filename) {
  const nameWithoutExtension = filename.replace(/\.[^.]+$/, "").trim();

  if (!nameWithoutExtension) {
    return "Sem título";
  }

  return nameWithoutExtension
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/**
 * @param {File} file
 * @returns {string}
 */
export function getOriginalFileType(file) {
  if (file.type && file.type.startsWith("image/")) {
    return file.type;
  }

  const extension = getFileExtension(file.name);
  const mimeByExtension = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return mimeByExtension[extension] ?? "application/octet-stream";
}
