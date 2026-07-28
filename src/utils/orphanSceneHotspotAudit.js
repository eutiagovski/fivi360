/**
 * Lógica pura de auditoria de hotspots scene órfãos (RC-P0.9).
 * Usada por testes e espelhada no script Admin CLI.
 */

export const AUDIT_REASONS = Object.freeze({
  TARGET_IMAGE_NOT_FOUND: "TARGET_IMAGE_NOT_FOUND",
  TARGET_OUTSIDE_PROJECT: "TARGET_OUTSIDE_PROJECT",
  TARGET_OWNED_BY_ANOTHER_USER: "TARGET_OWNED_BY_ANOTHER_USER",
  TARGET_MISSING_PROJECT_ID: "TARGET_MISSING_PROJECT_ID",
  TARGET_EMPTY: "TARGET_EMPTY",
  SOURCE_IMAGE_NOT_FOUND: "SOURCE_IMAGE_NOT_FOUND",
  INVALID_HOTSPOT_SHAPE: "INVALID_HOTSPOT_SHAPE",
  SELF_REFERENCE: "SELF_REFERENCE",
  UNKNOWN: "UNKNOWN",
});

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value);
}

/**
 * @param {object} params
 */
function buildFinding(params) {
  const {
    hotspotId,
    sourceImageId,
    hotspot,
    sourceImage,
    targetImageId,
    reason,
    recommendedAction,
  } = params;

  return {
    hotspotId,
    sourceImageId,
    targetImageId,
    projectId:
      normalizeId(sourceImage?.projectId) ?? normalizeId(hotspot?.projectId),
    userId: String(sourceImage?.userId ?? hotspot?.userId ?? ""),
    workspaceId: normalizeId(sourceImage?.workspaceId) ?? null,
    reason,
    recommendedAction,
    hotspotType: hotspot?.type ?? null,
  };
}

/**
 * Avalia um hotspot scene contra mapas de imagens (puro — sem I/O).
 *
 * @param {{
 *   hotspotId: string,
 *   hotspot: Record<string, unknown>,
 *   sourceImageId: string,
 *   sourceImage: Record<string, unknown> | null,
 *   imagesById: Map<string, Record<string, unknown>>,
 * }} input
 */
export function evaluateOrphanSceneHotspot(input) {
  const { hotspotId, hotspot, sourceImageId, sourceImage, imagesById } = input;

  if (!hotspot || typeof hotspot !== "object") {
    return {
      orphan: true,
      reason: AUDIT_REASONS.INVALID_HOTSPOT_SHAPE,
      recommendedAction: "Inspect or delete malformed hotspot document",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId: null,
        reason: AUDIT_REASONS.INVALID_HOTSPOT_SHAPE,
        recommendedAction: "Inspect or delete malformed hotspot document",
      }),
    };
  }

  if (hotspot.type !== "scene") {
    return {
      orphan: false,
      reason: "NOT_SCENE",
      recommendedAction: "none",
      finding: null,
    };
  }

  const targetImageId =
    typeof hotspot.targetImageId === "string" ? hotspot.targetImageId : null;

  if (!sourceImage) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.SOURCE_IMAGE_NOT_FOUND,
      recommendedAction: "Delete orphan hotspot under missing source image",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.SOURCE_IMAGE_NOT_FOUND,
        recommendedAction: "Delete orphan hotspot under missing source image",
      }),
    };
  }

  if (targetImageId === null) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.INVALID_HOTSPOT_SHAPE,
      recommendedAction:
        "Delete invalid scene hotspot or fix targetImageId type",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId: null,
        reason: AUDIT_REASONS.INVALID_HOTSPOT_SHAPE,
        recommendedAction:
          "Delete invalid scene hotspot or fix targetImageId type",
      }),
    };
  }

  if (targetImageId === "") {
    return {
      orphan: true,
      reason: AUDIT_REASONS.TARGET_EMPTY,
      recommendedAction: "Delete scene hotspot with empty targetImageId",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.TARGET_EMPTY,
        recommendedAction: "Delete scene hotspot with empty targetImageId",
      }),
    };
  }

  if (targetImageId === sourceImageId) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.SELF_REFERENCE,
      recommendedAction: "Delete self-referencing scene hotspot",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.SELF_REFERENCE,
        recommendedAction: "Delete self-referencing scene hotspot",
      }),
    };
  }

  const targetImage = imagesById.get(targetImageId) ?? null;

  if (!targetImage) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.TARGET_IMAGE_NOT_FOUND,
      recommendedAction: "Delete scene hotspot pointing to missing image",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.TARGET_IMAGE_NOT_FOUND,
        recommendedAction: "Delete scene hotspot pointing to missing image",
      }),
    };
  }

  const sourceProjectId = normalizeId(sourceImage.projectId);
  const targetProjectId = normalizeId(targetImage.projectId);

  if (!targetProjectId && sourceProjectId) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.TARGET_MISSING_PROJECT_ID,
      recommendedAction: "Delete scene hotspot whose target has no projectId",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.TARGET_MISSING_PROJECT_ID,
        recommendedAction:
          "Delete scene hotspot whose target has no projectId",
      }),
    };
  }

  if (sourceProjectId !== targetProjectId) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.TARGET_OUTSIDE_PROJECT,
      recommendedAction: "Delete scene hotspot pointing outside project",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.TARGET_OUTSIDE_PROJECT,
        recommendedAction: "Delete scene hotspot pointing outside project",
      }),
    };
  }

  const sourceUserId = String(sourceImage.userId ?? "");
  const targetUserId = String(targetImage.userId ?? "");

  if (sourceUserId && targetUserId && sourceUserId !== targetUserId) {
    return {
      orphan: true,
      reason: AUDIT_REASONS.TARGET_OWNED_BY_ANOTHER_USER,
      recommendedAction:
        "Delete scene hotspot pointing to another user's image",
      finding: buildFinding({
        hotspotId,
        sourceImageId,
        hotspot,
        sourceImage,
        targetImageId,
        reason: AUDIT_REASONS.TARGET_OWNED_BY_ANOTHER_USER,
        recommendedAction:
          "Delete scene hotspot pointing to another user's image",
      }),
    };
  }

  return {
    orphan: false,
    reason: "VALID",
    recommendedAction: "none",
    finding: null,
  };
}

/**
 * @param {string[]} argv
 * @returns {Record<string, string | boolean>}
 */
export function parseAuditArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {
    apply: false,
    global: false,
    confirmGlobal: false,
    allowEmulator: false,
    allowProduction: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--apply") {
      out.apply = true;
    } else if (arg === "--global") {
      out.global = true;
    } else if (arg === "--confirm-global") {
      out.confirmGlobal = true;
    } else if (arg === "--allow-emulator") {
      out.allowEmulator = true;
    } else if (arg === "--allow-production") {
      out.allowProduction = true;
    } else if (arg.startsWith("--project-id=")) {
      out.projectId = arg.slice("--project-id=".length);
    } else if (arg.startsWith("--user-id=")) {
      out.userId = arg.slice("--user-id=".length);
    } else if (arg.startsWith("--firebase-project=")) {
      out.firebaseProject = arg.slice("--firebase-project=".length);
    } else if (arg.startsWith("--confirm-project-id=")) {
      out.confirmProjectId = arg.slice("--confirm-project-id=".length);
    } else if (arg.startsWith("--out-dir=")) {
      out.outDir = arg.slice("--out-dir=".length);
    }
  }

  return out;
}

/**
 * @param {Record<string, string | boolean>} args
 * @param {{ FIREBASE_PROJECT?: string, GCLOUD_PROJECT?: string, FIRESTORE_EMULATOR_HOST?: string }} [env]
 */
export function assertAuditEnvironment(args, env = process.env) {
  const firebaseProject =
    (typeof args.firebaseProject === "string" && args.firebaseProject) ||
    env.FIREBASE_PROJECT ||
    env.GCLOUD_PROJECT ||
    "";

  if (!firebaseProject) {
    throw new Error(
      "Ambiente não claro: informe --firebase-project=<id> (ou FIREBASE_PROJECT).",
    );
  }

  const emulatorHost = env.FIRESTORE_EMULATOR_HOST || null;

  if (emulatorHost && !args.allowEmulator) {
    throw new Error(
      `FIRESTORE_EMULATOR_HOST=${emulatorHost} detectado. Passe --allow-emulator para continuar.`,
    );
  }

  if (!emulatorHost && !args.allowProduction) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST não definido. Passe --allow-production para apontar a produção (somente leitura por padrão).",
    );
  }

  const hasProject = Boolean(args.projectId);
  const hasUser = Boolean(args.userId);
  const hasGlobal = Boolean(args.global);

  const scopeCount = [hasProject, hasUser, hasGlobal].filter(Boolean).length;
  if (scopeCount !== 1) {
    throw new Error(
      "Informe exatamente um escopo: --project-id, --user-id ou --global --confirm-global.",
    );
  }

  if (hasGlobal && !args.confirmGlobal) {
    throw new Error("Modo --global exige --confirm-global.");
  }

  if (args.apply) {
    if (!hasProject) {
      throw new Error(
        "Modo --apply só é permitido com --project-id (nunca global/user-wide acidental).",
      );
    }
    if (args.confirmProjectId !== args.projectId) {
      throw new Error(
        "--apply exige --confirm-project-id igual a --project-id.",
      );
    }
  }

  return { firebaseProject, emulatorHost };
}

/**
 * Dry-run nunca executa writes — helper para testes do contrato do script.
 *
 * @param {{ apply?: boolean }} args
 * @returns {boolean}
 */
export function shouldExecuteWrites(args) {
  return Boolean(args?.apply);
}

/**
 * @param {Array<Record<string, unknown>>} findings
 * @param {Record<string, unknown>} meta
 * @returns {string}
 */
export function formatMarkdownReport(findings, meta) {
  const lines = [
    "# Orphan scene hotspots audit",
    "",
    `- Generated at: ${meta.generatedAt}`,
    `- Firebase project: ${meta.firebaseProject}`,
    `- Emulator: ${meta.emulatorHost ?? "no"}`,
    `- Mode: ${meta.mode}`,
    `- Scope: ${meta.scope}`,
    `- Findings: ${findings.length}`,
    `- Writes executed: ${meta.writesExecuted}`,
    "",
    "| hotspotId | sourceImageId | targetImageId | projectId | userId | reason | action |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of findings) {
    lines.push(
      `| ${row.hotspotId} | ${row.sourceImageId} | ${row.targetImageId ?? ""} | ${row.projectId ?? ""} | ${row.userId} | ${row.reason} | ${row.recommendedAction} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}
