/** Resolução mínima recomendada para imagens panorâmicas 360° (equirectangular 2:1). */
export const MIN_RECOMMENDED_WIDTH = 3000;
export const MIN_RECOMMENDED_HEIGHT = 1500;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const BLOCKED_IMAGE_EXTENSIONS = ["heic", "heif", "bmp", "tif", "tiff"];

export const UNSUPPORTED_FORMAT_MESSAGE =
  "Formato não suportado. Utilize JPG, PNG ou WEBP.";

export const LOW_QUALITY_WARNING_MESSAGE =
  "A qualidade da imagem pode não proporcionar a melhor experiência de visualização. Considere exportar o render em resolução mais alta.";

/** Tolerância relativa à proporção equirectangular recomendada (2:1). */
export const PANORAMA_ASPECT_RATIO_TARGET = 2;
export const PANORAMA_ASPECT_RATIO_TOLERANCE = 0.2;

export const ATYPICAL_ASPECT_RATIO_WARNING_MESSAGE =
  "Esta imagem não possui a proporção panorâmica recomendada de 2:1. A visualização pode apresentar distorções.";

export const PREVIEW_PROCESS_FAILED_MESSAGE =
  "Não foi possível preparar esta imagem para visualização. Escolha outro arquivo e tente novamente.";

export const PREVIEW_PANORAMA_LOAD_FAILED_MESSAGE =
  "Não foi possível abrir a prévia 360°. Verifique o arquivo selecionado.";

export const PREVIEW_REFERENCE_HOTSPOTS_MESSAGE =
  "Os hotspots atuais são exibidos apenas como referência. Confirme se continuam alinhados à nova imagem.";

export const PREVIEW_HOTSPOTS_LOAD_FAILED_MESSAGE =
  "A imagem pode ser visualizada, mas não foi possível carregar os hotspots de referência.";

export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
