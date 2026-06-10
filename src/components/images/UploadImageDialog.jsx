import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2 } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { IMAGE_ACCEPT, LOW_QUALITY_WARNING_MESSAGE } from "@/utils/imageConstants";
import {
  formatFileSize,
  getDefaultImageTitle,
  getImageFormat,
  getOriginalFileType,
  isBelowRecommendedResolution,
  loadImagePreview,
  validateImageFile,
} from "@/utils/imageValidation";
import { uploadImage } from "@/services/images/imageService";
import { isPlanLimitError } from "@/services/plans/planService";

/**
 * Modal de preview e upload de imagem panorâmica.
 *
 * Fluxo: preview → nome → salvar → conversão WEBP → Storage → Firestore.
 */
export const UploadImageDialog = ({
  open,
  onOpenChange,
  file,
  userId,
  projectId,
  onUploadComplete,
  onPlanLimitReached,
}) => {
  const replaceInputRef = useRef(null);
  const titleCustomizedRef = useRef(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [imageMeta, setImageMeta] = useState(null);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [error, setError] = useState("");
  const [replaceError, setReplaceError] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (open && file) {
      setCurrentFile(file);
      titleCustomizedRef.current = false;
    }
  }, [open, file]);

  useEffect(() => {
    if (!open || !currentFile) {
      return;
    }

    let cancelled = false;
    let objectUrl = "";

    async function preparePreview() {
      setIsLoadingPreview(true);
      setError("");
      setReplaceError("");
      setShowQualityWarning(false);
      setImageMeta(null);

      setPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return "";
      });

      if (!titleCustomizedRef.current) {
        setTitle(getDefaultImageTitle(currentFile.name));
      }

      try {
        const preview = await loadImagePreview(currentFile);
        if (cancelled) {
          URL.revokeObjectURL(preview.previewUrl);
          return;
        }

        objectUrl = preview.previewUrl;
        setPreviewUrl(preview.previewUrl);
        setImageMeta({
          format: getImageFormat(currentFile),
          sizeBytes: currentFile.size,
          width: preview.width,
          height: preview.height,
        });
        setShowQualityWarning(
          isBelowRecommendedResolution(preview.width, preview.height),
        );
      } catch (previewError) {
        if (!cancelled) {
          setError(
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
  }, [open, currentFile]);

  const resetState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCurrentFile(null);
    setPreviewUrl("");
    setTitle("");
    titleCustomizedRef.current = false;
    setImageMeta(null);
    setShowQualityWarning(false);
    setIsProcessing(false);
    setProcessingStep("");
    setError("");
    setReplaceError("");
    setIsLoadingPreview(false);
  };

  const handleOpenChange = (nextOpen) => {
    if (isProcessing) {
      return;
    }

    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const handleReplaceFile = (event) => {
    const newFile = event.target.files?.[0];
    event.target.value = "";

    if (!newFile) {
      return;
    }

    const validation = validateImageFile(newFile);
    if (!validation.valid) {
      setReplaceError(validation.error ?? "Formato não suportado.");
      return;
    }

    setReplaceError("");
    setError("");
    setCurrentFile(newFile);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
    titleCustomizedRef.current = true;
  };

  const canUpload = projectId !== undefined;

  const handleSave = async () => {
    if (!currentFile || !userId || !canUpload || !title.trim() || !imageMeta) {
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Preparando imagem...");
    setError("");

    try {
      const uploadedImage = await uploadImage(
        userId,
        projectId,
        currentFile,
        title.trim(),
        {
          width: imageMeta.width,
          height: imageMeta.height,
          originalFileType: getOriginalFileType(currentFile),
          onProgress: setProcessingStep,
        },
      );
      onUploadComplete(uploadedImage);
      resetState();
      onOpenChange(false);
    } catch (uploadError) {
      if (isPlanLimitError(uploadError)) {
        onPlanLimitReached?.();
      }

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.",
      );
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const canSave =
    Boolean(title.trim()) &&
    Boolean(previewUrl) &&
    Boolean(imageMeta) &&
    !isProcessing &&
    !isLoadingPreview &&
    !error;

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova imagem"
      size="lg"
      testId="upload-image-dialog"
      dismissLocked={isProcessing}
      bodyClassName="space-y-4 min-w-0"
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            data-testid="upload-image-cancel-btn"
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            data-testid="upload-image-save-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {isProcessing ? "Processando..." : "Salvar"}
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
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                  data-testid="upload-image-preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                  Pré-visualização indisponível
                </div>
              )}
            </div>

            <input
              ref={replaceInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={handleReplaceFile}
              data-testid="upload-image-replace-input"
            />

            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              disabled={isProcessing || isLoadingPreview}
              data-testid="upload-image-replace-btn"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <ImagePlus size={16} />
              Trocar imagem
            </button>

            {replaceError && (
              <p
                className="text-sm text-red-400"
                data-testid="upload-image-replace-error"
              >
                {replaceError}
              </p>
            )}
          </div>

          {imageMeta && !isLoadingPreview && (
            <dl
              className="grid grid-cols-3 gap-3 text-xs min-w-0"
              data-testid="upload-image-meta"
            >
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Formato</dt>
                <dd className="text-zinc-300">{imageMeta.format}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Tamanho</dt>
                <dd className="text-zinc-300">
                  {formatFileSize(imageMeta.sizeBytes)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Resolução</dt>
                <dd className="text-zinc-300">
                  {imageMeta.width} × {imageMeta.height}
                </dd>
              </div>
            </dl>
          )}

          <div>
            <label
              htmlFor="image-title"
              className="block text-xs text-zinc-500 mb-1"
            >
              Nome da imagem
            </label>
            <input
              id="image-title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={isProcessing || isLoadingPreview}
              data-testid="upload-image-title"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
              placeholder="Ex.: Sala de estar"
            />
          </div>

          {showQualityWarning && (
            <div
              className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              data-testid="upload-image-quality-warning"
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
              data-testid="upload-image-processing"
            >
              <Loader2 size={18} className="animate-spin text-zinc-300" />
              <p
                className="text-sm text-zinc-300"
                data-testid="upload-image-processing-step"
              >
                {processingStep}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 break-words" data-testid="upload-image-error">
              {error}
            </p>
          )}
    </AppModal>
  );
};
