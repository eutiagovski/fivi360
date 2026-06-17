/**
 * Serviço de perfil de usuário.
 *
 * Dados privados: `users/{uid}`
 * Dados públicos: `publicProfiles/{uid}`
 * Resolução de slug: `slugs/{slug}`
 *
 * @see docs/architecture.md
 * @see docs/firebase-foundation.md
 * @see docs/public-profile-model.md
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
import {
  checkSlugAvailability,
  resolveSlugToUid,
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
import { computePortfolioAvailable } from "@/utils/portfolio";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";
import { LEGAL_VERSIONS } from "@/config/legal";
import {
  buildSocialLinksPayload,
  mapToPublicUser,
  mapUserDoc,
} from "@/services/users/userMappers";

export { SlugTakenError, SlugValidationError };

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isFirestorePermissionDenied(error) {
  return (
    error != null
    && typeof error === "object"
    && "code" in error
    && error.code === "permission-denied"
  );
}

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
 * @property {boolean} portfolioAvailable — persistido em `publicProfiles/{uid}`
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
  const publicProfileRef = doc(db, "publicProfiles", userId);

  /** @type {Record<string, unknown>} */
  const userPayload = {
    displayName,
    email,
    plan: "starter",
    billing: { ...DEFAULT_BILLING },
    welcomeEmailQueuedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (acceptedSource) {
    userPayload.legalConsent = buildLegalConsent(acceptedSource);
  }

  const publicProfilePayload = {
    uid: userId,
    slug: "",
    portfolioEnabled: false,
    portfolioAvailable: false,
    displayName,
    companyName: "",
    companyLogo: "",
    bio: "",
    socialLinks: buildSocialLinksPayload(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userPayload);
  await setDoc(publicProfileRef, publicProfilePayload);

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
 * Carrega o perfil completo do usuário autenticado (users + publicProfiles).
 *
 * @param {string} userId
 * @returns {Promise<UserProfile | null>}
 */
export async function getUser(userId) {
  const userRef = doc(db, "users", userId);
  const publicProfileRef = doc(db, "publicProfiles", userId);

  const [userSnapshot, publicProfileSnapshot] = await Promise.all([
    getDoc(userRef),
    getDoc(publicProfileRef),
  ]);

  if (!userSnapshot.exists()) {
    return null;
  }

  return mapUserDoc(
    userId,
    userSnapshot.data(),
    publicProfileSnapshot.exists() ? publicProfileSnapshot.data() : null,
  );
}

/**
 * Perfil público por uid — lê apenas `publicProfiles/{uid}`.
 *
 * @param {string} userId
 * @returns {Promise<PublicUserProfile | null>}
 */
export async function getPublicUserById(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "publicProfiles", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapToPublicUser(userId, snapshot.data());
}

/**
 * Perfil público via slug (/u/:slug) — slugs/{slug} → publicProfiles/{uid}.
 *
 * @param {string} slug — slug normalizado ou bruto
 * @returns {Promise<PublicUserProfile | null>}
 */
export async function getPublicUserBySlug(slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized || !isValidSlugFormat(normalized)) {
    return null;
  }

  const userId = await resolveSlugToUid(normalized);

  if (!userId) {
    return null;
  }

  let snapshot;

  try {
    snapshot = await getDoc(doc(db, "publicProfiles", userId));
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      return mapToPublicUser(userId, {
        slug: normalized,
        portfolioEnabled: false,
        portfolioAvailable: false,
      });
    }

    throw error;
  }

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.slug !== normalized) {
    return null;
  }

  return mapToPublicUser(userId, data);
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
  const publicProfileRef = doc(db, "publicProfiles", userId);
  const userSnapshot = await getDoc(userRef);
  const plan = userSnapshot.data()?.plan ?? "starter";
  const portfolioAvailable = computePortfolioAvailable(data.portfolioEnabled, plan);

  const userUpdates = {
    displayName: data.displayName,
    updatedAt: serverTimestamp(),
  };

  const publicProfileUpdates = {
    uid: userId,
    displayName: data.displayName,
    companyName: data.companyName ?? "",
    bio: data.bio ?? "",
    slug: normalizedSlug,
    portfolioEnabled: data.portfolioEnabled,
    portfolioAvailable,
    socialLinks: buildSocialLinksPayload(data.socialLinks),
    updatedAt: serverTimestamp(),
  };

  const persistSettings = async (
    /** @type {import("firebase/firestore").Transaction} */ transaction,
  ) => {
    transaction.update(userRef, userUpdates);
    transaction.set(publicProfileRef, publicProfileUpdates, { merge: true });
  };

  if (normalizedSlug !== oldSlug) {
    await runTransaction(db, async (transaction) => {
      await syncSlugRegistryInTransaction(transaction, userId, normalizedSlug, oldSlug);
      await persistSettings(transaction);
    });
  } else if (normalizedSlug) {
    await runTransaction(db, async (transaction) => {
      const slugRef = doc(db, "slugs", normalizedSlug);
      const slugSnap = await transaction.get(slugRef);

      if (!slugSnap.exists()) {
        transaction.set(slugRef, {
          uid: userId,
          type: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (slugSnap.data().uid !== userId) {
        throw new SlugTakenError();
      }

      await persistSettings(transaction);
    });
  } else {
    await runTransaction(db, async (transaction) => {
      await persistSettings(transaction);
    });
  }

  return { publicSlug: normalizedSlug };
}
