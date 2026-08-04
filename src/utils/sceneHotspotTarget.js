/**
 * Resolução defensiva de destinos de hotspots scene (RC-P0.9).
 *
 * Valida em memória contra o conjunto de imagens já carregado no contexto
 * do viewer — sem leituras Firestore por clique.
 *
 * Tipos alinhados a HOTSPOT_TYPE_* em hotspotService (sem importar o service
 * para evitar puxar Firebase nos testes unitários).
 */

const HOTSPOT_TYPE_INFO = "info";
const HOTSPOT_TYPE_SCENE = "scene";

/** @typedef {'loading' | 'loaded' | 'failed'} ImagesLoadState */

/**
 * Contextos de navegação de hotspots scene.
 * @enum {string}
 */
export const SCENE_HOTSPOT_CONTEXT = Object.freeze({
  INTERNAL_PROJECT_VIEWER: "INTERNAL_PROJECT_VIEWER",
  PUBLIC_PROJECT_VIEWER: "PUBLIC_PROJECT_VIEWER",
  PUBLIC_PORTFOLIO_VIEWER: "PUBLIC_PORTFOLIO_VIEWER",
  PUBLIC_STANDALONE_VIEWER: "PUBLIC_STANDALONE_VIEWER",
  LANDING_DEMO: "LANDING_DEMO",
  EMBED_VIEWER: "EMBED_VIEWER",
  LEGACY_ROUTE: "LEGACY_ROUTE",
  OUTRO: "OUTRO",
});

/**
 * Motivos de resolução (inclui estados de carga e inconsistências).
 * @enum {string}
 */
export const SCENE_HOTSPOT_TARGET_REASON = Object.freeze({
  VALID: "VALID",
  TARGET_EMPTY: "TARGET_EMPTY",
  TARGET_IMAGE_NOT_FOUND: "TARGET_IMAGE_NOT_FOUND",
  TARGET_OUTSIDE_PROJECT: "TARGET_OUTSIDE_PROJECT",
  TARGET_OWNED_BY_ANOTHER_USER: "TARGET_OWNED_BY_ANOTHER_USER",
  TARGET_NOT_PUBLICLY_AVAILABLE: "TARGET_NOT_PUBLICLY_AVAILABLE",
  TARGET_MISSING_PANORAMA_DATA: "TARGET_MISSING_PANORAMA_DATA",
  TARGET_MISSING_PROJECT_ID: "TARGET_MISSING_PROJECT_ID",
  SELF_REFERENCE: "SELF_REFERENCE",
  INVALID_HOTSPOT_SHAPE: "INVALID_HOTSPOT_SHAPE",
  SCENE_NAVIGATION_DISABLED: "SCENE_NAVIGATION_DISABLED",
  IMAGES_LOADING: "IMAGES_LOADING",
  IMAGES_LOAD_FAILED: "IMAGES_LOAD_FAILED",
  UNKNOWN: "UNKNOWN",
});

export const SCENE_HOTSPOT_UNAVAILABLE_MESSAGE =
  "Esta imagem não está mais disponível.";

export const SCENE_HOTSPOT_UNAVAILABLE_SHORT = "Destino indisponível.";

/**
 * @typedef {Object} SceneTargetImageLike
 * @property {string} id
 * @property {string} [userId]
 * @property {string | null} [projectId]
 * @property {string} [originalUrl]
 * @property {string} [previewUrl]
 * @property {'private' | 'shared' | 'public'} [visibility]
 * @property {string} [title]
 * @property {boolean} [archived]
 * @property {boolean} [removed]
 * @property {boolean} [unavailable]
 */

/**
 * @typedef {Object} SceneHotspotTargetResolution
 * @property {boolean} available
 * @property {boolean} isOrphanCandidate
 * @property {string} reason
 * @property {string | null} targetImageId
 * @property {SceneTargetImageLike | null} targetImage
 */

/**
 * Constrói Map imageId → imagem para lookup O(1).
 *
 * @param {SceneTargetImageLike[] | null | undefined} images
 * @returns {Map<string, SceneTargetImageLike>}
 */
export function buildAvailableSceneTargetMap(images) {
  const map = new Map();

  if (!Array.isArray(images)) {
    return map;
  }

  for (const image of images) {
    if (image?.id) {
      map.set(image.id, image);
    }
  }

  return map;
}

/**
 * @param {unknown} hotspot
 * @returns {boolean}
 */
export function isInfoHotspot(hotspot) {
  return Boolean(hotspot && hotspot.type === HOTSPOT_TYPE_INFO);
}

/**
 * @param {unknown} hotspot
 * @returns {boolean}
 */
export function isSceneHotspot(hotspot) {
  return Boolean(hotspot && hotspot.type === HOTSPOT_TYPE_SCENE);
}

/**
 * Hotspots info não dependem de targetImageId.
 *
 * @param {unknown} hotspot
 * @returns {SceneHotspotTargetResolution}
 */
export function resolveInfoHotspotIndependence(hotspot) {
  if (!isInfoHotspot(hotspot)) {
    return {
      available: false,
      isOrphanCandidate: false,
      reason: SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE,
      targetImageId: null,
      targetImage: null,
    };
  }

  return {
    available: true,
    isOrphanCandidate: false,
    reason: SCENE_HOTSPOT_TARGET_REASON.VALID,
    targetImageId: null,
    targetImage: null,
  };
}

/**
 * @param {SceneTargetImageLike | null | undefined} image
 * @returns {boolean}
 */
function hasPanoramaData(image) {
  if (!image) {
    return false;
  }

  return Boolean(image.originalUrl || image.previewUrl);
}

/**
 * @param {SceneTargetImageLike | null | undefined} image
 * @returns {boolean}
 */
function isMarkedUnavailable(image) {
  if (!image) {
    return true;
  }

  return Boolean(image.archived || image.removed || image.unavailable);
}

/**
 * Contextos públicos / demo: o conjunto disponível já é filtrado pelo loader.
 * @param {string} context
 * @returns {boolean}
 */
function isPublicFacingContext(context) {
  return (
    context === SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER ||
    context === SCENE_HOTSPOT_CONTEXT.PUBLIC_PORTFOLIO_VIEWER ||
    context === SCENE_HOTSPOT_CONTEXT.PUBLIC_STANDALONE_VIEWER ||
    context === SCENE_HOTSPOT_CONTEXT.LANDING_DEMO ||
    context === SCENE_HOTSPOT_CONTEXT.EMBED_VIEWER
  );
}

/**
 * Resolve se um hotspot scene pode navegar no contexto atual.
 *
 * @param {{
 *   hotspot: unknown,
 *   availableImagesById?: Map<string, SceneTargetImageLike>,
 *   availableImages?: SceneTargetImageLike[],
 *   context: string,
 *   sourceImageId?: string | null,
 *   expectedProjectId?: string | null,
 *   expectedUserId?: string | null,
 *   imagesLoadState?: ImagesLoadState,
 *   allowSelfReference?: boolean,
 *   sceneNavigationEnabled?: boolean,
 * }} options
 * @returns {SceneHotspotTargetResolution}
 */
export function resolveSceneHotspotTarget(options) {
  const {
    hotspot,
    availableImagesById,
    availableImages,
    context,
    sourceImageId = null,
    expectedProjectId = null,
    expectedUserId = null,
    imagesLoadState = "loaded",
    allowSelfReference = false,
    sceneNavigationEnabled = true,
  } = options ?? {};

  const empty = {
    available: false,
    isOrphanCandidate: false,
    reason: SCENE_HOTSPOT_TARGET_REASON.UNKNOWN,
    targetImageId: null,
    targetImage: null,
  };

  if (isInfoHotspot(hotspot)) {
    return resolveInfoHotspotIndependence(hotspot);
  }

  if (!hotspot || typeof hotspot !== "object") {
    return {
      ...empty,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE,
    };
  }

  if (hotspot.type !== HOTSPOT_TYPE_SCENE) {
    return {
      ...empty,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE,
    };
  }

  if (!sceneNavigationEnabled) {
    return {
      ...empty,
      reason: SCENE_HOTSPOT_TARGET_REASON.SCENE_NAVIGATION_DISABLED,
      targetImageId:
        typeof hotspot.targetImageId === "string"
          ? hotspot.targetImageId
          : null,
    };
  }

  if (context === SCENE_HOTSPOT_CONTEXT.PUBLIC_STANDALONE_VIEWER) {
    return {
      ...empty,
      reason: SCENE_HOTSPOT_TARGET_REASON.SCENE_NAVIGATION_DISABLED,
      targetImageId:
        typeof hotspot.targetImageId === "string"
          ? hotspot.targetImageId
          : null,
    };
  }

  if (imagesLoadState === "loading") {
    return {
      ...empty,
      reason: SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOADING,
      targetImageId:
        typeof hotspot.targetImageId === "string"
          ? hotspot.targetImageId
          : null,
    };
  }

  if (imagesLoadState === "failed") {
    return {
      ...empty,
      reason: SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOAD_FAILED,
      targetImageId:
        typeof hotspot.targetImageId === "string"
          ? hotspot.targetImageId
          : null,
    };
  }

  const rawTargetId = hotspot.targetImageId;
  if (rawTargetId === undefined || rawTargetId === null || rawTargetId === "") {
    return {
      ...empty,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_EMPTY,
    };
  }

  if (typeof rawTargetId !== "string") {
    return {
      ...empty,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.INVALID_HOTSPOT_SHAPE,
      targetImageId: null,
    };
  }

  const targetImageId = rawTargetId;

  if (!allowSelfReference && sourceImageId && targetImageId === sourceImageId) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.SELF_REFERENCE,
      targetImageId,
      targetImage: null,
    };
  }

  const imagesById =
    availableImagesById instanceof Map
      ? availableImagesById
      : buildAvailableSceneTargetMap(availableImages);

  const targetImage = imagesById.get(targetImageId) ?? null;

  if (!targetImage) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: isPublicFacingContext(context)
        ? SCENE_HOTSPOT_TARGET_REASON.TARGET_NOT_PUBLICLY_AVAILABLE
        : SCENE_HOTSPOT_TARGET_REASON.TARGET_IMAGE_NOT_FOUND,
      targetImageId,
      targetImage: null,
    };
  }

  if (isMarkedUnavailable(targetImage)) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_IMAGE_NOT_FOUND,
      targetImageId,
      targetImage,
    };
  }

  if (
    expectedProjectId !== undefined &&
    expectedProjectId !== null &&
    expectedProjectId !== ""
  ) {
    const targetProjectId = targetImage.projectId ?? null;
    if (targetProjectId !== expectedProjectId) {
      return {
        available: false,
        isOrphanCandidate: true,
        reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_OUTSIDE_PROJECT,
        targetImageId,
        targetImage,
      };
    }
  } else if (
    context === SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER &&
    expectedProjectId === null &&
    targetImage.projectId
  ) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_OUTSIDE_PROJECT,
      targetImageId,
      targetImage,
    };
  }

  if (
    context === SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER &&
    expectedUserId &&
    targetImage.userId &&
    targetImage.userId !== expectedUserId
  ) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_OWNED_BY_ANOTHER_USER,
      targetImageId,
      targetImage,
    };
  }

  if (
    (context === SCENE_HOTSPOT_CONTEXT.INTERNAL_PROJECT_VIEWER ||
      context === SCENE_HOTSPOT_CONTEXT.PUBLIC_PROJECT_VIEWER ||
      context === SCENE_HOTSPOT_CONTEXT.PUBLIC_PORTFOLIO_VIEWER ||
      context === SCENE_HOTSPOT_CONTEXT.LANDING_DEMO ||
      context === SCENE_HOTSPOT_CONTEXT.EMBED_VIEWER) &&
    !targetImage.projectId &&
    expectedProjectId
  ) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_MISSING_PROJECT_ID,
      targetImageId,
      targetImage,
    };
  }

  if (!hasPanoramaData(targetImage)) {
    return {
      available: false,
      isOrphanCandidate: true,
      reason: SCENE_HOTSPOT_TARGET_REASON.TARGET_MISSING_PANORAMA_DATA,
      targetImageId,
      targetImage,
    };
  }

  return {
    available: true,
    isOrphanCandidate: false,
    reason: SCENE_HOTSPOT_TARGET_REASON.VALID,
    targetImageId,
    targetImage,
  };
}

/**
 * @param {SceneHotspotTargetResolution | null | undefined} resolution
 * @returns {boolean}
 */
export function isSceneHotspotTargetAvailable(resolution) {
  return Boolean(resolution?.available);
}

/**
 * Indica órfão confirmado (lista carregada e destino inválido).
 * Não é verdadeiro enquanto loading/failed.
 *
 * @param {SceneHotspotTargetResolution | null | undefined} resolution
 * @returns {boolean}
 */
export function isConfirmedOrphanSceneHotspot(resolution) {
  return Boolean(resolution?.isOrphanCandidate);
}

/**
 * Filtra hotspots scene inválidos (útil em viewers públicos / landing).
 * Preserva info e scene válidos. Durante loading, preserva todos.
 *
 * @param {import("@/services/hotspots/hotspotService").Hotspot[]} hotspots
 * @param {Omit<Parameters<typeof resolveSceneHotspotTarget>[0], 'hotspot'>} options
 * @returns {import("@/services/hotspots/hotspotService").Hotspot[]}
 */
export function filterNavigableHotspots(hotspots, options) {
  if (!Array.isArray(hotspots)) {
    return [];
  }

  return hotspots.filter((hotspot) => {
    if (!isSceneHotspot(hotspot)) {
      return true;
    }

    const resolution = resolveSceneHotspotTarget({
      ...options,
      hotspot,
    });

    if (resolution.reason === SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOADING) {
      return true;
    }

    if (resolution.reason === SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOAD_FAILED) {
      return true;
    }

    return resolution.available;
  });
}

/**
 * Decide navegação segura para um clique em hotspot scene.
 *
 * @param {Parameters<typeof resolveSceneHotspotTarget>[0]} options
 * @returns {{
 *   canNavigate: boolean,
 *   shouldShowUnavailableFeedback: boolean,
 *   resolution: SceneHotspotTargetResolution,
 * }}
 */
export function evaluateSceneHotspotNavigation(options) {
  const resolution = resolveSceneHotspotTarget(options);

  if (resolution.available) {
    return {
      canNavigate: true,
      shouldShowUnavailableFeedback: false,
      resolution,
    };
  }

  const pendingLoad =
    resolution.reason === SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOADING ||
    resolution.reason === SCENE_HOTSPOT_TARGET_REASON.IMAGES_LOAD_FAILED;

  return {
    canNavigate: false,
    shouldShowUnavailableFeedback:
      !pendingLoad && isConfirmedOrphanSceneHotspot(resolution),
    resolution,
  };
}
