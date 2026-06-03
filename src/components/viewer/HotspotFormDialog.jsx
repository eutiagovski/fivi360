import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HOTSPOT_TYPE_INFO,
  HOTSPOT_TYPE_SCENE,
} from "@/services/hotspots/hotspotService";

/** Select de destino: texto longo quebra sem overflow horizontal. */
const SCENE_DESTINATION_SELECT_TRIGGER =
  "w-full min-w-0 h-auto min-h-10 whitespace-normal gap-2 py-2.5 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left [&>svg]:shrink-0";

const SCENE_DESTINATION_SELECT_CONTENT =
  "bg-zinc-900 border-zinc-700 text-white w-[var(--radix-select-trigger-width)] max-w-[min(var(--radix-select-trigger-width),calc(100vw-2rem))]";

const SCENE_DESTINATION_SELECT_ITEM =
  "items-start py-2.5";

const SCENE_DESTINATION_OPTION_LABEL =
  "block min-w-0 whitespace-normal break-words leading-snug pr-1";

/**
 * Modal para criar ou editar hotspot (informação ou navegação entre cenas).
 */
export function HotspotFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialType = HOTSPOT_TYPE_INFO,
  initialTitle = "",
  initialDescription = "",
  initialTargetImageId = "",
  currentImageId = "",
  projectImages = [],
  isSaving = false,
  error = "",
  onSubmit,
}) {
  const [hotspotType, setHotspotType] = useState(HOTSPOT_TYPE_INFO);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetImageId, setTargetImageId] = useState("");

  const destinationOptions = useMemo(
    () =>
      projectImages.filter((img) => img.id && img.id !== currentImageId),
    [projectImages, currentImageId],
  );

  const isScene = hotspotType === HOTSPOT_TYPE_SCENE;
  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {
      setHotspotType(initialType === HOTSPOT_TYPE_SCENE ? HOTSPOT_TYPE_SCENE : HOTSPOT_TYPE_INFO);
      setTitle(initialTitle);
      setDescription(initialDescription);
      setTargetImageId(initialTargetImageId);
    }
  }, [
    open,
    initialType,
    initialTitle,
    initialDescription,
    initialTargetImageId,
  ]);

  const handleOpenChange = (nextOpen) => {
    if (isSaving) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isScene) {
      onSubmit?.({
        type: HOTSPOT_TYPE_SCENE,
        targetImageId,
      });
      return;
    }

    onSubmit?.({
      type: HOTSPOT_TYPE_INFO,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const canSave = isScene
    ? Boolean(targetImageId)
    : Boolean(title.trim());

  const dialogTitle = isEdit
    ? isScene
      ? "Editar hotspot de navegação"
      : "Editar hotspot informativo"
    : "Novo hotspot";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-hidden p-4 sm:p-6 sm:max-w-md"
        data-testid="hotspot-form-dialog"
        onPointerDownOutside={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="pr-8 text-white font-medium tracking-tight break-words">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto py-2">
            {!isEdit && (
              <div className="min-w-0 w-full">
                <label
                  htmlFor="hotspot-type"
                  className="block text-xs text-zinc-500 mb-1"
                >
                  Tipo
                </label>
                <Select
                  value={hotspotType}
                  onValueChange={setHotspotType}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="hotspot-type"
                    data-testid="hotspot-type-select"
                    className="w-full min-w-0 bg-zinc-900 border-zinc-700 text-white rounded-xl h-10"
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value={HOTSPOT_TYPE_INFO}>Informação</SelectItem>
                    <SelectItem value={HOTSPOT_TYPE_SCENE}>Navegação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isScene ? (
              <div className="min-w-0 w-full">
                <label
                  htmlFor="hotspot-target-image"
                  className="block text-xs text-zinc-500 mb-1"
                >
                  Imagem de destino
                </label>
                {destinationOptions.length === 0 ? (
                  <p className="text-sm text-zinc-400 break-words">
                    Adicione outra imagem ao projeto para criar navegação entre
                    cenas.
                  </p>
                ) : (
                  <Select
                    value={targetImageId}
                    onValueChange={setTargetImageId}
                    disabled={isSaving}
                  >
                    <SelectTrigger
                      id="hotspot-target-image"
                      data-testid="hotspot-target-image-select"
                      className={cn(
                        "bg-zinc-900 border-zinc-700 text-white rounded-xl",
                        SCENE_DESTINATION_SELECT_TRIGGER,
                      )}
                    >
                      <SelectValue placeholder="Selecione a imagem de destino" />
                    </SelectTrigger>
                    <SelectContent className={SCENE_DESTINATION_SELECT_CONTENT}>
                      {destinationOptions.map((img) => (
                        <SelectItem
                          key={img.id}
                          value={img.id}
                          className={SCENE_DESTINATION_SELECT_ITEM}
                        >
                          <span className={SCENE_DESTINATION_OPTION_LABEL}>
                            {img.title || "Sem título"}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="hotspot-title"
                    className="block text-xs text-zinc-500 mb-1"
                  >
                    Título
                  </label>
                  <input
                    id="hotspot-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSaving}
                    data-testid="hotspot-title-input"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                    placeholder="Ex.: Janela principal"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="hotspot-description"
                    className="block text-xs text-zinc-500 mb-1"
                  >
                    Descrição
                  </label>
                  <textarea
                    id="hotspot-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    rows={4}
                    data-testid="hotspot-description-input"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 resize-none"
                    placeholder="Informações exibidas ao interagir com o hotspot"
                  />
                </div>
              </>
            )}

            {error && (
              <p
                className="text-sm text-red-400 break-words"
                data-testid="hotspot-form-error"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="shrink-0 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              data-testid="hotspot-form-cancel"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !canSave || (isScene && destinationOptions.length === 0)}
              data-testid="hotspot-form-save"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
