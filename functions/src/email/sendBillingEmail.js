const { getAuth } = require("firebase-admin/auth");
const { logger } = require("firebase-functions");

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @returns {Promise<string | null>}
 */
async function resolveUserEmail(db, userId) {
  try {
    const authUser = await getAuth().getUser(userId);
    if (authUser.email) {
      return authUser.email;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("sendBillingEmail: failed to read auth email", { userId, error: message });
  }

  const userSnap = await db.collection("users").doc(userId).get();
  const userData = userSnap.data();

  const firestoreEmail =
    typeof userData?.email === "string" ? userData.email.trim() : "";

  return firestoreEmail || null;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @returns {Promise<string | undefined>}
 */
async function resolveUserDisplayName(db, userId) {
  const userSnap = await db.collection("users").doc(userId).get();
  const userData = userSnap.data();
  const displayName =
    typeof userData?.displayName === "string"
      ? userData.displayName.trim()
      : typeof userData?.name === "string"
        ? userData.name.trim()
        : "";

  return displayName || undefined;
}

module.exports = {
  resolveUserEmail,
  resolveUserDisplayName,
};
