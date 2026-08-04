import { AlertTriangle, Loader2 } from "lucide-react";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import {
  ATYPICAL_ASPECT_RATIO_WARNING_MESSAGE,
  LOW_QUALITY_WARNING_MESSAGE,
  PREVIEW_HOTSPOTS_LOAD_FAILED_MESSAGE,
  PREVIEW_PANORAMA_LOAD_FAILED_MESSAGE,
  PREVIEW_REFERENCE_HOTSPOTS_MESSAGE,
} from "@/utils/imageConstants";
import { formatFileSize } from "@/utils/imageValidation";

/**
 * Área de prévia 360° no modal de upload/substituição.
 */
export function PanoramaUploadPreview({
  previewUrl,
  phase,
  imageMeta,
  showQualityWarning = false,
  showAspectWarning = false,
  viewerError = false,
  viewerReady = false,
  onViewerReady,
  onViewerError,
  processingLabel = "Preparando visualização…",
  testIdPrefix = "upload-preview",
  hotspots = [],
  hotspotsLoading = false,
  hotspotsLoadError = null,
}) {
  const isProcessing = phase === "validating" || phase === "processing";
  const showViewer = Boolean(previewUrl) && !isProcessing && phase !== "idle";
  const hasReferenceHotspots = Array.isArray(hotspots) && hotspots.length > 0;

  return (
    <div className="space-y-3 min-w-0">
      <div
        className="relative w-full aspect-video min-h-[220px] bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
        data-testid={`${testIdPrefix}-viewer-frame`}
      >
        {isProcessing ? (
          <div
            className="flex flex-col items-center justify-center gap-2 h-full min-h-[220px]"
            data-testid={`${testIdPrefix}-processing`}
          >
            <Loader2 size={24} className="animate-spin text-zinc-400" />
            <p className="text-sm text-zinc-400">{processingLabel}</p>
          </div>
        ) : null}

        {showViewer ? (
          <>
            {(!viewerReady && !viewerError) ? (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-800/90"
                data-testid={`${testIdPrefix}-viewer-loading`}
              >
                <Loader2 size={24} className="animate-spin text-zinc-400" />
                <p className="text-sm text-zinc-400">Carregando prévia 360°…</p>
              </div>
            ) : null}

            {viewerError ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-zinc-800"
                data-testid={`${testIdPrefix}-viewer-error`}
              >
                <p className="text-sm text-red-400 text-center">
                  {PREVIEW_PANORAMA_LOAD_FAILED_MESSAGE}
                </p>
              </div>
            ) : null}

            <PanoramaViewer
              panoramaUrl={previewUrl}
              mode="upload-preview"
              hotspots={hotspots}
              hotspotsInteractive={false}
              showZoomCtrl
              showFullscreenCtrl
              className="h-full w-full min-h-[220px]"
              onReady={onViewerReady}
              onError={onViewerError}
            />
          </>
        ) : null}

        {!isProcessing && !showViewer ? (
          <div className="flex items-center justify-center h-full min-h-[220px] text-sm text-zinc-500">
            Pré-visualização indisponível
          </div>
        ) : null}
      </div>

      {hotspotsLoading && showViewer && !isProcessing && !hasReferenceHotspots && !hotspotsLoadError ? (
        <p
          className="text-xs text-zinc-500"
          data-testid={`${testIdPrefix}-hotspots-loading`}
        >
          Carregando hotspots de referência…
        </p>
      ) : null}

      {hasReferenceHotspots && showViewer && !isProcessing ? (
        <p
          className="text-sm text-zinc-400"
          data-testid={`${testIdPrefix}-hotspots-hint`}
        >
          {PREVIEW_REFERENCE_HOTSPOTS_MESSAGE}
        </p>
      ) : null}

      {hotspotsLoadError && showViewer && !isProcessing ? (
        <p
          className="text-sm text-amber-200/90"
          data-testid={`${testIdPrefix}-hotspots-error`}
        >
          {PREVIEW_HOTSPOTS_LOAD_FAILED_MESSAGE}
        </p>
      ) : null}

      {imageMeta && !isProcessing ? (
        <div className="space-y-2" data-testid={`${testIdPrefix}-meta`}>
          {imageMeta.fileName ? (
            <p
              className="text-sm text-zinc-300 truncate"
              title={imageMeta.fileName}
              data-testid={`${testIdPrefix}-filename`}
            >
              {imageMeta.fileName}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-xs min-w-0 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-zinc-500 mb-0.5">Tamanho</dt>
              <dd className="text-zinc-300" data-testid={`${testIdPrefix}-size`}>
                {formatFileSize(imageMeta.sizeBytes)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-zinc-500 mb-0.5">Resolução</dt>
              <dd
                className="text-zinc-300"
                data-testid={`${testIdPrefix}-dimensions`}
              >
                {imageMeta.width} × {imageMeta.height}
              </dd>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <dt className="text-zinc-500 mb-0.5">Formato</dt>
              <dd className="text-zinc-300">{imageMeta.format}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {showAspectWarning && imageMeta && !isProcessing ? (
        <div
          className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          data-testid={`${testIdPrefix}-aspect-warning`}
        >
          <AlertTriangle
            size={18}
            className="text-amber-400 shrink-0 mt-0.5"
          />
          <p className="text-sm text-amber-200/90">
            {ATYPICAL_ASPECT_RATIO_WARNING_MESSAGE}
          </p>
        </div>
      ) : null}

      {showQualityWarning && imageMeta && !isProcessing ? (
        <div
          className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          data-testid={`${testIdPrefix}-quality-warning`}
        >
          <AlertTriangle
            size={18}
            className="text-amber-400 shrink-0 mt-0.5"
          />
          <p className="text-sm text-amber-200/90">
            {LOW_QUALITY_WARNING_MESSAGE}
          </p>
        </div>
      ) : null}
    </div>
  );
}
