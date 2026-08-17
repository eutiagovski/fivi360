import {
  heading,
  helpLink,
  note,
  paragraph,
  steps,
  tip,
  unorderedList,
  warning,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";

const CATEGORY = "projetos";

export const PROJETOS_ARTICLES = [
  createArticle({
    slug: "criar-um-projeto",
    category: CATEGORY,
    title: "Criar um projeto",
    description:
      "Como criar um projeto no FIVI360 e quais informações você pode registrar.",
    keywords: ["criar", "novo projeto", "título"],
    relatedArticles: [
      "editar-informacoes-do-projeto",
      "visibilidade-do-projeto",
      "criando-seu-primeiro-projeto",
    ],
    blocks: [
      paragraph(
        "Projetos organizam as imagens 360° de um trabalho. Você cria um projeto em Projetos, no app.",
      ),
      heading("Campos do projeto"),
      unorderedList([
        ["Título — obrigatório."],
        ["Nome do cliente — opcional."],
        ["Descrição — opcional."],
        [
          "Visibilidade — Privado, Compartilhado ou Público, conforme o plano. O padrão é Privado.",
        ],
      ]),
      note(
        "O limite de projetos depende do plano. No Starter, por exemplo, a criação para quando o limite é atingido.",
      ),
    ],
  }),

  createArticle({
    slug: "editar-informacoes-do-projeto",
    category: CATEGORY,
    title: "Editar informações do projeto",
    description:
      "Altere título, cliente, descrição e visibilidade de um projeto existente.",
    keywords: ["editar", "alterar", "projeto"],
    relatedArticles: [
      "criar-um-projeto",
      "visibilidade-do-projeto",
      "excluir-um-projeto",
    ],
    blocks: [
      steps([
        {
          title: "Abra o projeto",
          content: "Em Projetos, entre no projeto que deseja atualizar.",
        },
        {
          title: "Edite as informações",
          content:
            "Você pode alterar título, nome do cliente, descrição e visibilidade. O título continua obrigatório.",
        },
        {
          title: "Salve",
          content: "As alterações passam a valer imediatamente no app e nas superfícies públicas já ativas.",
        },
      ]),
      tip(
        "Link de compartilhamento e incorporação ficam na ação de compartilhar o projeto, não neste formulário de informações.",
      ),
    ],
  }),

  createArticle({
    slug: "excluir-um-projeto",
    category: CATEGORY,
    title: "Excluir um projeto",
    description:
      "A exclusão remove o projeto, as imagens, os hotspots e os arquivos vinculados.",
    keywords: ["excluir", "apagar", "remover projeto"],
    relatedArticles: [
      "criar-um-projeto",
      "como-organizar-imagens-no-projeto",
    ],
    blocks: [
      warning(
        "Excluir um projeto é permanente. O FIVI360 remove o projeto, as imagens dele, os hotspots e os arquivos armazenados.",
      ),
      steps([
        {
          title: "Abra o projeto",
          content: "Entre no projeto que deseja excluir.",
        },
        {
          title: "Confirme a exclusão",
          content:
            "Use a ação de excluir e confirme. Não há lixeira nesta etapa.",
        },
      ]),
      note(
        "Se uma imagem participar da navegação entre ambientes, os hotspots de navegação relacionados também são removidos.",
      ),
    ],
  }),

  createArticle({
    slug: "visibilidade-do-projeto",
    category: CATEGORY,
    title: "Visibilidade do projeto",
    description:
      "Entenda as opções Privado, Compartilhado e Público no FIVI360.",
    keywords: ["visibilidade", "privado", "compartilhado", "público", "unlisted"],
    relatedArticles: [
      "projeto-privado-compartilhado-e-publico",
      "como-compartilhar-um-projeto",
      "escolhendo-projetos-exibidos",
    ],
    blocks: [
      paragraph(
        "A visibilidade controla quem acessa o projeto fora da sua conta. Há três níveis:",
      ),
      heading("Privado"),
      paragraph(
        "Só você acessa o projeto no app. O link de compartilhamento não abre o conteúdo para outras pessoas.",
      ),
      heading("Compartilhado"),
      paragraph(
        "Quem tiver o link pode visualizar o projeto, sem precisar de conta. O projeto não aparece no portfólio público.",
      ),
      heading("Público"),
      paragraph(
        "O projeto continua acessível por link e também entra no portfólio público, quando o portfólio estiver ativo.",
      ),
      note(
        "A opção Público depende do plano. Quando o plano não inclui visibilidade pública, ela não aparece na lista.",
      ),
      tip([
        "Para enviar ao cliente sem publicar no portfólio, use Compartilhado. Veja também ",
        helpLink(
          "/ajuda/compartilhamento/projeto-privado-compartilhado-e-publico",
          "Projeto privado, compartilhado e público",
        ),
        ".",
      ]),
    ],
  }),
];
