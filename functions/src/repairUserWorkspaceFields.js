const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Repara estrutura de workspace pessoal do usuário autenticado.
 *
 * Cobre lacunas que o cliente não consegue inspecionar pelas Rules
 * (get de workspaces/members exige membership ativa):
 * - workspaces/{uid} ausente
 * - workspaces/{uid}/members/{uid} ausente
 * - users.defaultWorkspaceId / activeWorkspaceId ausentes
 *
 * Não altera plan, billing, legalConsent, entitlements, slug ou perfil público.
 * Não sobrescreve workspace IDs já preenchidos (mesmo que ≠ uid).
 */
exports.repairUserWorkspaceFields = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    }

    void request.data;

    const uid = request.auth.uid;
    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const workspaceRef = db.collection("workspaces").doc(uid);
    const memberRef = workspaceRef.collection("members").doc(uid);

    let userSnap;
    let workspaceSnap;
    let memberSnap;

    try {
      [userSnap, workspaceSnap, memberSnap] = await Promise.all([
        userRef.get(),
        workspaceRef.get(),
        memberRef.get(),
      ]);
    } catch (err) {
      logger.error("repairUserWorkspaceFields: read failed", {
        uid,
        message: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError("internal", "Falha ao ler estrutura do usuário.");
    }

    if (!userSnap.exists) {
      throw new HttpsError("not-found", "Perfil de usuário não encontrado.");
    }

    const userData = userSnap.data() || {};
    const rawName =
      typeof userData.displayName === "string" ? userData.displayName.trim() : "";
    const workspaceName = rawName || "Meu workspace";

    /** @type {string[]} */
    const repaired = [];
    const batch = db.batch();

    if (!workspaceSnap.exists) {
      batch.set(workspaceRef, {
        ownerId: uid,
        name: workspaceName,
        type: "personal",
        planId: "starter",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      repaired.push("workspaces");
    }

    if (!memberSnap.exists) {
      batch.set(memberRef, {
        userId: uid,
        role: "owner",
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      repaired.push("workspaces/members");
    }

    const defaultWorkspaceId =
      typeof userData.defaultWorkspaceId === "string"
        ? userData.defaultWorkspaceId.trim()
        : "";
    const activeWorkspaceId =
      typeof userData.activeWorkspaceId === "string"
        ? userData.activeWorkspaceId.trim()
        : "";

    /** @type {Record<string, unknown>} */
    const userPatch = {};

    if (!defaultWorkspaceId) {
      userPatch.defaultWorkspaceId = uid;
    }

    if (!activeWorkspaceId) {
      userPatch.activeWorkspaceId = defaultWorkspaceId || uid;
    }

    if (Object.keys(userPatch).length > 0) {
      userPatch.updatedAt = FieldValue.serverTimestamp();
      batch.update(userRef, userPatch);
      repaired.push("users.workspaceIds");
    }

    if (repaired.length === 0) {
      logger.info("repairUserWorkspaceFields: idempotent skip", { uid });
      return {
        repaired: false,
        fields: [],
        defaultWorkspaceId: defaultWorkspaceId || uid,
        activeWorkspaceId: activeWorkspaceId || defaultWorkspaceId || uid,
      };
    }

    try {
      await batch.commit();
    } catch (err) {
      logger.error("repairUserWorkspaceFields: commit failed", {
        uid,
        message: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError("internal", "Falha ao reparar workspace do usuário.");
    }

    logger.info("repairUserWorkspaceFields: repaired", { uid, fields: repaired });

    return {
      repaired: true,
      fields: repaired,
      defaultWorkspaceId: userPatch.defaultWorkspaceId || defaultWorkspaceId || uid,
      activeWorkspaceId:
        userPatch.activeWorkspaceId || activeWorkspaceId || defaultWorkspaceId || uid,
    };
  },
);
