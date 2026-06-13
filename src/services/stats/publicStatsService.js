/**
 * Contadores agregados de visualizações públicas (portfólio).
 *
 * Coleções:
 * - portfolioStats/{userId}
 * - projectStats/{projectId}
 * - imageStats/{imageId}
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

  const ref = doc(db, "portfolioStats", userId);

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
 * @param {string} projectId
 * @returns {Promise<void>}
 */
export async function incrementProjectViews(projectId) {
  if (!projectId) {
    return;
  }

  const ref = doc(db, "projectStats", projectId);

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
 * @param {string} imageId
 * @returns {Promise<void>}
 */
export async function incrementImageViews(imageId) {
  if (!imageId) {
    return;
  }

  const ref = doc(db, "imageStats", imageId);

  await setDoc(
    ref,
    {
      views: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
