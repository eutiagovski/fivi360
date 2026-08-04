import { getMarketingArchitectsUrl } from "@/utils/embed";

/**
 * Marca discreta obrigatória no Viewer Embed.
 */
export function EmbedPoweredByBrand() {
  const href = getMarketingArchitectsUrl();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by FIVI360 — abrir site"
      data-testid="embed-powered-by"
      className="absolute bottom-3 left-1/2 z-[5] -translate-x-1/2 pointer-events-auto rounded-full bg-black/55 px-3 py-1.5 text-[11px] leading-none tracking-wide text-zinc-300 backdrop-blur-md hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
      style={{
        marginBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      Powered by <span className="text-zinc-100">FIVI360</span>
    </a>
  );
}
