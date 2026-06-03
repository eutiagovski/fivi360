/**
 * Serviço de perfil de usuário.
 *
 * Responsabilidade:
 * - Leitura e atualização do documento do usuário no Firestore (coleção `users`)
 * - Campos de perfil: name, email, companyName, companyBio, companyLogo, plan, publicSlug,
 *   portfolioEnabled, websiteUrl, instagramUrl, youtubeUrl, linkedinUrl, whatsappUrl
 * - Sincronização pós-cadastro (criação do documento `users/{uid}`)
 *
 * Modelo de referência: User em docs/architecture.md
 *
 * @see docs/firebase-foundation.md
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  checkSlugAvailability,
  SlugTakenError,
  SlugValidationError,
  syncSlugRegistryInTransaction,
} from "@/services/slugs/slugService";
import { assertPublicPortfolioEnabled } from "@/services/plans/planService";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

export { SlugTakenError, SlugValidationError };

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} companyName
 * @property {string} companyBio
 * @property {string} companyLogo
 * @property {string} plan
 * @property {string} publicSlug
 * @property {boolean} portfolioEnabled
 * @property {string} websiteUrl
 * @property {string} instagramUrl
 * @property {string} youtubeUrl
 * @property {string} linkedinUrl
 * @property {string} whatsappUrl
 */

/**
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {UserProfile}
 */
function mapUserDoc(userId, data) {
  return {
    id: userId,
    name: data.name ?? "",
    email: data.email ?? "",
    companyName: data.companyName ?? "",
    companyBio: data.companyBio ?? "",
    companyLogo: data.companyLogo ?? "",
    plan: data.plan ?? "starter",
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    websiteUrl: data.websiteUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    whatsappUrl: data.whatsappUrl ?? "",
  };
}

/**
 * Cria o documento do usuário no Firestore após cadastro no Firebase Auth.
 *
 * @param {string} userId
 * @param {{ name: string, email: string }} data
 */
export async function createUserProfile(userId, { name, email }) {
  const userRef = doc(db, "users", userId);

  await setDoc(userRef, {
    name,
    email,
    companyName: "",
    companyLogo: "",
    plan: "starter",
    publicSlug: "",
    portfolioEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Carrega o documento do usuário no Firestore.
 *
 * @param {string} userId
 * @returns {Promise<UserProfile | null>}
 */
export async function getUser(userId) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapUserDoc(userId, snapshot.data());
}

/**
 * Carrega perfil público via query por slug (leitura anônima permitida pelas rules).
 *
 * @param {string} slug — slug normalizado
 * @returns {Promise<UserProfile | null>}
 */
/**
 * Perfil do escritório para páginas públicas de projeto (leitura por userId).
 *
 * @param {string} userId
 * @returns {Promise<UserProfile | null>}
 */
export async function getPublicUserById(userId) {
  if (!userId) {
    return null;
  }

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapUserDoc(userId, snapshot.data());
}

export async function getPublicUserBySlug(slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return null;
  }

  const usersQuery = query(
    collection(db, "users"),
    where("publicSlug", "==", normalized),
    limit(1),
  );
  const snapshot = await getDocs(usersQuery);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return mapUserDoc(userDoc.id, userDoc.data());
}

/**
 * Atualiza campos do perfil do usuário no Firestore.
 *
 * @param {string} userId
 * @param {Partial<Omit<UserProfile, "id">>} data
 */
export async function updateUser(userId, data) {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Salva configurações do perfil com validação e registro único de slug.
 *
 * @param {string} userId
 * @param {{
 *   name: string,
 *   companyName: string,
 *   companyBio: string,
 *   publicSlug: string,
 *   portfolioEnabled: boolean,
 *   websiteUrl: string,
 *   instagramUrl: string,
 *   youtubeUrl: string,
 *   linkedinUrl: string,
 *   whatsappUrl: string,
 * }} data
 * @param {string} [previousSlug] — slug persistido antes da edição
 * @returns {Promise<{ publicSlug: string }>}
 */
export async function saveUserSettings(userId, data, previousSlug = "") {
  if (data.portfolioEnabled) {
    await assertPublicPortfolioEnabled(userId);
  }

  const normalizedSlug = normalizeSlug(data.publicSlug ?? "");
  const oldSlug = previousSlug ?? "";

  if (normalizedSlug && !isValidSlugFormat(normalizedSlug)) {
    throw new SlugValidationError();
  }

  if (normalizedSlug !== oldSlug) {
    const availability = await checkSlugAvailability(normalizedSlug, userId);

    if (!availability.available) {
      throw new SlugTakenError();
    }
  }

  const userRef = doc(db, "users", userId);
  const userUpdates = {
    name: data.name,
    companyName: data.companyName ?? "",
    companyBio: data.companyBio ?? "",
    publicSlug: normalizedSlug,
    portfolioEnabled: data.portfolioEnabled,
    websiteUrl: data.websiteUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    whatsappUrl: data.whatsappUrl ?? "",
    updatedAt: serverTimestamp(),
  };

  if (normalizedSlug !== oldSlug) {
    await runTransaction(db, async (transaction) => {
      await syncSlugRegistryInTransaction(transaction, userId, normalizedSlug, oldSlug);
      transaction.update(userRef, userUpdates);
    });
  } else if (normalizedSlug) {
    await runTransaction(db, async (transaction) => {
      const slugRef = doc(db, "slugs", normalizedSlug);
      const slugSnap = await transaction.get(slugRef);

      if (!slugSnap.exists()) {
        transaction.set(slugRef, {
          uid: userId,
          createdAt: serverTimestamp(),
        });
      } else if (slugSnap.data().uid !== userId) {
        throw new SlugTakenError();
      }

      transaction.update(userRef, userUpdates);
    });
  } else {
    await updateDoc(userRef, userUpdates);
  }

  return { publicSlug: normalizedSlug };
}
