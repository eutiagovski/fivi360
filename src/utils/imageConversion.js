const WEBP_QUALITY = 0.9;

/**
 * Converte um arquivo de imagem para WEBP via Canvas API.
 *
 * @param {File | Blob} file
 * @returns {Promise<Blob>}
 */
export async function convertToWebp(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Não foi possível processar a imagem.");
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const webpBlob = await new Promise((resolve, reject) => {
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

  return webpBlob;
}
