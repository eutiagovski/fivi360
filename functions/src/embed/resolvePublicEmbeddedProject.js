/**
 * Elegibilidade de Embed no servidor (espelha canUseProjectEmbed do app).
 * Fonte: users.plan — Professional e superiores com status active/trialing.
 */

const { normalizePlanId } = require("../portfolio/resolvePortfolioAvailable");

const EMBED_PLAN_IDS = new Set(["professional", "studio", "enterprise"]);

/**
 * @param {unknown} plan — users.plan
 * @returns {boolean}
 */
function canUseProjectEmbed(plan) {
  return EMBED_PLAN_IDS.has(normalizePlanId(plan));
}

/**
 * Defaults seguros quando embedSettings está ausente.
 * @param {unknown} raw
 */
function normalizeEmbedSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      enabled: false,
      initialImageId: null,
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
    };
  }

  const initialImageId =
    typeof raw.initialImageId === "string" && raw.initialImageId.trim()
      ? raw.initialImageId.trim()
      : null;

  return {
    enabled: raw.enabled === true,
    initialImageId,
    allowFullscreen: raw.allowFullscreen !== false,
    allowNavigation: raw.allowNavigation !== false,
    showBranding: true,
  };
}

/**
 * @param {string | null} initialImageId
 * @param {{ id: string }[]} images
 * @returns {string | null}
 */
function resolveInitialImageId(initialImageId, images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  if (
    typeof initialImageId === "string" &&
    initialImageId &&
    images.some((image) => image.id === initialImageId)
  ) {
    return initialImageId;
  }

  return images[0].id;
}

/**
 * Hotspot público mínimo.
 * @param {string} id
 * @param {FirebaseFirestore.DocumentData} data
 */
function mapPublicHotspot(id, data) {
  const base = {
    id,
    pitch: Number(data.pitch) || 0,
    yaw: Number(data.yaw) || 0,
  };

  if (data.type === "scene") {
    return {
      ...base,
      type: "scene",
      targetImageId:
        typeof data.targetImageId === "string" ? data.targetImageId : "",
    };
  }

  return {
    ...base,
    type: "info",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
  };
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} projectId
 * @returns {Promise<{
 *   ok: true,
 *   project: object,
 * } | { ok: false, code: 'not_found' | 'unavailable' | 'empty' }>}
 */
async function resolvePublicEmbeddedProject(db, projectId) {
  if (!projectId || typeof projectId !== "string") {
    return { ok: false, code: "not_found" };
  }

  const projectSnap = await db.collection("projects").doc(projectId).get();

  if (!projectSnap.exists) {
    return { ok: false, code: "not_found" };
  }

  const projectData = projectSnap.data() || {};
  const embedSettings = normalizeEmbedSettings(projectData.embedSettings);

  if (!embedSettings.enabled) {
    return { ok: false, code: "unavailable" };
  }

  const ownerId =
    typeof projectData.userId === "string" ? projectData.userId : "";

  if (!ownerId) {
    return { ok: false, code: "unavailable" };
  }

  const ownerSnap = await db.collection("users").doc(ownerId).get();

  if (!ownerSnap.exists) {
    return { ok: false, code: "unavailable" };
  }

  if (!canUseProjectEmbed(ownerSnap.data()?.plan)) {
    return { ok: false, code: "unavailable" };
  }

  const imagesSnap = await db
    .collection("images")
    .where("projectId", "==", projectId)
    .get();

  /** @type {{ id: string, name: string, panoramaUrl: string, order: number, createdAtMs: number, hotspots: object[] }[]} */
  const imageRows = [];

  for (const imageDoc of imagesSnap.docs) {
    const data = imageDoc.data() || {};
    const panoramaUrl =
      (typeof data.originalUrl === "string" && data.originalUrl) ||
      (typeof data.previewUrl === "string" && data.previewUrl) ||
      "";

    if (!panoramaUrl) {
      continue;
    }

    const createdAt = data.createdAt;
    const createdAtMs =
      createdAt && typeof createdAt.toMillis === "function"
        ? createdAt.toMillis()
        : 0;

    const hotspotsSnap = await imageDoc.ref.collection("hotspots").get();
    const hotspots = hotspotsSnap.docs.map((hotspotDoc) =>
      mapPublicHotspot(hotspotDoc.id, hotspotDoc.data() || {}),
    );

    imageRows.push({
      id: imageDoc.id,
      name: typeof data.title === "string" ? data.title : "",
      panoramaUrl,
      createdAtMs,
      hotspots,
    });
  }

  imageRows.sort((a, b) => a.createdAtMs - b.createdAtMs);

  const images = imageRows.map((row, index) => ({
    id: row.id,
    name: row.name,
    panoramaUrl: row.panoramaUrl,
    order: index,
    hotspots: row.hotspots,
  }));

  if (images.length === 0) {
    return {
      ok: true,
      project: {
        id: projectSnap.id,
        name: typeof projectData.title === "string" ? projectData.title : "",
        initialImageId: null,
        images: [],
        embedSettings: {
          enabled: true,
          initialImageId: null,
          allowFullscreen: embedSettings.allowFullscreen,
          allowNavigation: embedSettings.allowNavigation,
          showBranding: true,
        },
        empty: true,
      },
    };
  }

  const initialImageId = resolveInitialImageId(
    embedSettings.initialImageId,
    images,
  );

  return {
    ok: true,
    project: {
      id: projectSnap.id,
      name: typeof projectData.title === "string" ? projectData.title : "",
      initialImageId,
      images,
      embedSettings: {
        enabled: true,
        initialImageId,
        allowFullscreen: embedSettings.allowFullscreen,
        allowNavigation: embedSettings.allowNavigation,
        showBranding: true,
      },
    },
  };
}

module.exports = {
  EMBED_PLAN_IDS,
  canUseProjectEmbed,
  normalizeEmbedSettings,
  resolveInitialImageId,
  resolvePublicEmbeddedProject,
};
