import { useMemo } from "react";
import {
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
} from "lucide-react";

const SOCIAL_LINKS = [
  { key: "websiteUrl", icon: Globe, label: "Site" },
  { key: "instagramUrl", icon: Instagram, label: "Instagram" },
  { key: "youtubeUrl", icon: Youtube, label: "YouTube" },
  { key: "linkedinUrl", icon: Linkedin, label: "LinkedIn" },
  { key: "whatsappUrl", icon: MessageCircle, label: "WhatsApp" },
];

/**
 * @param {{ user: Record<string, string>, testIdPrefix?: string }} props
 */
export function PublicSocialLinks({ user, testIdPrefix = "public-social" }) {
  const links = useMemo(
    () =>
      SOCIAL_LINKS.filter(({ key }) => {
        const url = user[key]?.trim();
        return Boolean(url);
      }).map(({ key, icon: Icon, label }) => ({
        url: user[key].trim(),
        Icon,
        label,
        key,
      })),
    [user],
  );

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
