const WEBP_QUALITY = 0.90;

/**
 * Processa o arquivo com o pipeline local atual (Canvas → WebP)
 * e devolve também as dimensões usadas no draw.
 *
 * @param {File | Blob} file
 * @returns {Promise<{ processedBlob: Blob, width: number, height: number }>}
 */
export async function processImageForUpload(file) {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Não foi possível processar a imagem.");
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const processedBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Falha na conversão para WEBP."));
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });

  return { processedBlob, width, height };
}

/**
 * Converte um arquivo de imagem para WEBP via Canvas API.
 *
 * @param {File | Blob} file
 * @returns {Promise<Blob>}
 */
export async function convertToWebp(file) {
  const { processedBlob } = await processImageForUpload(file);
  return processedBlob;
}
