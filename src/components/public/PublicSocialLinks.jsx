import { useMemo } from "react";
import {
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSocialLinkHref } from "@/utils/socialLinks";

const SOCIAL_LINKS = [
  { key: "website", icon: Globe, label: "Website" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
];

/**
 * @param {{
 *   user: { socialLinks?: Record<string, string> },
 *   testIdPrefix?: string,
 *   variant?: "default" | "portfolio",
 * }} props
 */
export function PublicSocialLinks({
  user,
  testIdPrefix = "public-social",
  variant = "default",
}) {
  const isPortfolio = variant === "portfolio";

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
      className={cn(
        "flex flex-wrap gap-4",
        isPortfolio && "justify-center",
      )}
      data-testid={`${testIdPrefix}-links`}
    >
      {links.map(({ key, url, Icon, label }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`${testIdPrefix}-${key}`}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 border border-zinc-800 bg-zinc-900/40 text-sm transition-colors hover:border-zinc-600 hover:text-white",
            isPortfolio
              ? "min-h-10 rounded-lg px-4 py-2.5 text-zinc-300"
              : "rounded-full px-3.5 py-2 text-zinc-400",
          )}
        >
          <Icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          <span className="text-sm leading-none">{label}</span>
        </a>
      ))}
    </div>
  );
}
