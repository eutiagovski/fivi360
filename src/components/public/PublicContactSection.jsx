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

const SECONDARY_LINKS = [
  { key: "website", icon: Globe, label: "Website" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
];

const CONTACT_KEYS = ["whatsapp", ...SECONDARY_LINKS.map(({ key }) => key)];

/**
 * @param {{
 *   user: { socialLinks?: Record<string, string> } | null | undefined,
 *   testIdPrefix?: string,
 * }} props
 */
export function PublicContactSection({
  user,
  testIdPrefix = "portfolio-contact",
}) {
  const socialLinks = user?.socialLinks ?? {};

  const hasAnyChannel = useMemo(
    () => CONTACT_KEYS.some((key) => socialLinks[key]?.trim()),
    [socialLinks],
  );

  const whatsappUrl = useMemo(() => {
    const url = socialLinks.whatsapp?.trim();
    return url ? resolveSocialLinkHref("whatsapp", url) : null;
  }, [socialLinks]);

  const secondaryLinks = useMemo(
    () =>
      SECONDARY_LINKS.filter(({ key }) => socialLinks[key]?.trim()).map(
        ({ key, icon: Icon, label }) => ({
          key,
          url: resolveSocialLinkHref(key, socialLinks[key]),
          Icon,
          label,
        }),
      ),
    [socialLinks],
  );

  if (!hasAnyChannel) {
    return null;
  }

  return (
    <section
      className="mt-16 pt-16 border-t border-zinc-800/60"
      data-testid={`${testIdPrefix}-section`}
      aria-labelledby={`${testIdPrefix}-heading`}
    >
      <div className="max-w-2xl">
        {whatsappUrl ? (
          <>
            <h2
              id={`${testIdPrefix}-heading`}
              className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-3"
              data-testid={`${testIdPrefix}-title`}
            >
              Vamos conversar sobre o seu projeto
            </h2>
            <p
              className="text-base text-zinc-400 leading-relaxed mb-8"
              data-testid={`${testIdPrefix}-description`}
            >
              Entre em contato com o escritório para solicitar um orçamento ou
              conhecer mais detalhes sobre os projetos.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`${testIdPrefix}-whatsapp`}
              className="inline-flex items-center gap-2.5 min-h-12 rounded-lg border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800/80"
            >
              <MessageCircle
                size={18}
                strokeWidth={1.5}
                className="shrink-0"
                aria-hidden="true"
              />
              Conversar pelo WhatsApp
            </a>
          </>
        ) : (
          <h2
            id={`${testIdPrefix}-heading`}
            className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-6"
            data-testid={`${testIdPrefix}-title`}
          >
            Contato
          </h2>
        )}

        {secondaryLinks.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-3",
              whatsappUrl && "mt-8",
            )}
            data-testid={`${testIdPrefix}-secondary-links`}
          >
            {secondaryLinks.map(({ key, url, Icon, label }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`${testIdPrefix}-${key}`}
                className="inline-flex shrink-0 items-center gap-2 min-h-10 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="leading-none">{label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
