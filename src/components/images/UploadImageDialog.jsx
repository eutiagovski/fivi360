import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { PanoramaUploadPreview } from "@/components/images/PanoramaUploadPreview";
import { useUploadPreview } from "@/hooks/useUploadPreview";
import { IMAGE_ACCEPT } from "@/utils/imageConstants";
import {
  getDefaultImageTitle,
  getOriginalFileType,
  validateImageFile,
} from "@/utils/imageValidation";
import { trackEvent } from "@/services/analytics/analyticsService";
import { uploadImage } from "@/services/images/imageService";
import {
  assertCanUploadImage,
  isPlanLimitError,
} from "@/services/plans/planService";

function isDocumentFullscreenActive() {
  return Boolean(
    document.fullscreenElement || document.webkitFullscreenElement,
  );
}

/**
 * Modal de prévia 360° e upload de imagem panorâmica.
 *
 * Fluxo: seleção → validação/quota → processar WebP → prévia PanoramaViewer →
 * confirmar → Storage → Firestore.
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
  const confirmLockRef = useRef(false);
  const titleCustomizedRef = useRef(false);
  const [title, setTitle] = useState("");
  const [replaceError, setReplaceError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const preview = useUploadPreview();

  useEffect(() => {
    if (!open || !file || !userId) {
      return;
    }

    titleCustomizedRef.current = false;
    setTitle(getDefaultImageTitle(file.name));
    setReplaceError("");
    setProcessingStep("");
    confirmLockRef.current = false;

    preview.prepareFile(file, {
      beforeProcess: async (nextFile) => {
        try {
          await assertCanUploadImage(userId, nextFile.size);
        } catch (quotaError) {
          if (isPlanLimitError(quotaError)) {
            onPlanLimitReached?.();
          }
          throw quotaError;
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prepara só ao abrir/arquivo inicial
  }, [open, file, userId]);

  const handleOpenChange = (nextOpen) => {
    if (preview.phase === "uploading") {
      return;
    }

    if (!nextOpen && isDocumentFullscreenActive()) {
      return;
    }

    if (!nextOpen) {
      preview.reset();
      setTitle("");
      titleCustomizedRef.current = false;
      setReplaceError("");
      setProcessingStep("");
      confirmLockRef.current = false;
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    if (isDocumentFullscreenActive()) {
      return;
    }
    handleOpenChange(false);
  };

  const handleReplaceFile = (event) => {
    const newFile = event.target.files?.[0];
    event.target.value = "";

    if (!newFile || preview.phase === "uploading") {
      return;
    }

    const validation = validateImageFile(newFile);
    if (!validation.valid) {
      setReplaceError(validation.error ?? "Este formato de arquivo não é compatível.");
      return;
    }

    setReplaceError("");
    if (!titleCustomizedRef.current) {
      setTitle(getDefaultImageTitle(newFile.name));
    }

    preview.prepareFile(newFile, {
      beforeProcess: async (nextFile) => {
        try {
          await assertCanUploadImage(userId, nextFile.size);
        } catch (quotaError) {
          if (isPlanLimitError(quotaError)) {
            onPlanLimitReached?.();
          }
          throw quotaError;
        }
      },
    });
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
    titleCustomizedRef.current = true;
  };

  const canUpload = projectId !== undefined;
  const isUploading = preview.phase === "uploading";
  const previewValid =
    preview.phase === "preview_ready" &&
    Boolean(preview.previewUrl) &&
    Boolean(preview.processedBlob) &&
    Boolean(preview.imageMeta) &&
    preview.viewerReady &&
    !preview.viewerError;

  const canConfirm =
    Boolean(title.trim()) &&
    Boolean(userId) &&
    canUpload &&
    previewValid &&
    !isUploading;

  const handleConfirm = async () => {
    if (
      !canConfirm ||
      !preview.file ||
      !preview.processedBlob ||
      !preview.imageMeta ||
      confirmLockRef.current
    ) {
      return;
    }

    confirmLockRef.current = true;
    preview.markUploading();
    setProcessingStep("Enviando para o servidor...");

    try {
      const uploadedImage = await uploadImage(
        userId,
        projectId,
        preview.file,
        title.trim(),
        {
          width: preview.imageMeta.width,
          height: preview.imageMeta.height,
          originalFileType: getOriginalFileType(preview.file),
          processedBlob: preview.processedBlob,
          onProgress: setProcessingStep,
        },
      );

      trackEvent("upload_image", {
        source: projectId ? "project" : "gallery",
        has_project: Boolean(projectId),
      });

      onUploadComplete(uploadedImage);
      preview.reset();
      setTitle("");
      titleCustomizedRef.current = false;
      setReplaceError("");
      setProcessingStep("");
      confirmLockRef.current = false;
      onOpenChange(false);
    } catch (uploadError) {
      confirmLockRef.current = false;

      if (isPlanLimitError(uploadError)) {
        onPlanLimitReached?.();
      }

      preview.setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.",
      );
      preview.markPreviewReady();
      setProcessingStep("");
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Visualizar antes de enviar"
      description="Explore a imagem em 360° e confirme se ela está posicionada corretamente antes de enviar."
      size="xl"
      testId="upload-image-dialog"
      dismissLocked={isUploading}
      bodyClassName="space-y-4 min-w-0"
      contentProps={{
        onEscapeKeyDown: (event) => {
          if (isDocumentFullscreenActive()) {
            event.preventDefault();
          }
        },
      }}
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUploading}
            data-testid="upload-image-cancel-btn"
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            disabled={isUploading || preview.phase === "processing" || preview.phase === "validating"}
            data-testid="upload-image-replace-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <ImagePlus size={16} />
            Escolher outra imagem
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            data-testid="upload-image-save-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? "Enviando..." : "Confirmar upload"}
          </button>
        </>
      }
    >
      <input
        ref={replaceInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={handleReplaceFile}
        data-testid="upload-image-replace-input"
      />

      <PanoramaUploadPreview
        previewUrl={preview.previewUrl}
        phase={preview.phase}
        imageMeta={preview.imageMeta}
        showQualityWarning={preview.showQualityWarning}
        showAspectWarning={preview.showAspectWarning}
        viewerError={preview.viewerError}
        viewerReady={preview.viewerReady}
        onViewerReady={preview.handleViewerReady}
        onViewerError={preview.handleViewerError}
        testIdPrefix="upload-image"
      />

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
          disabled={isUploading || preview.phase === "processing" || preview.phase === "validating"}
          data-testid="upload-image-title"
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
          placeholder="Ex.: Sala de estar"
        />
      </div>

      {isUploading && processingStep ? (
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
      ) : null}

      {replaceError ? (
        <p
          className="text-sm text-red-400"
          data-testid="upload-image-replace-error"
        >
          {replaceError}
        </p>
      ) : null}

      {preview.error ? (
        <p className="text-sm text-red-400 break-words" data-testid="upload-image-error">
          {preview.error}
        </p>
      ) : null}
    </AppModal>
  );
};
