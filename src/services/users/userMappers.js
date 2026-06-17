import { normalizeBilling } from "@/config/billing";
import { normalizeUserPlan } from "@/config/planLimits";
import { getPersonalWorkspaceId } from "@/utils/workspace";

export const EMPTY_SOCIAL_LINKS = Object.freeze({
  website: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  whatsapp: "",
});

/**
 * @param {import("firebase/firestore").DocumentData | null | undefined} raw
 * @returns {{ website: string, instagram: string, youtube: string, linkedin: string, whatsapp: string }}
 */
export function normalizeSocialLinks(raw) {
  const source = raw?.socialLinks ?? {};

  return {
    website: source.website ?? "",
    instagram: source.instagram ?? "",
    youtube: source.youtube ?? "",
    linkedin: source.linkedin ?? "",
    whatsapp: source.whatsapp ?? "",
  };
}

/**
 * Enriquece billing com dados Stripe persistidos em `users.plan` e `users.billing.stripe`.
 *
 * @param {import("@/config/billing").UserBilling} billing
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {import("@/config/billing").UserBilling}
 */
function enrichBillingFromUserDoc(billing, data) {
  const result = { ...billing };
  const rawBilling = data.billing;

  if (rawBilling && typeof rawBilling === "object") {
    const stripeBilling = rawBilling.stripe;

    if (typeof rawBilling.provider === "string" && rawBilling.provider) {
      result.provider = rawBilling.provider;
    }

    if (stripeBilling && typeof stripeBilling === "object") {
      if (typeof stripeBilling.customerId === "string") {
        result.customerId = stripeBilling.customerId;
      }

      if (typeof stripeBilling.subscriptionId === "string") {
        result.subscriptionId = stripeBilling.subscriptionId;
      }
    }
  }

  const plan = data.plan;
  if (plan && typeof plan === "object") {
    if (plan.source === "stripe") {
      result.provider = "stripe";
    }

    if (typeof plan.status === "string") {
      result.subscriptionStatus = plan.status;
    }

    if (typeof plan.id === "string") {
      result.planId = plan.id;
    }

    if ("cancelAtPeriodEnd" in plan) {
      result.cancelAtPeriodEnd = Boolean(plan.cancelAtPeriodEnd);
    }
  }

  return result;
}

/**
 * Perfil completo para o usuário autenticado (privado + público mesclados).
 *
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} userData — `users/{uid}`
 * @param {import("firebase/firestore").DocumentData | null | undefined} publicProfileData — `publicProfiles/{uid}`
 * @returns {import("./userService").UserProfile}
 */
export function mapUserDoc(userId, userData, publicProfileData = null) {
  const publicData = publicProfileData ?? {};

  return {
    id: userId,
    displayName: publicData.displayName ?? userData.displayName ?? userData.name ?? "",
    email: userData.email ?? "",
    companyName: publicData.companyName ?? "",
    companyLogo: publicData.companyLogo ?? "",
    bio: publicData.bio ?? "",
    plan: userData.plan ?? "starter",
    planId: normalizeUserPlan(userData.plan),
    publicSlug: publicData.slug ?? "",
    portfolioEnabled: publicData.portfolioEnabled ?? false,
    socialLinks: normalizeSocialLinks(publicData),
    billing: enrichBillingFromUserDoc(normalizeBilling(userData.billing), userData),
    defaultWorkspaceId: userData.defaultWorkspaceId ?? getPersonalWorkspaceId(userId),
    activeWorkspaceId:
      userData.activeWorkspaceId
      ?? userData.defaultWorkspaceId
      ?? getPersonalWorkspaceId(userId),
  };
}

/**
 * DTO público a partir de `publicProfiles/{uid}` — nunca inclui email, plan, billing ou legalConsent.
 *
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {import("./userService").PublicUserProfile}
 */
export function mapToPublicUser(userId, data) {
  return {
    id: userId,
    displayName: data.displayName ?? data.name ?? "",
    companyName: data.companyName ?? "",
    companyLogo: data.companyLogo ?? "",
    bio: data.bio ?? "",
    publicSlug: data.slug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    portfolioAvailable: data.portfolioAvailable === true,
    socialLinks: normalizeSocialLinks(data),
  };
}

/**
 * @param {{
 *   website?: string,
 *   instagram?: string,
 *   youtube?: string,
 *   linkedin?: string,
 *   whatsapp?: string,
 * }} links
 * @returns {{ website: string, instagram: string, youtube: string, linkedin: string, whatsapp: string }}
 */
export function buildSocialLinksPayload(links = {}) {
  return {
    website: links.website ?? "",
    instagram: links.instagram ?? "",
    youtube: links.youtube ?? "",
    linkedin: links.linkedin ?? "",
    whatsapp: links.whatsapp ?? "",
  };
}
