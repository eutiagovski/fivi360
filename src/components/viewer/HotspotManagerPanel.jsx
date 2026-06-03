import { useEffect, useState } from "react";
import {
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HOTSPOT_TYPE_SCENE } from "@/services/hotspots/hotspotService";

const PANEL_BUTTON =
  "flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50";
const PANEL_BUTTON_PRIMARY =
  "bg-white text-black border-white hover:bg-zinc-200";
const PANEL_BUTTON_SECONDARY =
  "bg-black/60 backdrop-blur-xl border-white/10 text-white hover:bg-black/80";

/**
 * @param {import("@/services/hotspots/hotspotService").Hotspot} hotspot
 * @param {Map<string, string>} imageTitleById
 */
function getHotspotListLabel(hotspot, imageTitleById) {
  if (hotspot.type === HOTSPOT_TYPE_SCENE) {
    const destination =
      imageTitleById.get(hotspot.targetImageId) || "Imagem removida";
    return `Navegação → ${destination}`;
  }

  return hotspot.title || "Sem título";
}

/**
 * @param {import("@/services/hotspots/hotspotService").Hotspot | null} hotspot
 * @param {Map<string, string>} imageTitleById
 */
function getDeleteDescription(hotspot, imageTitleById) {
  if (!hotspot) {
    return "Este hotspot será removido permanentemente.";
  }

  const label = getHotspotListLabel(hotspot, imageTitleById);
  return `“${label}” será removido permanentemente desta imagem.`;
}

/**
 * Painel lateral para listar, editar e excluir hotspots da imagem atual.
 */
export function HotspotManagerPanel({
  hotspots,
  loading,
  placingMode,
  projectImages = [],
  onStartPlacing,
  onCancelPlacing,
  onEditHotspot,
  onDeleteHotspot,
  deleteTarget,
  onConfirmDelete,
  onCancelDelete,
  isDeleting,
}) {
  const [listExpanded, setListExpanded] = useState(true);

  const imageTitleById = new Map(
    projectImages.map((img) => [img.id, img.title || "Sem título"]),
  );

  const hotspotCount = hotspots.length;

  useEffect(() => {
    if (placingMode) {
      setListExpanded(false);
    }
  }, [placingMode]);

  const handleStartPlacing = () => {
    setListExpanded(false);
    onStartPlacing?.();
  };

  return (
    <>
      <aside
        className={cn(
          "absolute top-4 right-4 z-40 flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/70 backdrop-blur-xl",
          listExpanded && "max-h-[calc(100%-2rem)]",
        )}
        data-testid="hotspot-manager-panel"
      >
        <div className="p-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <MapPin size={16} className="shrink-0" aria-hidden />
            <span>Hotspots ({hotspotCount})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {placingMode
              ? "Clique no panorama para posicionar o hotspot."
              : "Gerencie marcadores informativos e de navegação nesta imagem."}
          </p>
        </div>

        <div className="p-3 border-b border-white/10 shrink-0">
          {placingMode ? (
            <button
              type="button"
              onClick={onCancelPlacing}
              className={`${PANEL_BUTTON} ${PANEL_BUTTON_SECONDARY} w-full`}
              data-testid="hotspot-cancel-placing"
            >
              Cancelar posicionamento
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartPlacing}
              className={`${PANEL_BUTTON} ${PANEL_BUTTON_PRIMARY} w-full`}
              data-testid="hotspot-add-btn"
            >
              <Plus size={16} />
              Adicionar hotspot
            </button>
          )}
          <button
            type="button"
            onClick={() => setListExpanded((prev) => !prev)}
            className="mt-2 w-full py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-expanded={listExpanded}
            data-testid="hotspot-list-toggle"
          >
            {listExpanded ? "Recolher lista" : "Expandir lista"}
          </button>
        </div>

        {listExpanded && (
        <div
          className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
          data-testid="hotspot-list-body"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          ) : hotspots.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              Nenhum hotspot nesta imagem.
            </p>
          ) : (
            hotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl"
                data-testid={`hotspot-list-item-${hotspot.id}`}
              >
                <div className="flex items-start gap-2">
                  {hotspot.type === HOTSPOT_TYPE_SCENE && (
                    <Navigation
                      size={14}
                      className="text-sky-300 flex-shrink-0 mt-0.5"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {getHotspotListLabel(hotspot, imageTitleById)}
                    </p>
                    {hotspot.type !== HOTSPOT_TYPE_SCENE && hotspot.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {hotspot.description}
                      </p>
                    )}
                    {hotspot.type === HOTSPOT_TYPE_SCENE && (
                      <p className="text-xs text-zinc-500 mt-1">Navegação</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onEditHotspot?.(hotspot)}
                    className={`${PANEL_BUTTON} ${PANEL_BUTTON_SECONDARY} flex-1 py-1.5 text-xs`}
                    data-testid={`hotspot-edit-${hotspot.id}`}
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHotspot?.(hotspot)}
                    className={`${PANEL_BUTTON} ${PANEL_BUTTON_SECONDARY} flex-1 py-1.5 text-xs text-red-300 hover:text-red-200`}
                    data-testid={`hotspot-delete-${hotspot.id}`}
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </aside>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            onCancelDelete?.();
          }
        }}
      >
        <AlertDialogContent
          className="bg-zinc-900 border-zinc-800 text-white"
          data-testid="hotspot-delete-dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Excluir hotspot?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {getDeleteDescription(deleteTarget, imageTitleById)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              data-testid="hotspot-delete-cancel"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                onConfirmDelete?.();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="hotspot-delete-confirm"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
