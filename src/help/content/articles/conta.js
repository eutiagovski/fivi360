import {
  heading,
  helpEmail,
  helpLink,
  note,
  paragraph,
  steps,
  tip,
  unorderedList,
} from "@/help/utils/helpBlocks";
import { createArticle } from "@/help/utils/createArticle";
import { HELP_CONTACT_EMAIL, HELP_FORGOT_PASSWORD_PATH } from "@/help/config/help";

const CATEGORY = "conta-e-configuracoes";

export const CONTA_ARTICLES = [
  createArticle({
    slug: "editando-meu-perfil",
    category: CATEGORY,
    title: "Editando meu perfil",
    description:
      "Atualize o nome exibido e os dados pessoais da conta em Configurações.",
    keywords: ["perfil", "nome", "conta"],
    relatedArticles: [
      "configurando-meu-escritorio",
      "verificacao-de-e-mail",
    ],
    blocks: [
      paragraph(
        "Em Configurações, a seção Perfil reúne as informações pessoais da conta, como o nome exibido.",
      ),
      steps([
        {
          title: "Abra Configurações",
          content: "No app, acesse Configurações e permaneça em Perfil.",
        },
        {
          title: "Atualize os campos",
          content: "Altere o nome e salve. O e-mail da conta aparece nesta área para referência.",
        },
      ]),
      heading("Encerrar a conta"),
      paragraph([
        "Não há exclusão automática da conta no app neste momento. Se precisar encerrar o acesso, escreva para ",
        helpEmail(HELP_CONTACT_EMAIL),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "configurando-meu-escritorio",
    category: CATEGORY,
    title: "Configurando meu escritório",
    description:
      "Nome, logo e bio do escritório aparecem no portfólio e nos materiais públicos.",
    keywords: ["escritório", "logo", "bio", "empresa"],
    relatedArticles: [
      "alterando-configuracoes-do-portfolio",
      "configurando-seu-portfolio",
      "editando-meu-perfil",
    ],
    blocks: [
      paragraph(
        "A seção Escritório em Configurações guarda a identidade profissional: nome do escritório, logo e texto de apresentação.",
      ),
      unorderedList([
        "Esses dados alimentam o portfólio público, quando ele estiver ativo.",
        "A logo também pode aparecer em superfícies públicas do FIVI360 ligadas à sua conta.",
      ]),
      tip(
        "Use o nome como o cliente deve reconhecer o escritório. Ele tem prioridade sobre o nome pessoal na página pública.",
      ),
    ],
  }),

  createArticle({
    slug: "alterando-configuracoes-do-portfolio",
    category: CATEGORY,
    title: "Alterando configurações do portfólio",
    description:
      "Slug, redes sociais e interruptor do portfólio público ficam em Configurações.",
    keywords: ["slug", "redes sociais", "portfólio"],
    relatedArticles: [
      "configurando-seu-portfolio",
      "compartilhando-seu-portfolio",
      "configurando-meu-escritorio",
    ],
    blocks: [
      paragraph(
        "Na seção Portfólio público você altera o endereço (slug), liga ou desliga a vitrine e informa redes sociais, site e WhatsApp.",
      ),
      unorderedList([
        "O slug precisa estar livre. O FIVI360 verifica a disponibilidade enquanto você edita.",
        "Redes preenchidas aparecem na página pública.",
        "Desligar o portfólio oculta a vitrine, mesmo que existam projetos Públicos.",
      ]),
      note([
        "Para escolher quais trabalhos entram na vitrine, use a visibilidade de cada projeto. Veja ",
        helpLink(
          "/ajuda/portfolio/escolhendo-projetos-exibidos",
          "Escolhendo projetos exibidos",
        ),
        ".",
      ]),
    ],
  }),

  createArticle({
    slug: "esqueci-minha-senha",
    category: CATEGORY,
    title: "Esqueci minha senha",
    description:
      "Peça um e-mail de redefinição na página de recuperar senha.",
    keywords: ["senha", "redefinir", "esqueci"],
    relatedArticles: [
      "criando-sua-conta",
      "verificacao-de-e-mail",
    ],
    blocks: [
      steps([
        {
          title: "Abra Recuperar senha",
          content: [
            "Na tela de login, siga para ",
            helpLink(HELP_FORGOT_PASSWORD_PATH, "Recuperar senha"),
            ".",
          ],
        },
        {
          title: "Informe o e-mail da conta",
          content: "Enviamos um link para definir uma nova senha.",
        },
        {
          title: "Conclua no e-mail",
          content:
            "Abra a mensagem, defina a nova senha e entre novamente no FIVI360.",
        },
      ]),
      tip(
        "Se a mensagem não chegar, verifique a pasta de spam. O endereço precisa ser o mesmo cadastrado na conta.",
      ),
    ],
  }),

  createArticle({
    slug: "verificacao-de-e-mail",
    category: CATEGORY,
    title: "Verificação de e-mail",
    description:
      "Confirme o endereço de e-mail para liberar o acesso ao app.",
    keywords: ["verificar", "confirmar e-mail", "ativação"],
    relatedArticles: [
      "criando-sua-conta",
      "esqueci-minha-senha",
    ],
    blocks: [
      paragraph(
        "Depois do cadastro, o FIVI360 envia um e-mail com o botão Confirmar e-mail. Sem essa confirmação, o acesso ao Dashboard permanece na etapa de verificação.",
      ),
      unorderedList([
        "Abra a mensagem e confirme o endereço.",
        "Se precisar, solicite o reenvio na tela de verificação. Há um intervalo entre os envios.",
        "Verifique também a pasta de spam.",
      ]),
      note([
        "Se o e-mail não chegar após algumas tentativas, escreva para ",
        helpEmail(HELP_CONTACT_EMAIL),
        ".",
      ]),
    ],
  }),
];
