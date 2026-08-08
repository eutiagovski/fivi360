import { Play } from "lucide-react";
import { ACCESS_EARLY_CONFIG } from "../config";
import { ACCESS_EARLY_CONTENT } from "../content";

/**
 * Seção de vídeo — placeholder elegante quando videoUrl está vazio.
 *
 * @param {{ videoUrl?: string }} [props]
 */
export function AccessEarlyVideo({ videoUrl: videoUrlProp } = {}) {
  const videoUrl =
    (videoUrlProp ?? ACCESS_EARLY_CONFIG.videoUrl)?.trim() ?? "";
  const { title, subtitle, placeholder } = ACCESS_EARLY_CONTENT.video;

  return (
    <section
      id="video"
      className="py-16 md:py-20 bg-zinc-950/60 border-y border-zinc-900"
      data-testid="access-early-video-section"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-10 space-y-3">
          <h2
            className="text-2xl md:text-3xl font-light tracking-tight text-white"
            data-testid="access-early-video-title"
          >
            {title}
          </h2>
          <p className="text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>

        {videoUrl ? (
          <div
            className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black"
            data-testid="access-early-video"
          >
            <iframe
              title="Vídeo de apresentação do FIVI360"
              src={videoUrl}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div
            className="aspect-video w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center justify-center gap-4 px-6"
            data-testid="access-early-video-placeholder"
          >
            <div className="rounded-full border border-zinc-700 bg-zinc-900 p-4">
              <Play className="h-7 w-7 text-zinc-400" strokeWidth={1.25} />
            </div>
            <p className="text-sm text-zinc-500 text-center">{placeholder}</p>
          </div>
        )}
      </div>
    </section>
  );
}
