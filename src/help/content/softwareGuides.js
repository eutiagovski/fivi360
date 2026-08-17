/**
 * Guias de exportação 360° por software.
 *
 * Nesta RC: estrutura, cards e artigos-esqueleto.
 * Passos técnicos só serão preenchidos após validação — não inventar configurações.
 */

export const SOFTWARE_GUIDE_STATUS = Object.freeze({
  COMING_SOON: "coming-soon",
  PUBLISHED: "published",
});

export const SOFTWARE_GUIDES = Object.freeze([
  {
    id: "sketchup-enscape",
    slug: "sketchup-enscape",
    name: "SketchUp + Enscape",
    softwareName: "SketchUp",
    rendererName: "Enscape",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "sketchup-vray",
    slug: "sketchup-vray",
    name: "SketchUp + V-Ray",
    softwareName: "SketchUp",
    rendererName: "V-Ray",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "revit-enscape",
    slug: "revit-enscape",
    name: "Revit + Enscape",
    softwareName: "Revit",
    rendererName: "Enscape",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "revit-twinmotion",
    slug: "revit-twinmotion",
    name: "Revit + Twinmotion",
    softwareName: "Revit",
    rendererName: "Twinmotion",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "3ds-max-corona",
    slug: "3ds-max-corona",
    name: "3ds Max + Corona",
    softwareName: "3ds Max",
    rendererName: "Corona",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "3ds-max-vray",
    slug: "3ds-max-vray",
    name: "3ds Max + V-Ray",
    softwareName: "3ds Max",
    rendererName: "V-Ray",
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "lumion",
    slug: "lumion",
    name: "Lumion",
    softwareName: "Lumion",
    rendererName: null,
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "d5-render",
    slug: "d5-render",
    name: "D5 Render",
    softwareName: "D5 Render",
    rendererName: null,
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
  {
    id: "twinmotion",
    slug: "twinmotion",
    name: "Twinmotion",
    softwareName: "Twinmotion",
    rendererName: null,
    status: SOFTWARE_GUIDE_STATUS.COMING_SOON,
  },
]);

export const SOFTWARE_GUIDE_SECTIONS = Object.freeze([
  { id: "objetivo", title: "Objetivo" },
  { id: "camera-360", title: "Configuração da câmera 360°" },
  { id: "projecao", title: "Configuração de projeção" },
  { id: "resolucao", title: "Resolução" },
  { id: "formato", title: "Formato" },
  { id: "render-export", title: "Render e exportação" },
  { id: "verificar", title: "Como verificar se a imagem está correta" },
  { id: "upload", title: "Upload no FIVI360" },
  { id: "problemas", title: "Problemas comuns" },
  { id: "video", title: "Vídeo tutorial" },
]);

/**
 * @param {string} slug
 * @returns {(typeof SOFTWARE_GUIDES)[number] | undefined}
 */
export function getSoftwareGuide(slug) {
  return SOFTWARE_GUIDES.find((guide) => guide.slug === slug);
}

/**
 * @param {(typeof SOFTWARE_GUIDES)[number]} guide
 * @returns {boolean}
 */
export function isSoftwareGuideComingSoon(guide) {
  return guide?.status !== SOFTWARE_GUIDE_STATUS.PUBLISHED;
}
