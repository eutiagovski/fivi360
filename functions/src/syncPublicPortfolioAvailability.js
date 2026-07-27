const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const {
  resolvePortfolioAvailableFromServerState,
} = require("./portfolio/resolvePortfolioAvailable");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Recalcula `publicProfiles/{uid}.portfolioAvailable` a partir do plano
 * (`users.plan`) e da preferência `portfolioEnabled`.
 *
 * RC-P0.5 / RC-P0.5A:
 * - UID apenas de request.auth.uid (payload ignorado).
 * - Entitlement só a partir de users.plan no servidor.
 * - Não usa workspaces.planId.
 */
exports.syncPublicPortfolioAvailability = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    }

    // Qualquer dado enviado pelo cliente (uid, planId, portfolioAvailable, etc.) é ignorado.
    void request.data;

    const uid = request.auth.uid;
    const db = getFirestore();

    let userSnap;
    let profileSnap;

    try {
      [userSnap, profileSnap] = await Promise.all([
        db.collection("users").doc(uid).get(),
        db.collection("publicProfiles").doc(uid).get(),
      ]);
    } catch (err) {
      logger.error("syncPublicPortfolioAvailability: read failed", {
        uid,
        message: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError("internal", "Falha ao ler perfil.");
    }

    if (!profileSnap.exists) {
      throw new HttpsError("not-found", "Perfil público não encontrado.");
    }

    const resolved = resolvePortfolioAvailableFromServerState({
      userExists: userSnap.exists,
      plan: userSnap.exists ? userSnap.data()?.plan : undefined,
      portfolioEnabled: profileSnap.data()?.portfolioEnabled,
    });

    if (!resolved.ok) {
      throw new HttpsError("not-found", "Perfil de usuário não encontrado.");
    }

    const { portfolioAvailable, planId } = resolved;
    const previousAvailable = profileSnap.data()?.portfolioAvailable === true;

    if (previousAvailable === portfolioAvailable) {
      logger.info("syncPublicPortfolioAvailability: idempotent skip", {
        uid,
        portfolioAvailable,
        planId,
      });
      return { portfolioAvailable };
    }

    try {
      await db.collection("publicProfiles").doc(uid).set(
        {
          portfolioAvailable,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      logger.error("syncPublicPortfolioAvailability: write failed", {
        uid,
        message: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError("internal", "Falha ao atualizar portfólio.");
    }

    logger.info("syncPublicPortfolioAvailability: updated", {
      uid,
      portfolioAvailable,
      planId,
    });

    return { portfolioAvailable };
  },
);
