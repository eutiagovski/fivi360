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

const CATEGORY = "hotspots";

export const HOTSPOTS_ARTICLES = [
  createArticle({
    slug: "o-que-sao-hotspots",
    category: CATEGORY,
    title: "O que são hotspots?",
    description:
      "Hotspots são marcadores no viewer 360°: informação neste ponto ou navegação para outro ambiente.",
    keywords: ["hotspot", "marcador", "informação", "navegação"],
    relatedArticles: [
      "criando-um-hotspot",
      "hotspot-de-informacao",
      "hotspot-de-navegacao",
    ],
    blocks: [
      paragraph(
        "Hotspots são pontos que você coloca sobre o panorama. No FIVI360 existem dois tipos:",
      ),
      unorderedList([
        [
          "Informação — abre um texto neste ponto da cena.",
        ],
        [
          "Navegação — leva o visitante para outra imagem do mesmo projeto.",
        ],
      ]),
      note(
        "Hotspots estão disponíveis a partir dos planos que incluem o recurso. No plano inicial, o viewer mostra o panorama sem a gestão de hotspots.",
      ),
      paragraph(
        "Você cria e edita hotspots no viewer da imagem, com a gestão ativada.",
      ),
    ],
  }),

  createArticle({
    slug: "criando-um-hotspot",
    category: CATEGORY,
    title: "Criando um hotspot",
    description:
      "Ative a gestão no viewer e adicione um hotspot de informação ou de navegação no ponto desejado.",
    keywords: ["criar hotspot", "gerenciar", "viewer"],
    relatedArticles: [
      "hotspot-de-informacao",
      "hotspot-de-navegacao",
      "editando-ou-removendo-hotspots",
    ],
    blocks: [
      steps([
        {
          title: "Abra a imagem no viewer",
          content: "Entre no panorama em que o marcador deve aparecer.",
        },
        {
          title: "Ative Gerenciar hotspots",
          content:
            "Com a gestão ligada, você posiciona novos pontos e edita os existentes.",
        },
        {
          title: "Escolha o tipo",
          content:
            "No ponto da cena, escolha Informação ou Navegação. A navegação só aparece quando a imagem pertence a um projeto.",
        },
      ]),
      tip(
        "No computador, o menu de criação também pode ser aberto com o botão direito sobre o panorama.",
      ),
      note(
        "Sem um projeto vinculado, só é possível criar hotspots de informação.",
      ),
    ],
  }),

  createArticle({
    slug: "hotspot-de-navegacao",
    category: CATEGORY,
    title: "Hotspot de navegação",
    description:
      "O hotspot de navegação conecta um ambiente a outra imagem do mesmo projeto.",
    keywords: ["navegação", "scene", "cena", "ambiente"],
    relatedArticles: [
      "hotspot-de-informacao",
      "criando-um-hotspot",
      "como-organizar-imagens-no-projeto",
    ],
    blocks: [
      paragraph(
        "O hotspot de navegação leva o visitante de um ambiente para outro. Ele só existe em imagens vinculadas a um projeto, porque o destino precisa ser outra imagem desse projeto.",
      ),
      unorderedList([
        "Ao criar, escolha a imagem de destino.",
        "No viewer, o visitante toca o ponto e muda de ambiente.",
        "Se a imagem de destino for removida do projeto, os hotspots de navegação relacionados deixam de funcionar e são removidos.",
      ]),
      note(
        "Na incorporação, a navegação entre ambientes pode ser desligada nas configurações do embed, mesmo que os hotspots existam no projeto.",
      ),
    ],
  }),

  createArticle({
    slug: "hotspot-de-informacao",
    category: CATEGORY,
    title: "Hotspot de informação",
    description:
      "O hotspot de informação mostra um título e um texto no ponto da cena.",
    keywords: ["informação", "info", "texto"],
    relatedArticles: [
      "hotspot-de-navegacao",
      "criando-um-hotspot",
      "editando-ou-removendo-hotspots",
    ],
    blocks: [
      paragraph(
        "O hotspot de informação marca um detalhe do ambiente — um material, um móvel, uma observação para o cliente.",
      ),
      unorderedList([
        "Informe um título e uma descrição.",
        "O ponto fica visível no viewer; ao tocar, o texto é exibido.",
        "Esse tipo não depende de outra imagem e pode existir mesmo fora de um projeto.",
      ]),
      heading("O que ele não faz"),
      paragraph(
        "O hotspot de informação não abre sites externos nem muda de ambiente. Para conectar cenas, use o hotspot de navegação.",
      ),
    ],
  }),

  createArticle({
    slug: "editando-ou-removendo-hotspots",
    category: CATEGORY,
    title: "Editando ou removendo hotspots",
    description:
      "Altere o conteúdo, o destino ou remova um hotspot pelo painel de gestão no viewer.",
    keywords: ["editar hotspot", "remover", "excluir hotspot"],
    relatedArticles: [
      "criando-um-hotspot",
      "como-substituir-uma-imagem",
    ],
    blocks: [
      paragraph(
        "Com Gerenciar hotspots ativo, abra o painel da imagem para ver os pontos existentes.",
      ),
      unorderedList([
        "Edite título e descrição de um hotspot de informação.",
        "Altere o destino de um hotspot de navegação.",
        "Remova o hotspot que não for mais necessário.",
      ]),
      note(
        "Substituir o arquivo da imagem não apaga os hotspots, mas eles podem precisar de reposicionamento se a câmera mudou.",
      ),
    ],
  }),
];
