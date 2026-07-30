/**
 * Reparo idempotente da estrutura mínima do usuário autenticado.
 *
 * Cliente (owner-readable):
 * - users/{uid}
 * - publicProfiles/{uid}
 *
 * Callable Admin SDK (membership-gated reads):
 * - workspaces/{uid}
 * - workspaces/{uid}/members/{uid}
 * - users.defaultWorkspaceId / activeWorkspaceId
 *
 * Fallback cliente (sem overwrite): cria workspace/member apenas quando a leitura
 * confirmou ausência (não quando permission-denied).
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { DEFAULT_BILLING } from "@/config/billing";
import { buildMarketingPreferencesPayload } from "@/services/users/marketingPreferences";
import { buildSocialLinksPayload } from "@/services/users/userMappers";
import { repairUserWorkspaceFields } from "@/services/users/repairUserWorkspaceFields";
import { analyzeUserStructureGaps } from "@/utils/userStructure";
import {
  buildPersonalWorkspaceMemberPayload,
  buildPersonalWorkspacePayload,
  getPersonalWorkspaceRefs,
} from "@/services/workspaces/workspaceService";

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isPermissionDenied(error) {
  return (
    error != null
    && typeof error === "object"
    && "code" in error
    && error.code === "permission-denied"
  );
}

/**
 * @param {import("firebase/firestore").DocumentReference} ref
 * @returns {Promise<{ exists: boolean, data: Record<string, unknown> | null, denied: boolean }>}
 */
async function readDocSafe(ref) {
  try {
    const snapshot = await getDoc(ref);

    return {
      exists: snapshot.exists(),
      data: snapshot.exists() ? /** @type {Record<string, unknown>} */ (snapshot.data()) : null,
      denied: false,
    };
  } catch (error) {
    if (isPermissionDenied(error)) {
      return { exists: false, data: null, denied: true };
    }

    throw error;
  }
}

/**
 * @param {string} userId
 * @returns {Promise<({ id: string } & import("firebase/firestore").DocumentData) | null>}
 */
async function readUserDoc(userId) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return { id: userId, ...snapshot.data() };
}

/**
 * @param {string} userId
 * @param {string} displayName
 * @param {{ needsWorkspace: boolean, needsMember: boolean }} flags
 * @returns {Promise<string[]>}
 */
async function attemptClientWorkspaceBootstrap(userId, displayName, flags) {
  if (!flags.needsWorkspace && !flags.needsMember) {
    return [];
  }

  const { workspaceRef, memberRef } = getPersonalWorkspaceRefs(userId);
  const batch = writeBatch(db);
  /** @type {string[]} */
  const repaired = [];

  if (flags.needsWorkspace) {
    batch.set(workspaceRef, buildPersonalWorkspacePayload(userId, displayName));
    repaired.push("workspaces");
  }

  if (flags.needsMember) {
    batch.set(memberRef, buildPersonalWorkspaceMemberPayload(userId));
    repaired.push("workspaces/members");
  }

  await batch.commit();
  return repaired;
}

/**
 * @param {string} userId
 * @param {{
 *   displayName?: string,
 *   email?: string,
 *   skipServerWorkspaceRepair?: boolean,
 *   marketingConsentSource?: string,
 * }} [options]
 * @returns {Promise<{
 *   profile: Awaited<ReturnType<typeof readUserDoc>>,
 *   gaps: ReturnType<typeof analyzeUserStructureGaps>,
 *   repaired: string[],
 * }>}
 */
export async function ensureUserStructure(
  userId,
  {
    displayName = "",
    email = "",
    skipServerWorkspaceRepair = false,
    marketingConsentSource = "google_signup_default",
  } = {},
) {
  if (!userId) {
    throw new Error("ensureUserStructure: userId é obrigatório.");
  }

  const userRef = doc(db, "users", userId);
  const publicProfileRef = doc(db, "publicProfiles", userId);
  const { workspaceId, workspaceRef, memberRef } = getPersonalWorkspaceRefs(userId);

  const [userRead, publicRead, workspaceRead, memberRead] = await Promise.all([
    readDocSafe(userRef),
    readDocSafe(publicProfileRef),
    readDocSafe(workspaceRef),
    readDocSafe(memberRef),
  ]);

  const gaps = analyzeUserStructureGaps({
    userId,
    userExists: userRead.exists,
    userData: userRead.data,
    publicProfileExists: publicRead.exists,
    // permission-denied ⇒ tratar como ausente para acionar reparo server-side
    workspaceExists: workspaceRead.exists,
    memberExists: memberRead.exists,
  });

  if (workspaceRead.denied) {
    gaps.needsWorkspace = true;
  }

  if (memberRead.denied) {
    gaps.needsMember = true;
  }

  const resolvedDisplayName =
    (typeof displayName === "string" && displayName.trim())
    || (typeof userRead.data?.displayName === "string" ? userRead.data.displayName : "")
    || (typeof publicRead.data?.displayName === "string" ? publicRead.data.displayName : "")
    || "";

  const resolvedEmail =
    (typeof email === "string" && email.trim())
    || (typeof userRead.data?.email === "string" ? userRead.data.email : "")
    || "";

  const batch = writeBatch(db);
  /** @type {string[]} */
  const repaired = [];

  if (gaps.needsUser) {
    const marketingTs = serverTimestamp();
    batch.set(userRef, {
      displayName: resolvedDisplayName,
      email: resolvedEmail,
      plan: "starter",
      billing: { ...DEFAULT_BILLING },
      defaultWorkspaceId: workspaceId,
      activeWorkspaceId: workspaceId,
      welcomeEmailQueuedAt: null,
      // Sem formulário de marketing neste fluxo (ex.: Google) — nunca presume consentimento.
      marketingPreferences: buildMarketingPreferencesPayload({
        enabled: false,
        consentSource: marketingConsentSource,
        timestamp: marketingTs,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    repaired.push("users");
  }

  if (gaps.needsPublicProfile) {
    batch.set(publicProfileRef, {
      uid: userId,
      slug: "",
      portfolioEnabled: false,
      portfolioAvailable: false,
      displayName: resolvedDisplayName,
      companyName: "",
      companyLogo: "",
      bio: "",
      socialLinks: buildSocialLinksPayload(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    repaired.push("publicProfiles");
  }

  if (repaired.length > 0) {
    await batch.commit();
  }

  const needsServerWorkspaceRepair =
    gaps.needsWorkspace
    || gaps.needsMember
    || gaps.needsServerWorkspaceIdRepair;

  if (needsServerWorkspaceRepair && !skipServerWorkspaceRepair) {
    try {
      const serverResult = await repairUserWorkspaceFields();

      if (serverResult.fields?.length) {
        repaired.push(...serverResult.fields);
      } else if (serverResult.repaired) {
        repaired.push("workspaces", "workspaces/members", "users.workspaceIds");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[FIVI360] repairUserWorkspaceFields failed; attempting safe client fallback:",
          error,
        );
      }

      // Sem overwrite: só cria quando a leitura confirmou ausência (não denied).
      const fallbackRepaired = await attemptClientWorkspaceBootstrap(
        userId,
        resolvedDisplayName,
        {
          needsWorkspace: gaps.needsWorkspace && !workspaceRead.denied,
          needsMember: gaps.needsMember && !memberRead.denied,
        },
      );

      repaired.push(...fallbackRepaired);
    }
  }

  const profile = await readUserDoc(userId);

  return {
    profile,
    gaps,
    repaired: [...new Set(repaired)],
  };
}
