import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { IMAGE_ACCEPT, LOW_QUALITY_WARNING_MESSAGE } from "@/utils/imageConstants";
import {
  formatFileSize,
  getImageFormat,
  getOriginalFileType,
  isBelowRecommendedResolution,
  loadImagePreview,
  validateImageFile,
} from "@/utils/imageValidation";
import {
  replaceImageFile,
  updateImageTitle,
} from "@/services/images/imageService";

function formatStoredFileType(fileType) {
  if (!fileType) {
    return "—";
  }

  const part = fileType.includes("/") ? fileType.split("/")[1] : fileType;
  return part ? part.toUpperCase() : "—";
}

/**
 * Modal completo de edição de imagem panorâmica: nome e substituição de arquivo.
 */
export const EditImageDialog = ({
  open,
  onOpenChange,
  imageId,
  userId,
  projectId,
  initialTitle = "",
  currentPreviewUrl = "",
  currentWidth = 0,
  currentHeight = 0,
  currentSizeBytes = 0,
  currentFileType = "",
  projectCoverImage = "",
  openFilePickerOnOpen = false,
  enableFileReplace = true,
  onEditComplete,
}) => {
  const fileInputRef = useRef(null);
  const filePickerOpenedRef = useRef(false);
  const [title, setTitle] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState("");
  const [imageMeta, setImageMeta] = useState(null);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const initialTitleTrimmed = initialTitle.trim();

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setNewFile(null);
      setNewPreviewUrl("");
      setImageMeta(null);
      setShowQualityWarning(false);
      setError("");
      setFileError("");
      setIsProcessing(false);
      setProcessingStep("");
      setIsLoadingPreview(false);
      filePickerOpenedRef.current = false;
    }
  }, [open, initialTitle]);

  useEffect(() => {
    if (
      !open ||
      !openFilePickerOnOpen ||
      !enableFileReplace ||
      filePickerOpenedRef.current
    ) {
      return;
    }

    filePickerOpenedRef.current = true;
    const timer = window.setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, openFilePickerOnOpen, enableFileReplace]);

  useEffect(() => {
    if (!open || !newFile) {
      return;
    }

    let cancelled = false;
    let objectUrl = "";

    async function preparePreview() {
      setIsLoadingPreview(true);
      setFileError("");
      setShowQualityWarning(false);
      setImageMeta(null);

      setNewPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return "";
      });

      try {
        const preview = await loadImagePreview(newFile);
        if (cancelled) {
          URL.revokeObjectURL(preview.previewUrl);
          return;
        }

        objectUrl = preview.previewUrl;
        setNewPreviewUrl(preview.previewUrl);
        setImageMeta({
          format: getImageFormat(newFile),
          sizeBytes: newFile.size,
          width: preview.width,
          height: preview.height,
        });
        setShowQualityWarning(
          isBelowRecommendedResolution(preview.width, preview.height),
        );
      } catch (previewError) {
        if (!cancelled) {
          setFileError(
            previewError instanceof Error
              ? previewError.message
              : "Não foi possível carregar a pré-visualização.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    }

    preparePreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, newFile]);

  const resetState = () => {
    if (newPreviewUrl) {
      URL.revokeObjectURL(newPreviewUrl);
    }
    setNewFile(null);
    setNewPreviewUrl("");
    setImageMeta(null);
    setShowQualityWarning(false);
    setIsProcessing(false);
    setProcessingStep("");
    setError("");
    setFileError("");
    setIsLoadingPreview(false);
  };

  const handleDialogOpenChange = (nextOpen) => {
    if (isProcessing) {
      return;
    }

    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleReplaceFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? "Formato não suportado.");
      return;
    }

    setFileError("");
    setError("");
    setNewFile(file);
  };

  const titleChanged = title.trim() !== initialTitleTrimmed;
  const hasNewFile = Boolean(newFile && imageMeta && newPreviewUrl);
  const hasChanges = titleChanged || hasNewFile;
  const displayPreviewUrl = hasNewFile ? newPreviewUrl : currentPreviewUrl;

  const handleSave = async () => {
    const trimmed = title.trim();

    if (!trimmed) {
      setError("Informe um nome para a imagem.");
      return;
    }

    if (!imageId || !userId || !hasChanges) {
      return;
    }

    if (hasNewFile && (!imageMeta || isLoadingPreview || fileError)) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      if (hasNewFile) {
        if (projectId === undefined) {
          throw new Error("Contexto da imagem não informado.");
        }

        const { image, coverImage } = await replaceImageFile(
          userId,
          projectId,
          imageId,
          newFile,
          projectCoverImage,
          {
            width: imageMeta.width,
            height: imageMeta.height,
            originalFileType: getOriginalFileType(newFile),
            title: titleChanged ? trimmed : undefined,
            onProgress: setProcessingStep,
          },
        );

        onEditComplete?.({
          title: trimmed,
          image,
          coverImage,
        });
      } else {
        await updateImageTitle(imageId, userId, trimmed);
        onEditComplete?.({ title: trimmed });
      }

      resetState();
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar as alterações.",
      );
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const canSave =
    Boolean(title.trim()) &&
    hasChanges &&
    !isProcessing &&
    !isLoadingPreview &&
    !(newFile && !hasNewFile);

  const existingMeta = {
    format: formatStoredFileType(currentFileType),
    sizeBytes: currentSizeBytes,
    width: currentWidth,
    height: currentHeight,
  };

  const showExistingMeta =
    !hasNewFile &&
    (existingMeta.format !== "—" ||
      existingMeta.sizeBytes > 0 ||
      (existingMeta.width > 0 && existingMeta.height > 0));

  const displayMeta = hasNewFile && imageMeta ? imageMeta : showExistingMeta ? existingMeta : null;

  return (
    <AppModal
      open={open}
      onOpenChange={handleDialogOpenChange}
      title="Editar imagem"
      size="lg"
      testId="edit-image-dialog"
      dismissLocked={isProcessing}
      bodyClassName="space-y-4 min-w-0"
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            data-testid="edit-image-cancel-btn"
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            data-testid="edit-image-save-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {isProcessing ? "Salvando..." : "Salvar alterações"}
          </button>
        </>
      }
    >
          <div className="space-y-2 min-w-0">
            <div className="relative w-full h-48 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-zinc-400" />
                </div>
              ) : displayPreviewUrl ? (
                <img
                  src={displayPreviewUrl}
                  alt={
                    hasNewFile
                      ? "Pré-visualização da nova imagem"
                      : "Pré-visualização da imagem atual"
                  }
                  className="w-full h-full object-cover"
                  data-testid="edit-image-preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                  Pré-visualização indisponível
                </div>
              )}
            </div>

            {enableFileReplace && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handleReplaceFile}
                  data-testid="edit-image-file-input"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || isLoadingPreview}
                  data-testid="edit-image-replace-btn"
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Substituir arquivo
                </button>
              </>
            )}

            {fileError && (
              <p
                className="text-sm text-red-400 break-words"
                data-testid="edit-image-file-error"
              >
                {fileError}
              </p>
            )}
          </div>

          {displayMeta && !isLoadingPreview && (
            <dl
              className="grid grid-cols-3 gap-3 text-xs min-w-0"
              data-testid={
                hasNewFile ? "edit-image-new-meta" : "edit-image-meta"
              }
            >
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Formato</dt>
                <dd className="text-zinc-300 break-words">{displayMeta.format}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Tamanho</dt>
                <dd className="text-zinc-300">
                  {displayMeta.sizeBytes > 0
                    ? formatFileSize(displayMeta.sizeBytes)
                    : "—"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Resolução</dt>
                <dd className="text-zinc-300">
                  {displayMeta.width > 0 && displayMeta.height > 0
                    ? `${displayMeta.width} × ${displayMeta.height}`
                    : "—"}
                </dd>
              </div>
            </dl>
          )}

          <div>
            <label
              htmlFor="edit-image-title"
              className="block text-xs text-zinc-500 mb-1"
            >
              Nome da imagem
            </label>
            <input
              id="edit-image-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              data-testid="edit-image-title-input"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 break-words"
              placeholder="Ex.: Sala de estar"
            />
          </div>

          {showQualityWarning && hasNewFile && (
            <div
              className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              data-testid="edit-image-quality-warning"
            >
              <AlertTriangle
                size={18}
                className="text-amber-400 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-200/90">
                {LOW_QUALITY_WARNING_MESSAGE}
              </p>
            </div>
          )}

          {isProcessing && processingStep && (
            <div
              className="flex items-center gap-3 p-3 bg-zinc-800/80 border border-zinc-700 rounded-xl"
              data-testid="edit-image-processing"
            >
              <Loader2 size={18} className="animate-spin text-zinc-300" />
              <p
                className="text-sm text-zinc-300"
                data-testid="edit-image-processing-step"
              >
                {processingStep}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 break-words" data-testid="edit-image-error">
              {error}
            </p>
          )}
    </AppModal>
  );
};
