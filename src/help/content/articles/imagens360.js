import {
  heading,
  helpLink,
  note,
  paragraph,
  softwareExportBlock,
  steps,
  tip,
  unorderedList,
  warning,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";

const CATEGORY = "imagens-360";

export const IMAGENS_360_ARTICLES = [
  createArticle({
    slug: "o-que-e-uma-imagem-360-equiretangular",
    category: CATEGORY,
    title: "O que é uma imagem 360° equiretangular?",
    description:
      "O panorama equirectangular é o formato 360° usado pelo viewer do FIVI360.",
    keywords: ["equirectangular", "equiretangular", "panorama", "2:1"],
    relatedArticles: [
      "como-preparar-sua-imagem-para-o-fivi360",
      "como-exportar-uma-imagem-360-do-seu-software",
      "como-adicionar-uma-imagem-360",
    ],
    blocks: [
      paragraph(
        "Uma imagem 360° equirectangular (também escrita equiretangular) é um panorama que cobre todas as direções ao redor do ponto de vista. No FIVI360, esse é o formato esperado pelo viewer.",
      ),
      paragraph(
        "A proporção típica é 2:1 — a largura tem cerca do dobro da altura. Assim o panorama “abre” corretamente, como se você estivesse dentro do ambiente.",
      ),
      note(
        "Fotos retas, recortes de planta ou imagens que não sejam panorâmicas 360° tendem a distorcer no viewer.",
      ),
      tip([
        "Se ainda vai exportar o render, comece por ",
        helpLink(
          "/ajuda/imagens-360/como-preparar-sua-imagem-para-o-fivi360",
          "Como preparar sua imagem para o FIVI360",
        ),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "como-adicionar-uma-imagem-360",
    category: CATEGORY,
    title: "Como adicionar uma imagem 360°",
    description:
      "Envie um panorama JPG, PNG ou WEBP e confirme depois da prévia 360°.",
    keywords: ["adicionar", "upload", "enviar imagem"],
    relatedArticles: [
      "como-substituir-uma-imagem",
      "como-organizar-imagens-no-projeto",
      "como-preparar-sua-imagem-para-o-fivi360",
    ],
    blocks: [
      paragraph(
        "Você adiciona imagens em um projeto ou na área de Imagens. O fluxo é o mesmo: selecionar o arquivo, revisar a prévia e confirmar.",
      ),
      steps([
        {
          title: "Selecione o arquivo",
          content: "Formatos aceitos: JPG, JPEG, PNG e WEBP.",
        },
        {
          title: "Aguarde a prévia",
          content:
            "O FIVI360 processa o arquivo e mostra o panorama no viewer antes do envio definitivo.",
        },
        {
          title: "Confirme",
          content:
            "Ajuste o título se quiser e confirme. A imagem fica disponível no projeto ou na lista de imagens.",
        },
      ]),
      note(
        "O envio respeita o armazenamento do seu plano. Se não houver cota suficiente, o upload é recusado.",
      ),
    ],
  }),

  createArticle({
    slug: "como-substituir-uma-imagem",
    category: CATEGORY,
    title: "Como substituir uma imagem",
    description:
      "Troque o arquivo de um panorama sem perder título, descrição ou hotspots já configurados.",
    keywords: ["substituir", "trocar", "atualizar imagem"],
    relatedArticles: [
      "como-adicionar-uma-imagem-360",
      "editando-ou-removendo-hotspots",
      "como-preparar-sua-imagem-para-o-fivi360",
    ],
    blocks: [
      paragraph(
        "Na edição da imagem, você escolhe um novo arquivo. O FIVI360 mantém o nome, a descrição e os hotspots já configurados.",
      ),
      paragraph(
        "Durante a prévia, os hotspots atuais aparecem só como referência. Confira se ainda estão alinhados ao novo panorama antes de confirmar.",
      ),
      warning(
        "Se o ponto de vista da nova imagem for diferente, os hotspots podem ficar deslocados. Ajuste-os no viewer depois da substituição.",
      ),
    ],
  }),

  createArticle({
    slug: "como-organizar-imagens-no-projeto",
    category: CATEGORY,
    title: "Como organizar imagens no projeto",
    description:
      "Vincule panoramas a um projeto, mova imagens soltas e mantenha os ambientes agrupados.",
    keywords: ["organizar", "mover", "imagens soltas"],
    relatedArticles: [
      "criar-um-projeto",
      "como-adicionar-uma-imagem-360",
      "hotspot-de-navegacao",
    ],
    blocks: [
      paragraph(
        "Imagens podem pertencer a um projeto ou ficar na área de Imagens, ainda sem projeto. Isso permite preparar panoramas antes de montar a apresentação.",
      ),
      unorderedList([
        "Adicione a imagem direto no projeto, ou envie-a em Imagens e mova depois.",
        "Uma imagem de um projeto pode ser desvinculada e voltar para a lista de imagens sem projeto.",
        "A lista segue a atividade recente: as atualizadas por último aparecem primeiro.",
      ]),
      note(
        "Se a imagem participar da navegação do projeto, movê-la para fora remove os hotspots de navegação relacionados. Hotspots de informação da própria imagem permanecem.",
      ),
    ],
  }),

  createArticle({
    slug: "como-preparar-sua-imagem-para-o-fivi360",
    category: CATEGORY,
    title: "Como preparar sua imagem para o FIVI360",
    description:
      "Formatos aceitos, proporção 2:1, resolução recomendada e o que acontece depois do envio.",
    keywords: [
      "preparar",
      "especificação",
      "jpg",
      "png",
      "webp",
      "resolução",
      "proporção",
    ],
    relatedArticles: [
      "o-que-e-uma-imagem-360-equiretangular",
      "como-exportar-uma-imagem-360-do-seu-software",
      "como-adicionar-uma-imagem-360",
    ],
    blocks: [
      heading("Formatos aceitos"),
      paragraph("Envie arquivos JPG, JPEG, PNG ou WEBP."),
      paragraph(
        "Formatos como HEIC, HEIF, BMP e TIFF não são aceitos. Se o software exportar nesses tipos, converta antes para JPG, PNG ou WEBP.",
      ),
      heading("Proporção"),
      paragraph(
        "O panorama deve ser equirectangular, com proporção próxima de 2:1. Se a proporção for muito diferente, o FIVI360 avisa que a visualização pode distorcer — o envio não é bloqueado só por isso.",
      ),
      heading("Resolução recomendada"),
      paragraph(
        "Para uma boa experiência, use pelo menos 3000 × 1500 pixels. Imagens menores podem ser enviadas, com um aviso de qualidade.",
      ),
      heading("Tamanho e armazenamento"),
      paragraph(
        "Não há um limite fixo de megabytes por arquivo na seleção. O que vale é o armazenamento do seu plano: se a cota estiver cheia, o envio não segue.",
      ),
      heading("Depois do envio"),
      paragraph(
        "O FIVI360 otimiza a imagem após o upload para a visualização no viewer. Você continua vendo uma prévia 360° antes de confirmar.",
      ),
      tip([
        "Os guias por software ainda estão em elaboração. Enquanto isso, exporte um panorama 2:1 em JPG ou PNG. Veja ",
        helpLink(
          "/ajuda/imagens-360/como-exportar-uma-imagem-360-do-seu-software",
          "Como exportar uma imagem 360° do seu software",
        ),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "como-exportar-uma-imagem-360-do-seu-software",
    category: CATEGORY,
    title: "Como exportar uma imagem 360° do seu software",
    description:
      "Escolha o software que você usa. Os tutoriais específicos serão publicados após validação.",
    keywords: [
      "exportar",
      "sketchup",
      "enscape",
      "revit",
      "twinmotion",
      "lumion",
      "d5",
      "v-ray",
      "corona",
      "3ds max",
    ],
    relatedArticles: [
      "como-preparar-sua-imagem-para-o-fivi360",
      "o-que-e-uma-imagem-360-equiretangular",
    ],
    blocks: [
      paragraph(
        "O FIVI360 recebe o panorama já exportado. A câmera 360°, a projeção equirectangular e a resolução são definidas no seu software de modelagem ou render.",
      ),
      paragraph(
        "Abaixo estão os guias previstos para os fluxos mais comuns em escritórios de arquitetura e design. Tutoriais ainda não validados aparecem como Em breve — não publicamos passos sem confirmação.",
      ),
      softwareExportBlock(),
      heading("Enquanto o guia específico não estiver pronto"),
      unorderedList([
        "Exporte um panorama 360° equirectangular.",
        "Use proporção próxima de 2:1.",
        "Prefira JPG, PNG ou WEBP.",
        "Evite recortes, marcas d’água pesadas ou projeção cubemap.",
      ]),
      note([
        "Depois de exportar, siga ",
        helpLink(
          "/ajuda/imagens-360/como-preparar-sua-imagem-para-o-fivi360",
          "Como preparar sua imagem para o FIVI360",
        ),
        " antes do upload.",
      ]),
    ],
  }),
];
