import {
  heading,
  helpLink,
  note,
  paragraph,
  steps,
  tip,
  unorderedList,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";

const CATEGORY = "compartilhamento";

export const COMPARTILHAMENTO_ARTICLES = [
  createArticle({
    slug: "como-compartilhar-um-projeto",
    category: CATEGORY,
    title: "Como compartilhar um projeto",
    description:
      "Abra Compartilhar no projeto para definir a visibilidade e copiar o link.",
    keywords: ["compartilhar", "link", "cliente"],
    relatedArticles: [
      "compartilhando-por-link",
      "projeto-privado-compartilhado-e-publico",
      "o-que-e-a-incorporacao",
    ],
    blocks: [
      steps([
        {
          title: "Abra o projeto",
          content: "No app, entre no projeto que deseja apresentar.",
        },
        {
          title: "Toque em Compartilhar",
          content:
            "Há duas abas: Compartilhar por link e Incorporar no website.",
        },
        {
          title: "Defina quem pode visualizar",
          content:
            "Escolha Privado, Compartilhado ou Público e salve, se alterar a visibilidade.",
        },
        {
          title: "Copie o link",
          content:
            "O endereço do projeto pode ser enviado ao cliente. Ele não precisa criar conta.",
        },
      ]),
      tip([
        "Para colocar o viewer no site do escritório, veja ",
        helpLink(
          "/ajuda/incorporacao/como-incorporar-um-projeto-em-um-site",
          "Como incorporar um projeto em um site",
        ),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "projeto-privado-compartilhado-e-publico",
    category: CATEGORY,
    title: "Projeto privado, compartilhado e público",
    description:
      "Diferença prática entre os três níveis de acesso do projeto.",
    keywords: ["privado", "compartilhado", "público", "acesso"],
    relatedArticles: [
      "visibilidade-do-projeto",
      "compartilhando-por-link",
      "escolhendo-projetos-exibidos",
    ],
    blocks: [
      heading("Privado"),
      paragraph(
        "Somente você vê o projeto no FIVI360. Mesmo com o endereço em mãos, outras pessoas não acessam o conteúdo.",
      ),
      heading("Compartilhado"),
      paragraph(
        "Quem tem o link visualiza o projeto. É o modo usual para enviar ao cliente sem publicar no portfólio.",
      ),
      heading("Público"),
      paragraph(
        "O link continua válido e o projeto passa a aparecer no portfólio público, se o portfólio estiver ativo e o plano permitir.",
      ),
      note(
        "Visitantes de um link compartilhado ou público não precisam de conta no FIVI360.",
      ),
    ],
  }),

  createArticle({
    slug: "compartilhando-por-link",
    category: CATEGORY,
    title: "Compartilhando por link",
    description:
      "Copie o link do projeto e envie. O acesso segue a visibilidade salva.",
    keywords: ["link", "url", "copiar"],
    relatedArticles: [
      "como-compartilhar-um-projeto",
      "projeto-privado-compartilhado-e-publico",
    ],
    blocks: [
      paragraph(
        "Cada projeto tem um endereço de compartilhamento. Na aba Compartilhar por link, copie o URL e envie por e-mail, mensagem ou proposta.",
      ),
      unorderedList([
        "Com visibilidade Compartilhado ou Público, o link abre o viewer do projeto.",
        "Com visibilidade Privado, o link não libera o conteúdo para terceiros.",
        "O visitante navega pelos ambientes do projeto conforme as imagens e hotspots configurados.",
      ]),
      note(
        "Você também pode compartilhar uma imagem individual por link próprio, independente do projeto. Esse fluxo fica na própria imagem.",
      ),
    ],
  }),
];
