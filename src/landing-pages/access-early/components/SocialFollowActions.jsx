import { Instagram, Youtube } from "lucide-react";
import { ACCESS_EARLY_CONFIG } from "../config";

/**
 * Handlers isolados para instrumentação futura de analytics.
 * Não atualizam prelaunchLeads.
 */
export function handleInstagramClick() {
  // Preparado para: trackEvent("prelaunch_instagram_click")
}

export function handleYoutubeClick() {
  // Preparado para: trackEvent("prelaunch_youtube_click")
}

export function handleWhatsappClick() {
  // Preparado para: trackEvent("prelaunch_whatsapp_group_click")
}

/**
 * @param {{
 *   instagramUrl?: string,
 *   youtubeUrl?: string,
 *   whatsappGroupUrl?: string,
 * }} [props]
 */
export function SocialFollowActions({
  instagramUrl = ACCESS_EARLY_CONFIG.instagramUrl,
  youtubeUrl = ACCESS_EARLY_CONFIG.youtubeUrl,
  whatsappGroupUrl = ACCESS_EARLY_CONFIG.whatsappGroupUrl,
} = {}) {
  const instagram = (instagramUrl ?? "").trim();
  const youtube = (youtubeUrl ?? "").trim();
  const whatsapp = (whatsappGroupUrl ?? "").trim();

  return (
    <div
      className="w-full space-y-6"
      data-testid="access-early-social-actions"
    >
      <p
        className="text-sm text-zinc-400 text-center"
        data-testid="access-early-social-title"
      >
        Acompanhe nossas redes sociais:
      </p>

      <div
        className="flex items-center justify-center gap-4"
        data-testid="access-early-social-icons"
      >
        <SocialIconLink
          href={instagram}
          label="Instagram"
          onClick={handleInstagramClick}
          testId="access-early-instagram-cta"
          icon={Instagram}
        />
        <SocialIconLink
          href={youtube}
          label="YouTube"
          onClick={handleYoutubeClick}
          testId="access-early-youtube-cta"
          icon={Youtube}
        />
      </div>

      <div className="space-y-2">
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsappClick}
            className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 font-medium text-sm bg-white text-black hover:bg-zinc-200 transition-colors"
            data-testid="access-early-whatsapp-cta"
            data-enabled="true"
          >
            Entrar no grupo do WhatsApp
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 font-medium text-sm border border-zinc-800 bg-zinc-900/50 text-zinc-500 cursor-not-allowed"
              data-testid="access-early-whatsapp-cta"
              data-enabled="false"
              aria-disabled="true"
            >
              Entrar no grupo do WhatsApp
            </button>
            <p
              className="text-xs text-zinc-500 text-center"
              data-testid="access-early-whatsapp-soon"
            >
              Grupo de pré-lançamento em breve.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   href: string,
 *   label: string,
 *   onClick: () => void,
 *   testId: string,
 *   icon: import("lucide-react").LucideIcon,
 * }} props
 */
function SocialIconLink({ href, label, onClick, testId, icon: Icon }) {
  const enabled = Boolean(href);
  const className =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 text-white transition-colors";

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className={`${className} opacity-40 cursor-not-allowed`}
        data-testid={testId}
        data-enabled="false"
        aria-label={label}
        aria-disabled="true"
        title={`${label} em breve`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`${className} hover:bg-zinc-900 hover:border-zinc-500`}
      data-testid={testId}
      data-enabled="true"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </a>
  );
}
