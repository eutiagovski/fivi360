import { normalizeBilling } from "@/config/billing";
import { normalizeUserPlan } from "@/config/planLimits";
import { isPortfolioPubliclyAvailableFromUserData } from "@/utils/portfolio";

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
  const source = raw?.socialLinks ?? raw ?? {};

  return {
    website: source.website ?? source.websiteUrl ?? "",
    instagram: source.instagram ?? source.instagramUrl ?? "",
    youtube: source.youtube ?? source.youtubeUrl ?? "",
    linkedin: source.linkedin ?? source.linkedinUrl ?? "",
    whatsapp: source.whatsapp ?? source.whatsappUrl ?? "",
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
 * Perfil completo para o usuário autenticado (inclui campos privados).
 *
 * @param {string} userId
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {import("./userService").UserProfile}
 */
export function mapUserDoc(userId, data) {
  return {
    id: userId,
    displayName: data.displayName ?? data.name ?? "",
    email: data.email ?? "",
    companyName: data.companyName ?? "",
    companyLogo: data.companyLogo ?? "",
    bio: data.bio ?? data.companyBio ?? "",
    plan: data.plan ?? "starter",
    planId: normalizeUserPlan(data.plan),
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    socialLinks: normalizeSocialLinks(data),
    billing: enrichBillingFromUserDoc(normalizeBilling(data.billing), data),
  };
}

/**
 * DTO público — nunca inclui email, plan, billing ou legalConsent.
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
    bio: data.bio ?? data.companyBio ?? "",
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    portfolioAvailable: isPortfolioPubliclyAvailableFromUserData(data),
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
