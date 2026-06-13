/**
 * Serviço de perfil de usuário.
 *
 * Fonte única da verdade: `users/{uid}`
 *
 * @see docs/architecture.md
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
import { LEGAL_VERSIONS } from "@/config/legal";
import {
  checkSlugAvailability,
  SlugTakenError,
  SlugValidationError,
  syncSlugRegistryInTransaction,
} from "@/services/slugs/slugService";
import { DEFAULT_BILLING } from "@/config/billing";
import {
  enqueueVerifyEmail,
  enqueueWelcomeEmail,
} from "@/services/email/emailQueueService";
import { assertPublicPortfolioEnabled } from "@/services/plans/planService";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";
import {
  buildSocialLinksPayload,
  mapToPublicUser,
  mapUserDoc,
} from "@/services/users/userMappers";

export { SlugTakenError, SlugValidationError };

/**
 * @typedef {Object} SocialLinks
 * @property {string} website
 * @property {string} instagram
 * @property {string} youtube
 * @property {string} linkedin
 * @property {string} whatsapp
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} displayName
 * @property {string} email
 * @property {string} companyName
 * @property {string} companyLogo
 * @property {string} bio
 * @property {import("@/config/planLimits").UserPlanRaw} plan
 * @property {import("@/config/planLimits").PlanId} planId — plano efetivo (limites/UI)
 * @property {string} publicSlug
 * @property {boolean} portfolioEnabled
 * @property {SocialLinks} socialLinks
 * @property {import("@/config/billing").UserBilling} billing
 */

/**
 * @typedef {Object} PublicUserProfile
 * @property {string} id
 * @property {string} displayName
 * @property {string} companyName
 * @property {string} companyLogo
 * @property {string} bio
 * @property {string} publicSlug
 * @property {boolean} portfolioEnabled
 * @property {boolean} portfolioAvailable — `portfolioEnabled` + limites do plano efetivo
 * @property {SocialLinks} socialLinks
 */

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
 * Cria o documento do usuário no Firestore após cadastro no Firebase Auth.
 *
 * @param {string} userId
 * @param {{ displayName: string, email: string, acceptedSource?: "signup" | "modal_existing_user" }} data
 */
export async function createUserProfile(userId, { displayName, email, acceptedSource }) {
  const userRef = doc(db, "users", userId);

  const payload = {
    displayName,
    email,
    companyName: "",
    companyLogo: "",
    bio: "",
    socialLinks: buildSocialLinksPayload(),
    plan: "starter",
    publicSlug: "",
    portfolioEnabled: false,
    billing: { ...DEFAULT_BILLING },
    welcomeEmailQueuedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (acceptedSource) {
    payload.legalConsent = buildLegalConsent(acceptedSource);
  }

  await setDoc(userRef, payload);

  if (acceptedSource === "signup") {
    try {
      await enqueueVerifyEmail({ to: email, userId, name: displayName });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FIVI360] Failed to enqueue verify email:", err);
      }
    }
  }
}

/**
 * Enfileira o e-mail de boas-vindas no máximo uma vez por usuário.
 *
 * Usa transação no Firestore para evitar duplicidade (ex.: clique duplo no link de verificação).
 *
 * @param {{
 *   userId: string,
 *   to: string,
 *   name?: string,
 *   companyName?: string,
 * }} params
 * @returns {Promise<boolean>} true se enfileirou nesta chamada
 */
export async function maybeEnqueueWelcomeEmail({
  userId,
  to,
  name = "",
  companyName = "",
}) {
  if (!userId || !to) {
    return false;
  }

  const userRef = doc(db, "users", userId);

  const claimed = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    if (snapshot.data().welcomeEmailQueuedAt) {
      return false;
    }

    transaction.update(userRef, {
      welcomeEmailQueuedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return true;
  });

  if (!claimed) {
    return false;
  }

  try {
    await enqueueWelcomeEmail({ to, userId, name, companyName });
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[FIVI360] Failed to enqueue welcome email:", err);
    }
    return false;
  }
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
 * Carrega o documento do usuário no Firestore (sessão autenticada).
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
 * Perfil público por uid — retorna DTO sem campos privados.
 *
 * @param {string} userId
 * @returns {Promise<PublicUserProfile | null>}
 */
export async function getPublicUserById(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapToPublicUser(userId, snapshot.data());
}

/**
 * Perfil público via slug (/u/:slug) — query users where publicSlug == slug.
 *
 * @param {string} slug — slug normalizado ou bruto
 * @returns {Promise<PublicUserProfile | null>}
 */
export async function getPublicUserBySlug(slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized || !isValidSlugFormat(normalized)) {
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
  const data = userDoc.data();

  if (data.publicSlug !== normalized) {
    return null;
  }

  return mapToPublicUser(userDoc.id, data);
}

/**
 * Atualiza campos do perfil do usuário no Firestore.
 *
 * @param {string} userId
 * @param {Partial<Omit<UserProfile, "id">> & Record<string, unknown>} data
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
 *   displayName: string,
 *   companyName: string,
 *   bio: string,
 *   publicSlug: string,
 *   portfolioEnabled: boolean,
 *   socialLinks: SocialLinks,
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
    displayName: data.displayName,
    companyName: data.companyName ?? "",
    bio: data.bio ?? "",
    publicSlug: normalizedSlug,
    portfolioEnabled: data.portfolioEnabled,
    socialLinks: buildSocialLinksPayload(data.socialLinks),
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
