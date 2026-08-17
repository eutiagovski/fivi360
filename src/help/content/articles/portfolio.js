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

const CATEGORY = "portfolio";

export const PORTFOLIO_ARTICLES = [
  createArticle({
    slug: "o-que-e-o-portfolio-publico",
    category: CATEGORY,
    title: "O que é o portfólio público?",
    description:
      "Uma página pública do escritório com os projetos marcados como Públicos.",
    keywords: ["portfólio", "página pública", "slug"],
    relatedArticles: [
      "configurando-seu-portfolio",
      "escolhendo-projetos-exibidos",
      "compartilhando-seu-portfolio",
    ],
    blocks: [
      paragraph(
        "O portfólio público é a vitrine do escritório no FIVI360. Visitantes abrem um endereço do tipo /u/seu-slug e veem os projetos com visibilidade Pública.",
      ),
      unorderedList([
        "Não exige login de quem visita.",
        "Mostra identidade do escritório, quando preenchida em Configurações.",
        "Só lista projetos Públicos. Privados e Compartilhados ficam de fora.",
      ]),
      note(
        "O portfólio depende do plano. Nos planos que não incluem a vitrine pública, a ativação permanece bloqueada.",
      ),
    ],
  }),

  createArticle({
    slug: "configurando-seu-portfolio",
    category: CATEGORY,
    title: "Configurando seu portfólio",
    description:
      "Defina o endereço (slug), ative o portfólio e complete os dados do escritório.",
    keywords: ["configurar", "slug", "ativar portfólio"],
    relatedArticles: [
      "alterando-configuracoes-do-portfolio",
      "configurando-meu-escritorio",
      "escolhendo-projetos-exibidos",
    ],
    blocks: [
      steps([
        {
          title: "Abra Configurações",
          content: "Vá à seção Portfólio público.",
        },
        {
          title: "Defina o slug",
          content:
            "O slug é o final do endereço público. Ele precisa estar disponível.",
        },
        {
          title: "Ative o portfólio",
          content:
            "O interruptor só liga se o plano incluir portfólio público. Caso contrário, o FIVI360 indica o upgrade.",
        },
      ]),
      tip([
        "Nome do escritório, logo, bio e redes entram em ",
        helpLink(
          "/ajuda/conta-e-configuracoes/configurando-meu-escritorio",
          "Configurando meu escritório",
        ),
        " e aparecem na página pública.",
      ]),
    ],
  }),

  createArticle({
    slug: "escolhendo-projetos-exibidos",
    category: CATEGORY,
    title: "Escolhendo projetos exibidos",
    description:
      "O portfólio lista automaticamente os projetos com visibilidade Pública.",
    keywords: ["projetos públicos", "exibir", "vitrine"],
    relatedArticles: [
      "visibilidade-do-projeto",
      "configurando-seu-portfolio",
      "projeto-privado-compartilhado-e-publico",
    ],
    blocks: [
      paragraph(
        "Não há uma lista separada de “incluir no portfólio”. O que define a vitrine é a visibilidade de cada projeto:",
      ),
      unorderedList([
        "Público — entra no portfólio, se o portfólio estiver ativo.",
        "Compartilhado — acessível por link, fora do portfólio.",
        "Privado — só você vê no app.",
      ]),
      heading("Para exibir um projeto"),
      paragraph(
        "Abra o projeto, defina visibilidade Pública e salve. Para retirar, volte para Compartilhado ou Privado.",
      ),
      note(
        "O portfólio precisa estar ativo em Configurações. Sem isso, projetos Públicos não ficam visíveis na página /u/seu-slug.",
      ),
    ],
  }),

  createArticle({
    slug: "compartilhando-seu-portfolio",
    category: CATEGORY,
    title: "Compartilhando seu portfólio",
    description:
      "Copie o endereço público do escritório e envie ou use no site.",
    keywords: ["compartilhar portfólio", "url", "endereço"],
    relatedArticles: [
      "configurando-seu-portfolio",
      "o-que-e-o-portfolio-publico",
    ],
    blocks: [
      paragraph(
        "Em Configurações, na seção Portfólio público, você vê o endereço gerado a partir do slug. Copie e envie, ou use no site e nas redes do escritório.",
      ),
      paragraph(
        "Quem abre o link vê a página pública e pode entrar nos projetos Públicos, sem criar conta.",
      ),
      note(
        "Se o portfólio estiver inativo ou o plano não incluir o recurso, o endereço público não apresenta os projetos.",
      ),
    ],
  }),
];
