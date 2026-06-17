/**
 * Validação funcional — stats/{userId} (Sprint Analytics 3.3)
 *
 * npx firebase emulators:exec --only firestore --project fivi360 "node scripts/validate-public-stats-rules.mjs"
 * ou, com emulator já em 8080: node scripts/validate-public-stats-rules.mjs
 */

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

import { initializeApp, getApps } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "fivi360";
const userId = "owner-user-stats";
const projectId = "project-stats-1";
const imageId = "image-stats-1";

if (getAdminApps().length === 0) {
  initAdminApp({ projectId: PROJECT_ID });
}

const adminDb = getAdminFirestore();

const clientApp =
  getApps().find((app) => app.name === "stats-client") ||
  initializeApp({ projectId: PROJECT_ID }, "stats-client");
const clientDb = getFirestore(clientApp);

if (!globalThis.__FIVI360_STATS_EMULATOR_CONNECTED__) {
  connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
  globalThis.__FIVI360_STATS_EMULATOR_CONNECTED__ = true;
}

const results = {
  rulesCompile: true,
  flowA: { ok: false, error: null, data: null, created: false, path: `stats/${userId}` },
  flowB: {
    ok: false,
    error: null,
    data: null,
    created: false,
    path: `stats/${userId}/projects/${projectId}`,
  },
  flowC: {
    ok: false,
    error: null,
    data: null,
    created: false,
    path: `stats/${userId}/images/${imageId}`,
  },
  secondIncrementB: { ok: false, error: null, data: null },
  invalidWriteBlocked: false,
  permissionErrors: [],
  usesIncrement: true,
};

/**
 * @param {string[]} pathSegments
 * @param {Record<string, unknown>} payload
 */
async function tryIncrement(pathSegments, payload) {
  const adminPath = pathSegments.join("/");

  try {
    const ref = doc(clientDb, ...pathSegments);
    const before = await adminDb.doc(adminPath).get();
    await setDoc(ref, payload, { merge: true });
    const after = await adminDb.doc(adminPath).get();
    return {
      ok: true,
      error: null,
      data: after.data() ?? null,
      created: !before.exists && after.exists,
      path: adminPath,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      data: null,
      created: false,
      path: adminPath,
    };
  }
}

async function tryInvalidWrite() {
  try {
    await setDoc(
      doc(clientDb, "stats", userId, "projects", projectId),
      { views: 999, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return false;
  } catch {
    return true;
  }
}

await adminDb.doc(`publicProfiles/${userId}`).set({
  uid: userId,
  slug: "test-office",
  portfolioEnabled: true,
  portfolioAvailable: true,
  displayName: "Test Office",
});

await adminDb.doc(`projects/${projectId}`).set({
  userId,
  visibility: "public",
  title: "Projeto teste stats",
});

await adminDb.doc(`images/${imageId}`).set({
  userId,
  projectId,
  visibility: "public",
  title: "Panorama teste stats",
});

results.flowA = await tryIncrement(["stats", userId], {
  portfolioViews: increment(1),
  updatedAt: serverTimestamp(),
});

results.flowB = await tryIncrement(["stats", userId, "projects", projectId], {
  views: increment(1),
  updatedAt: serverTimestamp(),
});

results.flowC = await tryIncrement(["stats", userId, "images", imageId], {
  views: increment(1),
  updatedAt: serverTimestamp(),
});

results.secondIncrementB = await tryIncrement(
  ["stats", userId, "projects", projectId],
  {
    views: increment(1),
    updatedAt: serverTimestamp(),
  },
);

results.invalidWriteBlocked = await tryInvalidWrite();

const finalProject = await adminDb.doc(`stats/${userId}/projects/${projectId}`).get();
results.secondIncrementB.data = finalProject.data() ?? null;

for (const key of ["flowA", "flowB", "flowC", "secondIncrementB"]) {
  if (results[key].error) {
    results.permissionErrors.push(`${key}: ${results[key].error}`);
  }
}

console.log(JSON.stringify(results, null, 2));

const allOk =
  results.flowA.ok &&
  results.flowB.ok &&
  results.flowC.ok &&
  results.secondIncrementB.ok &&
  results.invalidWriteBlocked &&
  results.flowA.data?.portfolioViews === 1 &&
  results.flowB.data?.views === 1 &&
  results.flowC.data?.views === 1 &&
  results.secondIncrementB.data?.views === 2 &&
  results.flowA.created &&
  results.flowB.created &&
  results.flowC.created;

process.exit(allOk ? 0 : 1);
