/**
 * Auditoria read-only de hotspots scene órfãos (RC-P0.9).
 *
 * Lógica pura espelhada/testada em:
 *   src/utils/orphanSceneHotspotAudit.js
 *
 * Uso:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/audit-orphan-scene-hotspots.mjs \
 *     --firebase-project=demo-fivi360 --allow-emulator --project-id=<id>
 *
 * Reparo opcional (nunca global; exige confirmação):
 *   ... --project-id=<id> --apply --confirm-project-id=<id>
 *
 * Dry-run (somente leitura) é o padrão. Não executar --apply em produção nesta sprint.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { initializeApp, getApps, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const {
  assertAuditEnvironment,
  evaluateOrphanSceneHotspot,
  formatMarkdownReport,
  parseAuditArgs,
  shouldExecuteWrites,
} = require("./lib/orphanSceneHotspotAuditCore.cjs");

function printHelp() {
  console.log(`
RC-P0.9 — Audit orphan scene hotspots (read-only by default)

Required environment clarity:
  --firebase-project=<id>     GCP/Firebase project id
  --allow-emulator            if FIRESTORE_EMULATOR_HOST is set
  --allow-production          if FIRESTORE_EMULATOR_HOST is NOT set

Scope (exactly one):
  --project-id=<id>
  --user-id=<uid>
  --global --confirm-global

Optional:
  --out-dir=reports
  --apply --confirm-project-id=<id>   repair ONLY with --project-id (never global)
`);
}

async function initAdmin(firebaseProject) {
  if (getApps().length === 0) {
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialPath) {
      const raw = await readFile(credentialPath, "utf8");
      initializeApp({
        credential: cert(JSON.parse(raw)),
        projectId: firebaseProject,
      });
    } else {
      try {
        initializeApp({
          credential: applicationDefault(),
          projectId: firebaseProject,
        });
      } catch {
        initializeApp({ projectId: firebaseProject });
      }
    }
  }
  return getFirestore();
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ projectId?: string, userId?: string }} scope
 */
async function loadImages(db, scope) {
  let query = db.collection("images");

  if (scope.projectId) {
    query = query.where("projectId", "==", scope.projectId);
  } else if (scope.userId) {
    query = query.where("userId", "==", scope.userId);
  }

  const snap = await query.get();
  /** @type {Map<string, Record<string, unknown>>} */
  const imagesById = new Map();

  for (const doc of snap.docs) {
    imagesById.set(doc.id, { id: doc.id, ...doc.data() });
  }

  return imagesById;
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {Map<string, Record<string, unknown>>} imagesById
 */
async function auditImages(db, imagesById) {
  /** @type {Array<Record<string, unknown>>} */
  const findings = [];
  /** @type {Array<{ path: string, before: Record<string, unknown> }>} */
  const repairCandidates = [];

  for (const [sourceImageId, sourceImage] of imagesById.entries()) {
    const hotspotsSnap = await db
      .collection("images")
      .doc(sourceImageId)
      .collection("hotspots")
      .get();

    for (const hotspotDoc of hotspotsSnap.docs) {
      const hotspot = hotspotDoc.data();
      const result = evaluateOrphanSceneHotspot({
        hotspotId: hotspotDoc.id,
        hotspot,
        sourceImageId,
        sourceImage,
        imagesById,
      });

      if (result.orphan && result.finding) {
        findings.push(result.finding);
        repairCandidates.push({
          path: `images/${sourceImageId}/hotspots/${hotspotDoc.id}`,
          before: { id: hotspotDoc.id, ...hotspot },
        });
      }
    }
  }

  return { findings, repairCandidates };
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {Array<{ path: string, before: Record<string, unknown> }>} candidates
 */
async function applyRepairs(db, candidates) {
  const deleted = [];
  const BATCH_LIMIT = 400;
  let batch = db.batch();
  let ops = 0;

  for (const candidate of candidates) {
    if (candidate.before.type !== "scene") {
      continue;
    }

    const segments = candidate.path.split("/");
    const ref = db
      .collection(segments[0])
      .doc(segments[1])
      .collection(segments[2])
      .doc(segments[3]);
    batch.delete(ref);
    deleted.push(candidate);
    ops += 1;

    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return deleted;
}

async function main() {
  const args = parseAuditArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const { firebaseProject, emulatorHost } = assertAuditEnvironment(args);

  console.log("=== RC-P0.9 orphan scene hotspots audit ===");
  console.log(`Firebase project ID: ${firebaseProject}`);
  if (typeof args.projectId === "string") {
    console.log(`Target projectId (scope): ${args.projectId}`);
  }
  console.log(
    `Firestore emulator: ${emulatorHost ? emulatorHost : "NOT SET (production path)"}`,
  );
  console.log(
    `Scope userId: ${args.userId || "(none)"} | global: ${Boolean(args.global)}`,
  );
  console.log(
    `Mode: ${shouldExecuteWrites(args) ? "APPLY (writes)" : "READ-ONLY (dry-run)"}`,
  );

  const db = await initAdmin(firebaseProject);

  const imagesById = await loadImages(db, {
    projectId: typeof args.projectId === "string" ? args.projectId : undefined,
    userId: typeof args.userId === "string" ? args.userId : undefined,
  });

  console.log(`Images loaded in scope: ${imagesById.size}`);

  const { findings, repairCandidates } = await auditImages(db, imagesById);

  let writesExecuted = 0;
  /** @type {Array<Record<string, unknown>>} */
  let deletedBackup = [];

  if (shouldExecuteWrites(args)) {
    deletedBackup = await applyRepairs(db, repairCandidates);
    writesExecuted = deletedBackup.length;
    console.log(`Repair applied. Deleted scene hotspots: ${writesExecuted}`);
  } else {
    console.log("Dry-run: zero writes executed.");
  }

  const generatedAt = new Date().toISOString();
  const scope = args.projectId
    ? `project:${args.projectId}`
    : args.userId
      ? `user:${args.userId}`
      : "global";

  const report = {
    generatedAt,
    firebaseProject,
    emulatorHost,
    mode: shouldExecuteWrites(args) ? "apply" : "read-only",
    scope,
    imagesScanned: imagesById.size,
    findingsCount: findings.length,
    writesExecuted,
    findings,
    repairBackup: deletedBackup.map((item) => ({
      path: item.path,
      before: item.before,
    })),
    pendingRepairCandidates: shouldExecuteWrites(args)
      ? []
      : repairCandidates.map((item) => ({
          path: item.path,
          before: item.before,
        })),
  };

  const outDir = path.resolve(
    ROOT,
    typeof args.outDir === "string" ? args.outDir : "reports",
  );
  await mkdir(outDir, { recursive: true });
  const stamp = generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(outDir, `orphan-scene-hotspots-${stamp}.json`);
  const mdPath = path.join(outDir, `orphan-scene-hotspots-${stamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(
    mdPath,
    formatMarkdownReport(findings, {
      generatedAt,
      firebaseProject,
      emulatorHost,
      mode: report.mode,
      scope,
      writesExecuted,
    }),
    "utf8",
  );

  console.log(`JSON report: ${jsonPath}`);
  console.log(`Markdown report: ${mdPath}`);
  console.log(`Findings: ${findings.length}`);
}

const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
