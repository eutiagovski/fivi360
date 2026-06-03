/** Resolução mínima recomendada para imagens panorâmicas 360° (equirectangular 2:1). */
export const MIN_RECOMMENDED_WIDTH = 4096;
export const MIN_RECOMMENDED_HEIGHT = 2048;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const BLOCKED_IMAGE_EXTENSIONS = ["heic", "heif", "bmp", "tif", "tiff"];

export const UNSUPPORTED_FORMAT_MESSAGE =
  "Formato não suportado. Utilize JPG, PNG ou WEBP.";

export const LOW_QUALITY_WARNING_MESSAGE =
  "A qualidade da imagem pode não proporcionar a melhor experiência de visualização. Considere exportar o render em resolução mais alta.";

export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
