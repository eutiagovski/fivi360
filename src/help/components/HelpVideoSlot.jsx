/**
 * Área de vídeo do artigo.
 * videoUrl vazio: não renderiza player nem placeholder.
 * Com URL: reserva o espaço no topo, sem integrar YouTube nesta RC.
 *
 * @param {{ videoUrl?: string | null }} props
 */
export function HelpVideoSlot({ videoUrl }) {
  const url = typeof videoUrl === "string" ? videoUrl.trim() : "";

  if (!url) {
    return null;
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
      data-testid="help-article-video"
    >
      <div className="flex aspect-video items-center justify-center px-6 text-center">
        <p className="text-sm text-zinc-500">
          Vídeo tutorial reservado. O player será habilitado em uma próxima atualização.
        </p>
      </div>
    </div>
  );
}
