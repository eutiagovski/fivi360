import { useMemo } from "react";
import {
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
} from "lucide-react";
import { resolveSocialLinkHref } from "@/utils/socialLinks";

const SOCIAL_LINKS = [
  { key: "website", icon: Globe, label: "Site" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
];

/**
 * @param {{ user: { socialLinks?: Record<string, string> }, testIdPrefix?: string }} props
 */
export function PublicSocialLinks({ user, testIdPrefix = "public-social" }) {
  const links = useMemo(() => {
    const socialLinks = user?.socialLinks ?? {};

    return SOCIAL_LINKS.filter(({ key }) => {
      const url = socialLinks[key]?.trim();
      return Boolean(url);
    }).map(({ key, icon: Icon, label }) => ({
      url: resolveSocialLinkHref(key, socialLinks[key]),
      Icon,
      label,
      key,
    }));
  }, [user]);

  if (links.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 mt-6"
      data-testid={`${testIdPrefix}-links`}
    >
      {links.map(({ key, url, Icon, label }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          data-testid={`${testIdPrefix}-${key}`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <Icon size={18} strokeWidth={1.5} />
        </a>
      ))}
    </div>
  );
}
