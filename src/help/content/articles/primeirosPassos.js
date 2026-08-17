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

const CATEGORY = "primeiros-passos";

export const PRIMEIROS_PASSOS_ARTICLES = [
  createArticle({
    slug: "o-que-e-o-fivi360",
    category: CATEGORY,
    title: "O que é o FIVI360?",
    description:
      "O FIVI360 é a plataforma para arquitetos e designers apresentarem projetos com imagens panorâmicas 360°.",
    keywords: ["fivi360", "plataforma", "360", "arquitetura"],
    relatedArticles: [
      "criando-sua-conta",
      "criando-seu-primeiro-projeto",
      "o-que-e-uma-imagem-360-equiretangular",
    ],
    blocks: [
      paragraph(
        "O FIVI360 ajuda você a transformar panoramas 360° em apresentações interativas para clientes, sem exigir que eles criem uma conta.",
      ),
      heading("O que você consegue fazer"),
      unorderedList([
        "Organizar ambientes em projetos.",
        "Enviar imagens panorâmicas 360° e visualizá-las no viewer.",
        "Adicionar hotspots de informação e de navegação, quando o plano incluir o recurso.",
        "Compartilhar por link, publicar um portfólio ou incorporar o projeto em um website, conforme as opções disponíveis.",
      ]),
      paragraph(
        "A Central de Ajuda descreve o comportamento atual da plataforma. Recursos podem variar de acordo com o plano vigente.",
      ),
      tip([
        "Se você está começando agora, siga o artigo ",
        helpLink("/ajuda/primeiros-passos/criando-sua-conta", "Criando sua conta"),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "criando-sua-conta",
    category: CATEGORY,
    title: "Criando sua conta",
    description:
      "Crie uma conta no FIVI360, confirme o e-mail e acesse a plataforma.",
    keywords: ["cadastro", "registro", "conta", "e-mail"],
    relatedArticles: [
      "verificacao-de-e-mail",
      "criando-seu-primeiro-projeto",
      "esqueci-minha-senha",
    ],
    blocks: [
      steps([
        {
          title: "Abra a página de cadastro",
          content: [
            "Acesse ",
            helpLink("/register", "Criar conta"),
            " e informe seus dados.",
          ],
        },
        {
          title: "Confirme o e-mail",
          content:
            "Após o cadastro, enviamos um e-mail de verificação. Abra a mensagem e confirme o endereço para ativar o acesso.",
        },
        {
          title: "Entre na plataforma",
          content:
            "Com o e-mail verificado, você acessa o Dashboard para criar projetos e enviar imagens.",
        },
      ]),
      note(
        "Enquanto o e-mail não for confirmado, o acesso ao app permanece bloqueado na etapa de verificação.",
      ),
      tip([
        "Já tem conta? Use ",
        helpLink("/login", "Entrar"),
        ". Se esqueceu a senha, veja ",
        helpLink("/ajuda/conta-e-configuracoes/esqueci-minha-senha", "Esqueci minha senha"),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "criando-seu-primeiro-projeto",
    category: CATEGORY,
    title: "Criando seu primeiro projeto",
    description:
      "Crie um projeto para organizar ambientes, imagens 360° e o compartilhamento com o cliente.",
    keywords: ["projeto", "criar", "primeiro"],
    relatedArticles: [
      "criar-um-projeto",
      "adicionando-sua-primeira-imagem-360",
      "visibilidade-do-projeto",
    ],
    blocks: [
      paragraph(
        "Um projeto reúne os ambientes de um trabalho — por exemplo, uma residência ou um escritório — para você apresentar o conjunto em 360°.",
      ),
      steps([
        {
          title: "Abra Projetos",
          content: "No menu, acesse Projetos e escolha criar um novo projeto.",
        },
        {
          title: "Preencha as informações",
          content:
            "Informe o título (obrigatório). Cliente e descrição são opcionais e ajudam a identificar o trabalho.",
        },
        {
          title: "Defina a visibilidade",
          content:
            "O padrão é Privado. Você pode alterar depois, ao editar o projeto ou ao compartilhar.",
        },
      ]),
      note(
        "A quantidade de projetos disponíveis depende do seu plano. Se o limite for atingido, a criação fica bloqueada até liberar espaço ou alterar o plano.",
      ),
    ],
  }),

  createArticle({
    slug: "adicionando-sua-primeira-imagem-360",
    category: CATEGORY,
    title: "Adicionando sua primeira imagem 360°",
    description:
      "Envie um panorama equirectangular para o projeto e veja a prévia antes de confirmar.",
    keywords: ["upload", "imagem", "360", "panorama"],
    relatedArticles: [
      "como-adicionar-uma-imagem-360",
      "como-preparar-sua-imagem-para-o-fivi360",
      "visualizando-seu-projeto",
    ],
    blocks: [
      paragraph(
        "Você pode adicionar uma imagem 360° a partir do próprio projeto ou da área de Imagens.",
      ),
      steps([
        {
          title: "Escolha o arquivo",
          content:
            "Use um panorama em JPG, PNG ou WEBP. O FIVI360 mostra uma prévia 360° antes de confirmar o envio.",
        },
        {
          title: "Revise o título",
          content:
            "O título é sugerido a partir do nome do arquivo. Ajuste se quiser um nome mais claro para o ambiente.",
        },
        {
          title: "Confirme o envio",
          content:
            "Depois do upload, a imagem entra no projeto e pode ser aberta no viewer.",
        },
      ]),
      tip([
        "Antes de exportar o render, leia ",
        helpLink(
          "/ajuda/imagens-360/como-preparar-sua-imagem-para-o-fivi360",
          "Como preparar sua imagem para o FIVI360",
        ),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "visualizando-seu-projeto",
    category: CATEGORY,
    title: "Visualizando seu projeto",
    description:
      "Abra o viewer 360° para explorar o panorama, girar a cena e, quando houver, usar hotspots.",
    keywords: ["viewer", "visualizar", "panorama"],
    relatedArticles: [
      "o-que-sao-hotspots",
      "como-compartilhar-um-projeto",
      "adicionando-sua-primeira-imagem-360",
    ],
    blocks: [
      paragraph(
        "No projeto, abra uma imagem para entrar no viewer. Arraste para olhar ao redor, como se estivesse dentro do ambiente.",
      ),
      unorderedList([
        "No computador, use o mouse para girar a cena.",
        "No celular, arraste com o dedo. O viewer é adaptado para tela touch.",
        "Se o projeto tiver mais de um ambiente, você pode navegar entre as imagens do mesmo projeto.",
      ]),
      paragraph(
        "Hotspots de informação e de navegação aparecem no viewer quando o recurso está disponível no seu plano e já foi configurado.",
      ),
      note(
        "Para mostrar o projeto a um cliente, use o compartilhamento por link. O visitante não precisa de conta.",
      ),
    ],
  }),
];
