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
  updateDoc,
  writeBatch,
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
import { buildMarketingPreferencesPayload } from "@/services/users/marketingPreferences";
import {
  buildSocialLinksPayload,
  mapToPublicUser,
  mapUserDoc,
} from "@/services/users/userMappers";
import { syncPublicPortfolioAvailability } from "@/services/users/syncPublicPortfolioAvailability";
import {
  buildPersonalWorkspaceMemberPayload,
  buildPersonalWorkspacePayload,
  getPersonalWorkspaceRefs,
} from "@/services/workspaces/workspaceService";

export { SlugTakenError, SlugValidationError };
export {
  DEFAULT_MARKETING_PREFERENCES,
  MARKETING_CONSENT_VERSION,
  buildMarketingPreferencesFlags,
  buildMarketingPreferencesPayload,
  mapMarketingPreferences,
  resolveMarketingPreferences,
} from "@/services/users/marketingPreferences";

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
 * @property {string} defaultWorkspaceId
 * @property {string} activeWorkspaceId
 * @property {import("@/services/users/marketingPreferences").MarketingPreferencesApp} marketingPreferences
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
 * @typedef {Object} CreateUserProfileResult
 * @property {true} profileCreated
 * @property {boolean} verificationEmailQueued
 * @property {string} [verificationEmailId]
 * @property {"verification-email-queue-failed"} [errorCode]
 * @property {unknown} [error]
 */

/**
 * Cria o documento do usuário no Firestore após cadastro no Firebase Auth.
 *
 * Quando `enqueueVerifyEmail` é true, falhas na fila NÃO são engolidas como
 * sucesso silencioso: o retorno estrutura `verificationEmailQueued: false`
 * com `errorCode`. Auth/users/workspace não são revertidos.
 *
 * O e-mail em `data.email` deve ser o canônico do Firebase Auth
 * (`userCredential.user.email`). A fila usa `auth.currentUser.email`.
 *
 * @param {string} userId
 * @param {{
 *   displayName: string,
 *   email: string,
 *   acceptedSource?: "signup" | "modal_existing_user",
 *   marketingConsent?: boolean,
 *   marketingConsentSource?: string,
 *   enqueueVerifyEmail?: boolean,
 * }} data
 * @returns {Promise<CreateUserProfileResult>}
 */
export async function createUserProfile(
  userId,
  {
    displayName,
    email,
    acceptedSource,
    marketingConsent = false,
    marketingConsentSource = "signup",
    enqueueVerifyEmail: shouldEnqueueVerifyEmail = false,
  },
) {
  const userRef = doc(db, "users", userId);
  const publicProfileRef = doc(db, "publicProfiles", userId);
  const { workspaceId, workspaceRef, memberRef } = getPersonalWorkspaceRefs(userId);

  /** @type {Record<string, unknown>} */
  const userPayload = {
    displayName,
    email,
    plan: "starter",
    billing: { ...DEFAULT_BILLING },
    defaultWorkspaceId: workspaceId,
    activeWorkspaceId: workspaceId,
    welcomeEmailQueuedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const marketingTs = serverTimestamp();
  userPayload.marketingPreferences = buildMarketingPreferencesPayload({
    enabled: marketingConsent === true,
    consentSource: marketingConsentSource,
    timestamp: marketingTs,
  });

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

  const batch = writeBatch(db);
  batch.set(userRef, userPayload);
  batch.set(publicProfileRef, publicProfilePayload);
  batch.set(workspaceRef, buildPersonalWorkspacePayload(userId, displayName));
  batch.set(memberRef, buildPersonalWorkspaceMemberPayload(userId));

  try {
    await batch.commit();
  } catch (error) {
    const code =
      error != null && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    const message =
      error != null && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);

    console.error("[FIVI360] createUserProfile batch failed:", {
      stage: "createUserProfile.batch",
      userId,
      code,
      message,
      stack: error?.stack,
      writes: ["users", "publicProfiles", "workspaces", "workspaces/members"],
    });

    throw error;
  }

  if (!shouldEnqueueVerifyEmail) {
    return {
      profileCreated: true,
      verificationEmailQueued: false,
    };
  }

  try {
    const emailId = await enqueueVerifyEmail({
      to: email,
      userId,
      name: displayName,
    });

    return {
      profileCreated: true,
      verificationEmailQueued: true,
      verificationEmailId: emailId,
    };
  } catch (err) {
    console.error("[FIVI360] Failed to enqueue verify email:", {
      stage: "createUserProfile.enqueueVerifyEmail",
      userId,
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
    });

    return {
      profileCreated: true,
      verificationEmailQueued: false,
      errorCode: "verification-email-queue-failed",
      error: err,
    };
  }
}

/**
 * Enfileira welcome para sessão autenticada quando elegível (idempotente).
 *
 * @param {ReturnType<import("@/services/auth/authService").mapFirebaseUser>} authUser
 * @returns {Promise<boolean>}
 */
export async function maybeEnqueueWelcomeEmailForAuthUser(authUser) {
  if (!authUser?.uid || !authUser.email) {
    return false;
  }

  if (!authUser.emailVerified && !authUser.usesGoogleAuth) {
    return false;
  }

  const profile = await getUserFirestoreData(authUser.uid);

  return maybeEnqueueWelcomeEmail({
    userId: authUser.uid,
    to: authUser.email,
    name: profile?.displayName ?? authUser.displayName ?? "",
    companyName: typeof profile?.companyName === "string" ? profile.companyName : "",
  });
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
 * Opcionalmente persiste `marketingPreferences` (ex.: modal Google).
 *
 * @param {string} userId
 * @param {"signup" | "modal_existing_user"} acceptedSource
 * @param {{
 *   marketingConsent?: boolean,
 *   marketingConsentSource?: string,
 * }} [options]
 */
export async function saveLegalConsent(userId, acceptedSource, options = {}) {
  const userRef = doc(db, "users", userId);
  const marketingTs = serverTimestamp();

  /** @type {Record<string, unknown>} */
  const updates = {
    legalConsent: buildLegalConsent(acceptedSource),
    updatedAt: serverTimestamp(),
  };

  if (typeof options.marketingConsent === "boolean") {
    updates.marketingPreferences = buildMarketingPreferencesPayload({
      enabled: options.marketingConsent === true,
      consentSource: options.marketingConsentSource ?? "google_terms_modal",
      timestamp: marketingTs,
    });
  }

  await updateDoc(userRef, updates);
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
  const oldSlug = normalizeSlug(previousSlug ?? "");

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

  // RC-P0.5: cliente nunca promove portfolioAvailable=true.
  // Demote para false é permitido pelas rules; promote via Admin SDK (callable).
  /** @type {Record<string, unknown>} */
  const publicProfileUpdates = {
    uid: userId,
    displayName: data.displayName,
    companyName: data.companyName ?? "",
    bio: data.bio ?? "",
    slug: normalizedSlug,
    portfolioEnabled: data.portfolioEnabled,
    socialLinks: buildSocialLinksPayload(data.socialLinks),
    updatedAt: serverTimestamp(),
  };

  if (portfolioAvailable === false) {
    publicProfileUpdates.portfolioAvailable = false;
  }

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

  if (portfolioAvailable === true) {
    try {
      await syncPublicPortfolioAvailability();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FIVI360] Failed to sync portfolioAvailable:", err);
      }
    }
  }

  return { publicSlug: normalizedSlug };
}
