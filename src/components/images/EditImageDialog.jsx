import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import { PanoramaUploadPreview } from "@/components/images/PanoramaUploadPreview";
import { useUploadPreview } from "@/hooks/useUploadPreview";
import { IMAGE_ACCEPT } from "@/utils/imageConstants";
import {
  formatFileSize,
  getOriginalFileType,
  validateImageFile,
} from "@/utils/imageValidation";
import {
  replaceImageFile,
  updateImageTitle,
} from "@/services/images/imageService";
import { getHotspotsByImage } from "@/services/hotspots/hotspotService";
import {
  assertCanReplaceImageStorage,
  isPlanLimitError,
} from "@/services/plans/planService";

function formatStoredFileType(fileType) {
  if (!fileType) {
    return "—";
  }

  const part = fileType.includes("/") ? fileType.split("/")[1] : fileType;
  return part ? part.toUpperCase() : "—";
}

function isDocumentFullscreenActive() {
  return Boolean(
    document.fullscreenElement || document.webkitFullscreenElement,
  );
}

/**
 * Modal de edição: nome e substituição com prévia 360° antes de persistir.
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
  onPlanLimitReached,
}) => {
  const fileInputRef = useRef(null);
  const filePickerOpenedRef = useRef(false);
  const confirmLockRef = useRef(false);
  const hotspotsFetchedForImageRef = useRef("");
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [isTitleSaving, setIsTitleSaving] = useState(false);
  const [referenceHotspots, setReferenceHotspots] = useState([]);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [hotspotsLoadError, setHotspotsLoadError] = useState(null);
  const preview = useUploadPreview();

  const initialTitleTrimmed = initialTitle.trim();
  const hasNewFile =
    Boolean(preview.file) &&
    Boolean(preview.processedBlob) &&
    Boolean(preview.previewUrl) &&
    Boolean(preview.imageMeta);

  const isReplaceFlow =
    hasNewFile ||
    preview.phase === "validating" ||
    preview.phase === "processing" ||
    preview.phase === "preview_ready" ||
    preview.phase === "uploading" ||
    (preview.phase === "error" && Boolean(preview.file));

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setFileError("");
      setSaveError("");
      setProcessingStep("");
      setIsTitleSaving(false);
      confirmLockRef.current = false;
      filePickerOpenedRef.current = false;
      hotspotsFetchedForImageRef.current = "";
      setReferenceHotspots([]);
      setHotspotsLoading(false);
      setHotspotsLoadError(null);
      preview.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ao abrir
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

  // Busca hotspots uma vez por abertura do fluxo de substituição; reutiliza ao trocar arquivo.
  useEffect(() => {
    if (!open || !isReplaceFlow || !imageId) {
      return undefined;
    }

    if (hotspotsFetchedForImageRef.current === imageId) {
      return undefined;
    }

    hotspotsFetchedForImageRef.current = imageId;
    let cancelled = false;

    async function loadReferenceHotspots() {
      setHotspotsLoading(true);
      setHotspotsLoadError(null);

      try {
        const data = await getHotspotsByImage(imageId);
        if (cancelled) {
          return;
        }
        setReferenceHotspots(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setReferenceHotspots([]);
        setHotspotsLoadError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar os hotspots.",
        );
      } finally {
        if (!cancelled) {
          setHotspotsLoading(false);
        }
      }
    }

    loadReferenceHotspots();

    return () => {
      cancelled = true;
    };
  }, [open, isReplaceFlow, imageId]);

  const handleDialogOpenChange = (nextOpen) => {
    if (preview.phase === "uploading" || isTitleSaving) {
      return;
    }

    if (!nextOpen && isDocumentFullscreenActive()) {
      return;
    }

    if (!nextOpen) {
      preview.reset();
      setFileError("");
      setSaveError("");
      setProcessingStep("");
      confirmLockRef.current = false;
      hotspotsFetchedForImageRef.current = "";
      setReferenceHotspots([]);
      setHotspotsLoading(false);
      setHotspotsLoadError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleKeepCurrent = () => {
    if (isDocumentFullscreenActive()) {
      return;
    }
    handleDialogOpenChange(false);
  };

  const handleReplaceFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || preview.phase === "uploading") {
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? "Este formato de arquivo não é compatível.");
      return;
    }

    setFileError("");
    setSaveError("");

    preview.prepareFile(file, {
      beforeProcess: async (nextFile) => {
        try {
          await assertCanReplaceImageStorage(
            userId,
            nextFile.size,
            currentSizeBytes,
          );
        } catch (quotaError) {
          if (isPlanLimitError(quotaError)) {
            onPlanLimitReached?.();
          }
          throw quotaError;
        }
      },
    });
  };

  const titleChanged = title.trim() !== initialTitleTrimmed;
  const isUploading = preview.phase === "uploading";
  const isBusy = isUploading || isTitleSaving;

  const previewValid =
    hasNewFile &&
    preview.phase === "preview_ready" &&
    preview.viewerReady &&
    !preview.viewerError;

  const canConfirmReplace =
    Boolean(title.trim()) &&
    Boolean(imageId) &&
    Boolean(userId) &&
    previewValid &&
    !isBusy;

  const canSaveTitleOnly =
    Boolean(title.trim()) &&
    titleChanged &&
    !hasNewFile &&
    preview.phase === "idle" &&
    !isBusy;

  const handleConfirmReplace = async () => {
    if (
      !canConfirmReplace ||
      !preview.file ||
      !preview.processedBlob ||
      !preview.imageMeta ||
      confirmLockRef.current
    ) {
      return;
    }

    if (projectId === undefined) {
      setSaveError("Contexto da imagem não informado.");
      return;
    }

    confirmLockRef.current = true;
    preview.markUploading();
    setSaveError("");
    setProcessingStep("Enviando para o servidor...");

    try {
      const { image, coverImage } = await replaceImageFile(
        userId,
        projectId,
        imageId,
        preview.file,
        projectCoverImage,
        {
          width: preview.imageMeta.width,
          height: preview.imageMeta.height,
          originalFileType: getOriginalFileType(preview.file),
          title: titleChanged ? title.trim() : undefined,
          processedBlob: preview.processedBlob,
          onProgress: setProcessingStep,
        },
      );

      onEditComplete?.({
        title: title.trim(),
        image,
        coverImage,
      });

      preview.reset();
      setFileError("");
      setSaveError("");
      setProcessingStep("");
      confirmLockRef.current = false;
      onOpenChange(false);
    } catch (saveErrorValue) {
      confirmLockRef.current = false;

      if (isPlanLimitError(saveErrorValue)) {
        onPlanLimitReached?.();
      }

      setSaveError(
        saveErrorValue instanceof Error
          ? saveErrorValue.message
          : "Não foi possível salvar as alterações.",
      );
      preview.setError("");
      preview.markPreviewReady();
      setProcessingStep("");
    }
  };

  const handleSaveTitleOnly = async () => {
    const trimmed = title.trim();

    if (!canSaveTitleOnly || !imageId || !userId) {
      return;
    }

    setIsTitleSaving(true);
    setSaveError("");

    try {
      await updateImageTitle(imageId, userId, trimmed);
      onEditComplete?.({ title: trimmed });
      preview.reset();
      onOpenChange(false);
    } catch (saveErrorValue) {
      setSaveError(
        saveErrorValue instanceof Error
          ? saveErrorValue.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setIsTitleSaving(false);
    }
  };

  const existingMeta = {
    format: formatStoredFileType(currentFileType),
    sizeBytes: currentSizeBytes,
    width: currentWidth,
    height: currentHeight,
  };

  const showExistingMeta =
    !hasNewFile &&
    preview.phase === "idle" &&
    (existingMeta.format !== "—" ||
      existingMeta.sizeBytes > 0 ||
      (existingMeta.width > 0 && existingMeta.height > 0));

  const modalTitle = isReplaceFlow
    ? "Visualizar nova imagem"
    : "Editar imagem";
  const modalDescription = isReplaceFlow
    ? "Confira como a nova imagem será exibida antes de substituir a versão atual."
    : undefined;

  return (
    <AppModal
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={modalTitle}
      description={modalDescription}
      size={isReplaceFlow ? "xl" : "lg"}
      testId="edit-image-dialog"
      dismissLocked={isBusy}
      bodyClassName="space-y-4 min-w-0"
      contentProps={{
        onEscapeKeyDown: (event) => {
          if (isDocumentFullscreenActive()) {
            event.preventDefault();
          }
        },
      }}
      footer={
        isReplaceFlow ? (
          <>
            <button
              type="button"
              onClick={handleKeepCurrent}
              disabled={isBusy}
              data-testid="edit-image-cancel-btn"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Manter imagem atual
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                isBusy ||
                preview.phase === "processing" ||
                preview.phase === "validating"
              }
              data-testid="edit-image-replace-btn"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Escolher outra imagem
            </button>
            <button
              type="button"
              onClick={handleConfirmReplace}
              disabled={!canConfirmReplace}
              data-testid="edit-image-save-btn"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              {isUploading ? "Substituindo..." : "Confirmar substituição"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleKeepCurrent}
              disabled={isBusy}
              data-testid="edit-image-cancel-btn"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveTitleOnly}
              disabled={!canSaveTitleOnly}
              data-testid="edit-image-save-btn"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isTitleSaving && <Loader2 size={16} className="animate-spin" />}
              {isTitleSaving ? "Salvando..." : "Salvar alterações"}
            </button>
          </>
        )
      }
    >
      {enableFileReplace ? (
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={handleReplaceFile}
          data-testid="edit-image-file-input"
        />
      ) : null}

      {isReplaceFlow ? (
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
          testIdPrefix="edit-image"
          hotspots={referenceHotspots}
          hotspotsLoading={hotspotsLoading}
          hotspotsLoadError={hotspotsLoadError}
        />
      ) : (
        <div className="space-y-2 min-w-0">
          <div className="relative w-full h-48 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
            {currentPreviewUrl ? (
              <img
                src={currentPreviewUrl}
                alt="Pré-visualização da imagem atual"
                className="w-full h-full object-cover"
                data-testid="edit-image-preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                Pré-visualização indisponível
              </div>
            )}
          </div>

          {enableFileReplace ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              data-testid="edit-image-replace-btn"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Substituir arquivo
            </button>
          ) : null}

          {showExistingMeta ? (
            <dl
              className="grid grid-cols-3 gap-3 text-xs min-w-0"
              data-testid="edit-image-meta"
            >
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Formato</dt>
                <dd className="text-zinc-300 break-words">{existingMeta.format}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Tamanho</dt>
                <dd className="text-zinc-300">
                  {existingMeta.sizeBytes > 0
                    ? formatFileSize(existingMeta.sizeBytes)
                    : "—"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-zinc-500 mb-0.5">Resolução</dt>
                <dd className="text-zinc-300">
                  {existingMeta.width > 0 && existingMeta.height > 0
                    ? `${existingMeta.width} × ${existingMeta.height}`
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
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
          disabled={isBusy}
          data-testid="edit-image-title-input"
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 break-words"
          placeholder="Ex.: Sala de estar"
        />
      </div>

      {isUploading && processingStep ? (
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
      ) : null}

      {fileError ? (
        <p
          className="text-sm text-red-400 break-words"
          data-testid="edit-image-file-error"
        >
          {fileError}
        </p>
      ) : null}

      {preview.error || saveError ? (
        <p className="text-sm text-red-400 break-words" data-testid="edit-image-error">
          {saveError || preview.error}
        </p>
      ) : null}
    </AppModal>
  );
};
