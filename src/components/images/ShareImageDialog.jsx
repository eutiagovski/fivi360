import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { toast } from "@/hooks/use-toast";
import { updateImageVisibility } from "@/services/images/imageService";
import { buildShareImageUrl } from "@/utils/publicAccess";
import { getImageVisibilityOptions } from "@/utils/visibility";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   image: import("@/services/images/imageService").Image | null,
 *   userId: string | undefined,
 *   onVisibilitySaved?: (visibility: string) => void | Promise<void>,
 * }} props
 */
export function ShareImageDialog({
  open,
  onOpenChange,
  image,
  userId,
  onVisibilitySaved,
}) {
  const [visibility, setVisibility] = useState("private");
  const [isSaving, setIsSaving] = useState(false);
  const imageVisibilityOptions = getImageVisibilityOptions();

  useEffect(() => {
    if (image && open) {
      const savedVisibility = image.visibility ?? "private";
      setVisibility(savedVisibility === "public" ? "shared" : savedVisibility);
    }
  }, [image, open]);

  if (!image) {
    return null;
  }

  const savedVisibility =
    image.visibility === "public" ? "shared" : (image.visibility ?? "private");
  const shareUrl = buildShareImageUrl(image);
  const selectedOption = imageVisibilityOptions.find(
    (o) => o.value === visibility,
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "O link de compartilhamento foi copiado.",
      });
    } catch {
      toast({
        title: "Link de compartilhamento",
        description: shareUrl,
      });
    }
  };

  const handleSaveVisibility = async () => {
    if (!userId || visibility === savedVisibility) {
      return;
    }

    setIsSaving(true);

    try {
      await updateImageVisibility(image.id, userId, visibility);
      await onVisibilitySaved?.(visibility);
      toast({
        title: "Visibilidade atualizada",
        description: selectedOption?.description ?? "",
      });
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a visibilidade.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Compartilhar imagem"
      description={`Defina quem pode ver "${image.title || "Sem título"}" e copie o link de compartilhamento.`}
      size="md"
      testId="share-image-dialog"
      bodyClassName="space-y-5 min-w-0"
    >
      <div>
        <p className="text-xs text-zinc-500 mb-2">Visibilidade</p>
        <div className="grid grid-cols-1 gap-2">
          {imageVisibilityOptions.map((option) => (
            <label
              key={option.value}
              className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                visibility === option.value
                  ? "bg-white text-black border-white"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="share-image-visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={() => {
                  setVisibility(option.value);
                }}
                className="sr-only"
                data-testid={`share-image-visibility-${option.value}`}
              />
              <span className="text-sm font-medium">{option.label}</span>
              <span
                className={`text-xs mt-0.5 ${
                  visibility === option.value
                    ? "text-zinc-600"
                    : "text-zinc-500"
                }`}
              >
                {option.description}
              </span>
            </label>
          ))}
        </div>
        {visibility !== savedVisibility && (
          <button
            type="button"
            onClick={handleSaveVisibility}
            disabled={isSaving}
            data-testid="share-image-save-visibility"
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Salvar visibilidade
          </button>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-zinc-500 mb-2">Link da imagem</p>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            readOnly
            value={shareUrl}
            data-testid="share-image-url"
            className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            data-testid="share-image-copy-link"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors shrink-0"
          >
            <Copy size={16} />
            Copiar link
          </button>
        </div>
        {visibility === "private" && (
          <p className="text-xs text-zinc-500 mt-2">
            Com visibilidade privada, o link não funcionará para visitantes.
          </p>
        )}
      </div>
    </AppModal>
  );
}
