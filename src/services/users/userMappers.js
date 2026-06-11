import { normalizeBilling } from "@/config/billing";

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
    publicSlug: data.publicSlug ?? "",
    portfolioEnabled: data.portfolioEnabled ?? false,
    socialLinks: normalizeSocialLinks(data),
    billing: normalizeBilling(data.billing),
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
