import {
  heading,
  helpLink,
  note,
  paragraph,
  tip,
  unorderedList,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";
import { HELP_PLANS_PUBLIC_PATH } from "@/help/config/help";

const CATEGORY = "planos-e-armazenamento";

export const PLANOS_ARTICLES = [
  createArticle({
    slug: "entendendo-os-planos",
    category: CATEGORY,
    title: "Entendendo os planos",
    description:
      "O FIVI360 oferece planos com limites e recursos diferentes. Consulte sempre a página vigente.",
    keywords: ["planos", "starter", "professional", "studio"],
    relatedArticles: [
      "como-funciona-o-armazenamento",
      "como-acompanhar-meu-consumo",
    ],
    blocks: [
      paragraph(
        "Os planos definem quantos projetos você pode ter, quanto armazenamento está disponível e quais recursos avançados entram na conta — como hotspots, portfólio público e incorporação.",
      ),
      paragraph([
        "Valores, nomes comerciais e limites podem mudar. A referência atual está na ",
        helpLink(HELP_PLANS_PUBLIC_PATH, "página de planos"),
        ". Se você já estiver autenticado, também pode abrir Plano no app.",
      ]),
      heading("O que costuma variar entre planos"),
      unorderedList([
        "Quantidade de projetos e de armazenamento.",
        "Hotspots de informação e de navegação.",
        "Portfólio público e visibilidade Pública dos projetos.",
        "Incorporação do viewer em websites.",
      ]),
      note(
        "Não use capturas antigas de preço como referência. Abra a página de planos vigente antes de decidir.",
      ),
    ],
  }),

  createArticle({
    slug: "como-funciona-o-armazenamento",
    category: CATEGORY,
    title: "Como funciona o armazenamento",
    description:
      "Cada plano inclui uma cota. O envio de imagens consome esse espaço.",
    keywords: ["armazenamento", "cota", "upload", "espaço"],
    relatedArticles: [
      "como-acompanhar-meu-consumo",
      "entendendo-os-planos",
      "como-adicionar-uma-imagem-360",
    ],
    blocks: [
      paragraph(
        "O armazenamento é o espaço da conta para as imagens 360°. Cada envio consome parte da cota do plano. Se não houver espaço, o upload é recusado.",
      ),
      paragraph(
        "Depois do envio, o FIVI360 otimiza a imagem para a visualização. A cota da conta continua sendo o limite que vale na hora de adicionar ou substituir arquivos.",
      ),
      unorderedList([
        "Excluir uma imagem ou um projeto libera espaço.",
        "Substituir uma imagem também entra no cálculo da cota.",
        "Os limites exatos estão na página de planos vigente.",
      ]),
      tip([
        "Veja os planos atuais em ",
        helpLink(HELP_PLANS_PUBLIC_PATH, "Planos FIVI360"),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "como-acompanhar-meu-consumo",
    category: CATEGORY,
    title: "Como acompanhar meu consumo",
    description:
      "Acompanhe o uso de armazenamento no Dashboard e na página Plano.",
    keywords: ["consumo", "uso", "dashboard", "plano"],
    relatedArticles: [
      "como-funciona-o-armazenamento",
      "entendendo-os-planos",
    ],
    blocks: [
      paragraph(
        "Com a conta autenticada, o Dashboard e a página Plano mostram quanto da cota já está em uso, junto com outros indicadores da conta.",
      ),
      unorderedList([
        "Dashboard — visão rápida do espaço utilizado.",
        "Plano — detalhe do plano atual e do consumo.",
      ]),
      note(
        "Os números seguem o limite do plano vigente. Se o envio for recusado por falta de espaço, libere imagens ou avalie outro plano.",
      ),
    ],
  }),
];
