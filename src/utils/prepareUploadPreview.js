import { processImageForUpload } from "@/utils/imageConversion";
import {
  getImageFormat,
  isAtypicalPanoramaAspectRatio,
  isBelowRecommendedResolution,
} from "@/utils/imageValidation";
import { PREVIEW_PROCESS_FAILED_MESSAGE } from "@/utils/imageConstants";

/**
 * Prepara a prévia local a partir do Blob final (WebP) que será enviado.
 * Não faz upload, não escreve Firestore e não consome quota.
 *
 * @param {File} file
 * @returns {Promise<{
 *   processedBlob: Blob,
 *   previewUrl: string,
 *   width: number,
 *   height: number,
 *   originalSizeBytes: number,
 *   fileName: string,
 *   format: string,
 *   showQualityWarning: boolean,
 *   showAspectWarning: boolean,
 * }>}
 */
export async function prepareUploadPreview(file) {
  try {
    const originalSizeBytes = file.size;
    const { processedBlob, width, height } = await processImageForUpload(file);
    const previewUrl = URL.createObjectURL(processedBlob);

    return {
      processedBlob,
      previewUrl,
      width,
      height,
      originalSizeBytes,
      fileName: file.name,
      format: getImageFormat(file),
      showQualityWarning: isBelowRecommendedResolution(width, height),
      showAspectWarning: isAtypicalPanoramaAspectRatio(width, height),
    };
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw new Error(PREVIEW_PROCESS_FAILED_MESSAGE);
    }
    throw new Error(PREVIEW_PROCESS_FAILED_MESSAGE);
  }
}
