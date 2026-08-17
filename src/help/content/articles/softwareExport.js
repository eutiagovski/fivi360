import {
  heading,
  helpLink,
  note,
  paragraph,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";
import {
  SOFTWARE_GUIDES,
  SOFTWARE_GUIDE_SECTIONS,
} from "@/help/content/softwareGuides";

const CATEGORY = "imagens-360";

const COMING_SOON_COPY =
  "Este tópico será preenchido com os passos confirmados do software. Não publicamos configurações sem validação.";

function softwareGuideArticle(guide) {
  const related = [
    "como-exportar-uma-imagem-360-do-seu-software",
    "como-preparar-sua-imagem-para-o-fivi360",
    "o-que-e-uma-imagem-360-equiretangular",
  ];

  const sectionBlocks = SOFTWARE_GUIDE_SECTIONS.flatMap((section) => {
    if (section.id === "objetivo") {
      return [
        heading(section.title),
        paragraph(
          `Este guia mostrará como exportar uma imagem panorâmica 360° equirectangular a partir de ${guide.name} para uso no FIVI360.`,
        ),
        note(COMING_SOON_COPY),
      ];
    }

    if (section.id === "upload") {
      return [
        heading(section.title),
        paragraph([
          "Quando o tutorial estiver publicado, o passo final será enviar o panorama ao FIVI360. Enquanto isso, use ",
          helpLink(
            "/ajuda/imagens-360/como-adicionar-uma-imagem-360",
            "Como adicionar uma imagem 360°",
          ),
          ".",
        ]),
      ];
    }

    if (section.id === "video") {
      return [
        heading(section.title),
        paragraph(
          "O vídeo tutorial será adicionado aqui quando o conteúdo estiver pronto. Nenhum vídeo está publicado nesta versão.",
        ),
      ];
    }

    return [heading(section.title), paragraph(COMING_SOON_COPY)];
  });

  return createArticle({
    slug: guide.slug,
    category: CATEGORY,
    title: `Como exportar uma imagem 360° do ${guide.name}`,
    description: `Estrutura do tutorial de exportação 360° para ${guide.name}. Conteúdo específico em breve.`,
    keywords: [
      guide.name,
      guide.softwareName,
      guide.rendererName,
      "exportar",
      "360",
      "equirectangular",
    ].filter(Boolean),
    status: "coming-soon",
    listed: false,
    relatedArticles: related,
    blocks: sectionBlocks,
  });
}

export const SOFTWARE_EXPORT_ARTICLES = SOFTWARE_GUIDES.map(softwareGuideArticle);
