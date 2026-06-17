/**
 * Leitura de métricas públicas agregadas (dashboard).
 *
 * Estrutura Firestore:
 * - stats/{userId}
 * - stats/{userId}/projects/{projectId}
 * - stats/{userId}/images/{imageId}
 *
 * Somente leitura pelo dono autenticado (rules).
 */

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

/**
 * @typedef {Object} PortfolioStats
 * @property {number} portfolioViews
 * @property {import("firebase/firestore").Timestamp | null} updatedAt
 */

/**
 * @typedef {Object} ProjectStatEntry
 * @property {string} projectId
 * @property {number} views
 * @property {import("firebase/firestore").Timestamp | null} updatedAt
 */

/**
 * @typedef {Object} ImageStatEntry
 * @property {string} imageId
 * @property {number} views
 * @property {import("firebase/firestore").Timestamp | null} updatedAt
 */

/**
 * @typedef {Object} TopProjectStatsResult
 * @property {ProjectStatEntry[]} items
 * @property {number} totalViews
 */

/**
 * @typedef {Object} TopImageStatsResult
 * @property {ImageStatEntry[]} items
 * @property {number} totalViews
 */

/**
 * @param {string} userId
 * @returns {Promise<PortfolioStats>}
 */
export async function getPortfolioStats(userId) {
  if (!userId) {
    return { portfolioViews: 0, updatedAt: null };
  }

  const snapshot = await getDoc(doc(db, "stats", userId));

  if (!snapshot.exists()) {
    return { portfolioViews: 0, updatedAt: null };
  }

  const data = snapshot.data();

  return {
    portfolioViews: typeof data.portfolioViews === "number" ? data.portfolioViews : 0,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {string} userId
 * @param {number} [limit=5]
 * @returns {Promise<TopProjectStatsResult>}
 */
export async function getTopProjectStats(userId, limit = 5) {
  if (!userId) {
    return { items: [], totalViews: 0 };
  }

  const snapshot = await getDocs(collection(db, "stats", userId, "projects"));

  /** @type {ProjectStatEntry[]} */
  const entries = snapshot.docs
    .map((entry) => ({
      projectId: entry.id,
      views: typeof entry.data().views === "number" ? entry.data().views : 0,
      updatedAt: entry.data().updatedAt ?? null,
    }))
    .sort((a, b) => b.views - a.views);

  const safeLimit = Math.max(1, limit);

  return {
    items: entries.slice(0, safeLimit),
    totalViews: entries.reduce((sum, entry) => sum + entry.views, 0),
  };
}

/**
 * @param {string} userId
 * @param {number} [limit=5]
 * @returns {Promise<TopImageStatsResult>}
 */
export async function getTopImageStats(userId, limit = 5) {
  if (!userId) {
    return { items: [], totalViews: 0 };
  }

  const snapshot = await getDocs(collection(db, "stats", userId, "images"));

  /** @type {ImageStatEntry[]} */
  const entries = snapshot.docs
    .map((entry) => ({
      imageId: entry.id,
      views: typeof entry.data().views === "number" ? entry.data().views : 0,
      updatedAt: entry.data().updatedAt ?? null,
    }))
    .sort((a, b) => b.views - a.views);

  const safeLimit = Math.max(1, limit);

  return {
    items: entries.slice(0, safeLimit),
    totalViews: entries.reduce((sum, entry) => sum + entry.views, 0),
  };
}
