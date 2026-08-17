/**
 * Categorias da Central de Ajuda.
 * Poucas, estáveis e alinhadas ao produto — não um índice de todos os recursos.
 */

export const HELP_CATEGORIES = Object.freeze([
  {
    slug: "primeiros-passos",
    title: "Primeiros passos",
    description: "Crie sua conta, monte o primeiro projeto e visualize um panorama 360°.",
    keywords: ["começar", "conta", "onboarding"],
  },
  {
    slug: "projetos",
    title: "Projetos",
    description: "Crie, edite, exclua e defina a visibilidade dos seus projetos.",
    keywords: ["projeto", "privado", "compartilhado", "público"],
  },
  {
    slug: "imagens-360",
    title: "Imagens 360°",
    description: "Envie, substitua e prepare panoramas equirectangulares para o FIVI360.",
    keywords: ["panorama", "equirectangular", "upload", "exportar"],
  },
  {
    slug: "hotspots",
    title: "Hotspots",
    description: "Marque informações e conecte ambientes com hotspots de navegação.",
    keywords: ["hotspot", "informação", "navegação"],
  },
  {
    slug: "compartilhamento",
    title: "Compartilhamento",
    description: "Envie o projeto por link com o nível de acesso adequado.",
    keywords: ["link", "compartilhar", "cliente"],
  },
  {
    slug: "incorporacao",
    title: "Incorporação",
    description: "Exiba o projeto 360° no website do escritório.",
    keywords: ["embed", "iframe", "website"],
  },
  {
    slug: "portfolio",
    title: "Portfólio",
    description: "Publique uma página pública com os projetos que você escolher.",
    keywords: ["portfólio", "slug", "página pública"],
  },
  {
    slug: "planos-e-armazenamento",
    title: "Planos e armazenamento",
    description: "Entenda os planos vigentes e acompanhe o consumo da sua conta.",
    keywords: ["plano", "armazenamento", "consumo"],
  },
  {
    slug: "conta-e-configuracoes",
    title: "Conta e configurações",
    description: "Perfil, escritório, portfólio, senha e verificação de e-mail.",
    keywords: ["perfil", "escritório", "senha", "e-mail"],
  },
]);

/**
 * @param {string} slug
 * @returns {(typeof HELP_CATEGORIES)[number] | undefined}
 */
export function getHelpCategory(slug) {
  return HELP_CATEGORIES.find((category) => category.slug === slug);
}
