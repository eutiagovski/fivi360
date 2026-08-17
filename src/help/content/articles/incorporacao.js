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

const CATEGORY = "incorporacao";

export const INCORPORACAO_ARTICLES = [
  createArticle({
    slug: "o-que-e-a-incorporacao",
    category: CATEGORY,
    title: "O que é a incorporação?",
    description:
      "A incorporação exibe o projeto 360° dentro do website do escritório, sem o visitante sair da página.",
    keywords: ["incorporação", "embed", "iframe", "website"],
    relatedArticles: [
      "como-incorporar-um-projeto-em-um-site",
      "ativando-e-desativando-a-incorporacao",
      "configuracoes-da-incorporacao",
    ],
    blocks: [
      paragraph(
        "A incorporação coloca o viewer do projeto em uma página externa — em geral o site do escritório. O visitante explora os ambientes ali mesmo.",
      ),
      paragraph(
        "O FIVI360 gera um código HTML com um iframe responsivo para você colar no site.",
      ),
      note(
        "O recurso está disponível a partir do plano Professional. Sem o plano adequado, a opção permanece visível, porém bloqueada.",
      ),
    ],
  }),

  createArticle({
    slug: "como-incorporar-um-projeto-em-um-site",
    category: CATEGORY,
    title: "Como incorporar um projeto em um site",
    description:
      "Ative a incorporação, copie o snippet HTML e cole no website.",
    keywords: ["snippet", "código", "iframe", "colar"],
    relatedArticles: [
      "ativando-e-desativando-a-incorporacao",
      "configuracoes-da-incorporacao",
      "o-que-e-a-incorporacao",
    ],
    blocks: [
      steps([
        {
          title: "Abra Compartilhar",
          content: "No projeto, abra a aba Incorporar no website.",
        },
        {
          title: "Ative a incorporação",
          content: "Só com a incorporação ativa o código HTML é gerado.",
        },
        {
          title: "Copie o código",
          content:
            "O snippet inclui um iframe do viewer, pronto para páginas responsivas.",
        },
        {
          title: "Cole no site",
          content:
            "Insira o código na página desejada. Qualquer pessoa com acesso à página poderá explorar o projeto.",
        },
      ]),
      tip(
        "Use a prévia no próprio diálogo para conferir o ambiente inicial antes de publicar no site.",
      ),
    ],
  }),

  createArticle({
    slug: "ativando-e-desativando-a-incorporacao",
    category: CATEGORY,
    title: "Ativando e desativando a incorporação",
    description:
      "O interruptor Ativar incorporação liga ou desliga o viewer nos sites que já usam o código.",
    keywords: ["ativar", "desativar", "embed"],
    relatedArticles: [
      "como-incorporar-um-projeto-em-um-site",
      "configuracoes-da-incorporacao",
    ],
    blocks: [
      paragraph(
        "Em Incorporar no website, o interruptor Ativar incorporação controla se o projeto pode ser exibido fora do FIVI360.",
      ),
      unorderedList([
        "Ativo — o código e o endereço de embed mostram o viewer.",
        "Inativo — sites que já colaram o código deixam de exibir o projeto.",
      ]),
      note(
        "Desativar não apaga o snippet que você copiou. Ao reativar, o mesmo código volta a funcionar, desde que o projeto e o plano ainda permitam.",
      ),
    ],
  }),

  createArticle({
    slug: "configuracoes-da-incorporacao",
    category: CATEGORY,
    title: "Configurações da incorporação",
    description:
      "Ambiente inicial, tela cheia e navegação entre ambientes no viewer incorporado.",
    keywords: ["ambiente inicial", "fullscreen", "navegação", "iframe"],
    relatedArticles: [
      "como-incorporar-um-projeto-em-um-site",
      "hotspot-de-navegacao",
    ],
    blocks: [
      paragraph(
        "Com a incorporação ativa, você ajusta como a experiência aparece no site:",
      ),
      heading("Ambiente inicial"),
      paragraph(
        "Escolhe qual imagem abre primeiro quando o visitante carrega a página.",
      ),
      heading("Tela cheia"),
      paragraph(
        "Permite que o visitante expanda o viewer para ocupar toda a tela.",
      ),
      heading("Navegação entre ambientes"),
      paragraph(
        "Quando ligada, o visitante pode ir a outros ambientes do projeto. Quando desligada, a experiência fica no recorte que você definiu.",
      ),
      heading("Código (iframe)"),
      paragraph(
        "O snippet gerado pelo FIVI360 já inclui o iframe. Não é necessário montar o HTML manualmente.",
      ),
      note(
        "Quem acessa a página do site vê o projeto incorporado. Trate a incorporação como uma superfície pública do trabalho.",
      ),
    ],
  }),
];
