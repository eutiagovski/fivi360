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
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { LEGAL_VERSIONS } from "@/config/legal";
import {
  checkSlugAvailability,
  resolveSlugToUid,
  SlugTakenError,
  SlugValidationError,
  syncSlugRegistryInTransaction,
} from "@/services/slugs/slugService";
import { DEFAULT_BILLING, normalizeBilling } from "@/config/billing";
import { assertPublicPortfolioEnabled } from "@/services/plans/planService";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

export { SlugTakenError, SlugValidationError };

/**
 * @param {"signup" | "modal_existing_user"} acceptedSource
 */
export function buildLegalConsent(acceptedSource) {
  return {
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion: LEGAL_VERSIONS.termsVersion,
    privacyVersion: LEGAL_VERSIONS.privacyVersion,
    acceptedAt: serverTimestamp(),
    acceptedSource,
  };
}

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
 * @property {import("@/config/billing").UserBilling} billing
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
    billing: normalizeBilling(data.billing),
  };
}

/**
 * @param {string} userId
 * @returns {import("firebase/firestore").DocumentReference}
 */
function publicProfileRef(userId) {
  return doc(db, "users", userId, "public", "profile");
}

/**
 * @param {string} userId
 * @returns {import("firebase/firestore").DocumentReference}
 */
function publicProfilesCollectionRef(userId) {
  return doc(db, "publicProfiles", userId);
}

/**
 * Campos expostos em users/{uid}/public/profile (sem email, plan, billing).
 *
 * @param {import("firebase/firestore").DocumentData} data
 */
function buildPublicProfilePayload(data) {
  return {
    name: data.name ?? "",
    companyName: data.companyName ?? "",
    companyBio: data.companyBio ?? "",
    companyLogo: data.companyLogo ?? "",
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    websiteUrl: data.websiteUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    whatsappUrl: data.whatsappUrl ?? "",
    updatedAt: serverTimestamp(),
  };
}

/**
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {UserProfile}
 */
function mapPublicProfileDoc(userId, data) {
  return {
    id: userId,
    name: data.name ?? "",
    email: "",
    companyName: data.companyName ?? "",
    companyBio: data.companyBio ?? "",
    companyLogo: data.companyLogo ?? "",
    plan: "starter",
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    websiteUrl: data.websiteUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    whatsappUrl: data.whatsappUrl ?? "",
    billing: { ...DEFAULT_BILLING },
  };
}

/**
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} data
 */
async function syncPublicProfile(userId, data) {
  const payload = buildPublicProfilePayload(data);

  await Promise.all([
    setDoc(publicProfileRef(userId), payload, { merge: true }),
    setDoc(publicProfilesCollectionRef(userId), payload, { merge: true }),
  ]);
}

/**
 * Garante publicProfiles/{uid} para contas criadas antes da Sprint 13.3.
 * Só o owner pode ler users/{uid} — chamado em getUser (sessão autenticada).
 *
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} userData
 */
async function ensurePublicProfile(userId, userData) {
  const snapshot = await getDoc(publicProfilesCollectionRef(userId));

  if (!snapshot.exists()) {
    await syncPublicProfile(userId, userData);
  }
}

/**
 * Backfill de publicProfiles/{uid} após login (contas anteriores à Sprint 13.3).
 *
 * @param {string} userId
 */
export async function ensurePublicProfileForUser(userId) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return;
  }

  await ensurePublicProfile(userId, snapshot.data());
}

/**
 * Cria o documento do usuário no Firestore após cadastro no Firebase Auth.
 *
 * @param {string} userId
 * @param {{ name: string, email: string, acceptedSource?: "signup" | "modal_existing_user" }} data
 */
export async function createUserProfile(userId, { name, email, acceptedSource }) {
  const userRef = doc(db, "users", userId);

  const payload = {
    name,
    email,
    companyName: "",
    companyLogo: "",
    plan: "starter",
    publicSlug: "",
    portfolioEnabled: false,
    billing: { ...DEFAULT_BILLING },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (acceptedSource) {
    payload.legalConsent = buildLegalConsent(acceptedSource);
  }

  await setDoc(userRef, payload);
  await syncPublicProfile(userId, payload);
}

/**
 * Registra ou atualiza o aceite legal no documento do usuário.
 *
 * @param {string} userId
 * @param {"signup" | "modal_existing_user"} acceptedSource
 */
export async function saveLegalConsent(userId, acceptedSource) {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    legalConsent: buildLegalConsent(acceptedSource),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Dados brutos do documento users/{uid} (inclui legalConsent).
 *
 * @param {string} userId
 * @returns {Promise<({ id: string } & import("firebase/firestore").DocumentData) | null>}
 */
export async function getUserFirestoreData(userId) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: userId, ...snapshot.data() };
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

  const data = snapshot.data();
  await ensurePublicProfile(userId, data);

  return mapUserDoc(userId, data);
}

/**
 * Perfil do escritório para páginas públicas (users/{uid}/public/profile).
 *
 * @param {string} userId
 * @returns {Promise<UserProfile | null>}
 */
export async function getPublicUserById(userId) {
  if (!userId) {
    return null;
  }

  const topLevel = await getDoc(publicProfilesCollectionRef(userId));

  if (topLevel.exists()) {
    return mapPublicProfileDoc(userId, topLevel.data());
  }

  const nested = await getDoc(publicProfileRef(userId));

  if (nested.exists()) {
    return mapPublicProfileDoc(userId, nested.data());
  }

  return null;
}

/**
 * Perfil público via slug (/u/:slug) — resolve slugs/{slug} → uid.
 *
 * @param {string} slug — slug normalizado
 * @returns {Promise<UserProfile | null>}
 */
export async function getPublicUserBySlug(slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return null;
  }

  const uid = await resolveSlugToUid(normalized);

  if (!uid) {
    return null;
  }

  const profile = await getPublicUserById(uid);

  if (!profile || profile.publicSlug !== normalized) {
    return null;
  }

  return profile;
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

  const publicProfilePayload = buildPublicProfilePayload({
    ...userUpdates,
    name: data.name,
  });

  if (normalizedSlug !== oldSlug) {
    await runTransaction(db, async (transaction) => {
      await syncSlugRegistryInTransaction(transaction, userId, normalizedSlug, oldSlug);
      transaction.update(userRef, userUpdates);
      transaction.set(publicProfileRef(userId), publicProfilePayload, { merge: true });
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
      transaction.set(publicProfileRef(userId), publicProfilePayload, { merge: true });
    });
  } else {
    await updateDoc(userRef, userUpdates);
    await setDoc(publicProfileRef(userId), publicProfilePayload, { merge: true });
  }

  return { publicSlug: normalizedSlug };
}
