/**
 * Contadores agregados de visualizações públicas (portfólio).
 *
 * Estrutura:
 * - stats/{userId}
 * - stats/{userId}/projects/{projectId}
 * - stats/{userId}/images/{imageId}
 *
 * Somente incrementos atômicos — sem histórico, IP ou visitante.
 */

import { doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function incrementPortfolioViews(userId) {
  if (!userId) {
    return;
  }

  const ref = doc(db, "stats", userId);

  await setDoc(
    ref,
    {
      portfolioViews: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * @param {string} userId — dono do portfólio
 * @param {string} projectId
 * @returns {Promise<void>}
 */
export async function incrementProjectViews(userId, projectId) {
  if (!userId || !projectId) {
    return;
  }

  const ref = doc(db, "stats", userId, "projects", projectId);

  await setDoc(
    ref,
    {
      views: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * @param {string} userId — dono do portfólio
 * @param {string} imageId
 * @returns {Promise<void>}
 */
export async function incrementImageViews(userId, imageId) {
  if (!userId || !imageId) {
    return;
  }

  const ref = doc(db, "stats", userId, "images", imageId);

  await setDoc(
    ref,
    {
      views: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
