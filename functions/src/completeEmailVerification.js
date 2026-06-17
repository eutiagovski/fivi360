const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { EMAIL_TYPES } = require("./config/email");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Finaliza a verificação de e-mail e enfileira o welcome (idempotente).
 *
 * Requer sessão Auth; consulta Firebase Auth como fonte de verdade para emailVerified.
 */
exports.completeEmailVerification = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    }

    const uid = request.auth.uid;
    const authUser = await getAuth().getUser(uid);

    if (!authUser.emailVerified) {
      throw new HttpsError("failed-precondition", "E-mail ainda não verificado.");
    }

    const email = authUser.email;

    if (!email) {
      throw new HttpsError("failed-precondition", "E-mail do usuário indisponível.");
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);

    const claimResult = await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Perfil de usuário não encontrado.");
      }

      const userData = userSnap.data();

      if (userData.welcomeEmailQueuedAt) {
        return { shouldEnqueue: false };
      }

      transaction.update(userRef, {
        emailVerified: true,
        emailVerifiedAt: FieldValue.serverTimestamp(),
        welcomeEmailQueuedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        shouldEnqueue: true,
        name: typeof userData.displayName === "string" ? userData.displayName : "",
        companyName: typeof userData.companyName === "string" ? userData.companyName : "",
      };
    });

    if (!claimResult.shouldEnqueue) {
      logger.info("completeEmailVerification: welcome already queued", { uid });
      return { success: true, welcomeEmailQueued: false, alreadyQueued: true };
    }

    await db.collection("emailQueue").add({
      type: EMAIL_TYPES.WELCOME,
      to: email,
      userId: uid,
      payload: {
        name: claimResult.name,
        companyName: claimResult.companyName,
      },
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info("completeEmailVerification: welcome queued", { uid });
    return { success: true, welcomeEmailQueued: true, alreadyQueued: false };
  },
);
