import { useCallback, useEffect, useRef, useState } from "react";
import { prepareUploadPreview } from "@/utils/prepareUploadPreview";

/**
 * @typedef {'idle' | 'validating' | 'processing' | 'preview_ready' | 'uploading' | 'error'} UploadPreviewPhase
 */

/**
 * Máquina de estados da prévia local antes do upload/substituição.
 * Garante cleanup único de Object URL e evita reprocessar o mesmo Blob.
 */
export function useUploadPreview() {
  const [phase, setPhase] = useState(/** @type {UploadPreviewPhase} */ ("idle"));
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [processedBlob, setProcessedBlob] = useState(
    /** @type {Blob | null} */ (null),
  );
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageMeta, setImageMeta] = useState(
    /** @type {{
     *   format: string,
     *   sizeBytes: number,
     *   width: number,
     *   height: number,
     *   fileName: string,
     * } | null} */ (null),
  );
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [showAspectWarning, setShowAspectWarning] = useState(false);
  const [error, setError] = useState("");
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(false);

  const generationRef = useRef(0);
  const previewUrlRef = useRef("");

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
  }, []);

  const clearPrepared = useCallback(() => {
    revokePreviewUrl();
    setProcessedBlob(null);
    setImageMeta(null);
    setShowQualityWarning(false);
    setShowAspectWarning(false);
    setViewerReady(false);
    setViewerError(false);
  }, [revokePreviewUrl]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    clearPrepared();
    setFile(null);
    setError("");
    setPhase("idle");
  }, [clearPrepared]);

  const prepareFile = useCallback(
    async (nextFile, { beforeProcess } = {}) => {
      const generation = ++generationRef.current;
      setFile(nextFile);
      setError("");
      setViewerReady(false);
      setViewerError(false);
      clearPrepared();

      try {
        if (beforeProcess) {
          setPhase("validating");
          await beforeProcess(nextFile);
          if (generation !== generationRef.current) {
            return null;
          }
        }

        setPhase("processing");
        const prepared = await prepareUploadPreview(nextFile);

        if (generation !== generationRef.current) {
          URL.revokeObjectURL(prepared.previewUrl);
          return null;
        }

        previewUrlRef.current = prepared.previewUrl;
        setProcessedBlob(prepared.processedBlob);
        setPreviewUrl(prepared.previewUrl);
        setImageMeta({
          format: prepared.format,
          sizeBytes: prepared.originalSizeBytes,
          width: prepared.width,
          height: prepared.height,
          fileName: prepared.fileName,
        });
        setShowQualityWarning(prepared.showQualityWarning);
        setShowAspectWarning(prepared.showAspectWarning);
        setPhase("preview_ready");
        return prepared;
      } catch (prepareError) {
        if (generation !== generationRef.current) {
          return null;
        }

        clearPrepared();
        setError(
          prepareError instanceof Error
            ? prepareError.message
            : "Não foi possível preparar esta imagem para visualização. Escolha outro arquivo e tente novamente.",
        );
        setPhase("error");
        return null;
      }
    },
    [clearPrepared],
  );

  const markUploading = useCallback(() => {
    setPhase("uploading");
    setError("");
  }, []);

  const markPreviewReady = useCallback(() => {
    setPhase("preview_ready");
  }, []);

  const markError = useCallback((message) => {
    setError(message);
    setPhase("error");
  }, []);

  const handleViewerReady = useCallback(() => {
    setViewerReady(true);
    setViewerError(false);
  }, []);

  const handleViewerError = useCallback(() => {
    setViewerReady(false);
    setViewerError(true);
  }, []);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  return {
    phase,
    file,
    processedBlob,
    previewUrl,
    imageMeta,
    showQualityWarning,
    showAspectWarning,
    error,
    viewerReady,
    viewerError,
    prepareFile,
    reset,
    clearPrepared,
    markUploading,
    markPreviewReady,
    markError,
    setError,
    handleViewerReady,
    handleViewerError,
  };
}
