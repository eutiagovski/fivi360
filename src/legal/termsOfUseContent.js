import { LEGAL_VERSIONS } from "@/config/legal";
import {
  emphasis,
  legalEmail,
  legalLink,
  paragraph,
  unorderedList,
} from "@/legal/legalDocument";
import { LEGAL_ENTITY } from "@/legal/legalEntity";

const { productName, legalName, cnpj } = LEGAL_ENTITY;
const contact = legalEmail();

export const TERMS_OF_USE_CONTENT = {
  title: "Termos de Uso",
  version: LEGAL_VERSIONS.termsVersion,
  lastUpdated: "17 de agosto de 2026",
  sections: [
    {
      id: "aceitacao",
      title: "1. Aceitação",
      label: "Aceitação",
      blocks: [
        paragraph(
          "Estes Termos de Uso regem o acesso e o uso do ",
          productName,
          ", incluindo o site, o aplicativo autenticado e os recursos públicos da plataforma.",
        ),
        paragraph(
          "Ao criar uma conta ou aceitar uma versão destes Termos no aplicativo, você concorda com as condições aqui descritas. Se não concordar, não utilize o serviço.",
        ),
        paragraph(
          "Usuários autenticados podem ser solicitados a aceitar uma nova versão quando houver mudança material, por meio do mecanismo de aceite da plataforma. Quando o aplicativo exigir um novo aceite explícito, o simples uso continuado não o substitui.",
        ),
      ],
    },
    {
      id: "sobre",
      title: "2. Sobre o FIVI360",
      label: "Sobre o FIVI360",
      blocks: [
        paragraph(
          "O ",
          productName,
          " é uma plataforma digital para arquitetos, designers e profissionais relacionados organizarem projetos, publicar imagens panorâmicas 360°, configurar hotspots e compartilhar trabalhos por link, portfólio público ou Embed, conforme os recursos disponíveis.",
        ),
        paragraph(
          "O ",
          productName,
          " é um produto da ",
          legalName,
          ", inscrita no CNPJ ",
          cnpj,
          ".",
        ),
        paragraph(
          "O serviço é oferecido em evolução contínua; funcionalidades, limites e interfaces podem mudar conforme melhorias e manutenção.",
        ),
      ],
    },
    {
      id: "cadastro",
      title: "3. Cadastro e conta",
      label: "Cadastro e conta",
      blocks: [
        paragraph(
          "O uso da plataforma é destinado a pessoas com 18 anos ou mais.",
        ),
        paragraph(
          "Para usar recursos da conta, você precisa se cadastrar com informações verdadeiras e mantê-las atualizadas. O cadastro e a autenticação podem ocorrer por e-mail e senha ou por provedores de autenticação disponibilizados, como o Google.",
        ),
        paragraph(
          "Determinadas contas podem exigir verificação de e-mail antes do uso pleno de alguns recursos.",
        ),
        paragraph(
          "Você é responsável por guardar suas credenciais e por toda atividade realizada na sua conta. Não compartilhe sua senha ou acesso com terceiros. Se suspeitar de uso indevido, altere a senha e entre em contato conosco.",
        ),
      ],
    },
    {
      id: "planos",
      title: "4. Planos, recursos e limites",
      label: "Planos, recursos e limites",
      blocks: [
        paragraph(
          "O ",
          productName,
          " pode oferecer diferentes planos, com recursos, limites e valores distintos.",
        ),
        paragraph(
          "Os recursos, limites e valores aplicáveis são aqueles apresentados na página de planos vigente no produto.",
        ),
      ],
    },
    {
      id: "cobranca",
      title: "5. Cobrança, quando disponibilizada",
      label: "Cobrança, quando disponibilizada",
      blocks: [
        paragraph(
          "Poderão existir planos pagos. Quando planos pagos e cobrança forem disponibilizados, as condições comerciais e o valor serão apresentados antes da contratação.",
        ),
        paragraph(
          "A cobrança poderá ocorrer por provedor de pagamento externo. Condições relevantes, inclusive forma de pagamento e demais informações aplicáveis, serão apresentadas no momento da contratação.",
        ),
      ],
    },
    {
      id: "conteudo-usuario",
      title: "6. Conteúdo do usuário",
      label: "Conteúdo do usuário",
      blocks: [
        paragraph(
          "Você continua dono do conteúdo que envia ao ",
          productName,
          ", incluindo imagens, projetos, textos, hotspots, links e demais materiais.",
        ),
        paragraph(
          "Ao usar a plataforma, você concede ao ",
          productName,
          " uma licença limitada, não exclusiva e revogável para hospedar, armazenar, processar, converter, comprimir, otimizar, transmitir, exibir e disponibilizar seus conteúdos somente na medida necessária para fornecer os recursos que você escolher, inclusive Viewer, compartilhamento (Share), portfólio e Embed.",
        ),
        paragraph(
          "Você declara possuir direitos ou autorização suficiente sobre imagens, renders, projetos, textos, marcas, logos, informações de clientes e demais materiais que enviar ou publicar. Você assume a responsabilidade pelo conteúdo perante terceiros.",
        ),
      ],
    },
    {
      id: "publicacao",
      title: "7. Publicação, compartilhamento, portfólio e Embed",
      label: "Publicação, compartilhamento, portfólio e Embed",
      blocks: [
        paragraph(
          "Você é responsável por escolher corretamente a visibilidade do seu conteúdo. De forma conceitual:",
        ),
        unorderedList([
          [
            emphasis("Privado:"),
            " acesso interno da sua conta.",
          ],
          [
            emphasis("Compartilhado por link (Share):"),
            " quem possuir o URL pode acessar o conteúdo conforme a configuração.",
          ],
          [
            emphasis("Público:"),
            " o conteúdo pode ser acessado publicamente e, quando permitido, aparecer no portfólio.",
          ],
          [
            emphasis("Portfólio:"),
            " superfície pública do seu perfil, quando disponível e ativada.",
          ],
          [
            emphasis("Embed:"),
            " você pode permitir a incorporação do projeto em sites de terceiros.",
          ],
        ]),
        paragraph(
          "Links compartilháveis podem ser reenviados por quem os recebeu. Revise as configurações de visibilidade antes de divulgar URLs.",
        ),
        paragraph(
          "O site externo que incorpora o Embed não é controlado pelo ",
          productName,
          ". A exclusão ou desativação do projeto pode interromper o conteúdo incorporado. A perda de acesso ao recurso conforme o plano também pode afetar o Embed.",
        ),
      ],
    },
    {
      id: "processamento-imagens",
      title: "8. Processamento técnico de imagens",
      label: "Processamento técnico de imagens",
      blocks: [
        paragraph(
          "O serviço pode processar, converter, comprimir e otimizar arquivos enviados para adequá-los ao Viewer e à operação da plataforma.",
        ),
        paragraph(
          "Recomendamos que você mantenha cópia dos arquivos originais importantes. O ",
          productName,
          " não se compromete a conservar o arquivo-fonte original após o processamento.",
        ),
      ],
    },
    {
      id: "uso-aceitavel",
      title: "9. Uso aceitável",
      label: "Uso aceitável",
      blocks: [
        paragraph(
          "Você pode usar o ",
          productName,
          " para fins profissionais e legítimos, incluindo criar e gerenciar projetos e imagens 360°, configurar hotspots, compartilhar conteúdos conforme as opções de visibilidade e manter um portfólio ou Embed, quando disponíveis no seu plano.",
        ),
        paragraph("É proibido, entre outros:"),
        unorderedList([
          "violar leis, direitos de terceiros ou estes Termos;",
          "enviar conteúdo ilegal, ofensivo, discriminatório ou que viole a privacidade de outras pessoas;",
          "usar conteúdo sem autorização suficiente, inclusive imagens, marcas, logos e informações de clientes;",
          "violar propriedade intelectual de terceiros;",
          "tentar acessar contas, dados ou sistemas sem autorização;",
          "compartilhar indevidamente credenciais de acesso;",
          "tentar contornar limitações de plano, cotas ou controles da plataforma;",
          "utilizar automação abusiva ou explorar indevidamente a infraestrutura;",
          "sobrecarregar, interferir ou comprometer a segurança do serviço;",
          "usar o serviço para spam, fraude ou distribuição de malware.",
        ]),
      ],
    },
    {
      id: "propriedade",
      title: "10. Propriedade intelectual",
      label: "Propriedade intelectual",
      blocks: [
        paragraph(
          "A marca ",
          productName,
          ", o software, o design da interface, o Viewer, os textos institucionais e demais elementos da plataforma pertencem ao ",
          productName,
          " ou a seus licenciadores, salvo o conteúdo enviado por usuários.",
        ),
        paragraph(
          "Estes Termos não transferem a você qualquer direito de propriedade sobre a plataforma, apenas o direito de uso conforme descrito aqui. Bibliotecas e componentes de terceiros continuam submetidos às respectivas licenças.",
        ),
      ],
    },
    {
      id: "disponibilidade",
      title: "11. Disponibilidade",
      label: "Disponibilidade",
      blocks: [
        paragraph(
          "Buscamos manter o ",
          productName,
          " disponível de forma estável, mas não garantimos funcionamento ininterrupto, isento de erros ou sujeito a acordo de nível de serviço (SLA).",
        ),
        paragraph(
          "Manutenções, atualizações, falhas de infraestrutura, indisponibilidade de prestadores de serviço ou eventos fora do nosso controle podem causar interrupções temporárias.",
        ),
      ],
    },
    {
      id: "suspensao",
      title: "12. Suspensão e encerramento",
      label: "Suspensão e encerramento",
      blocks: [
        paragraph(
          "Podemos suspender ou encerrar o acesso de contas que violem estes Termos, representem risco à plataforma ou a outros usuários, ou quando exigido por lei. Quando possível, informaremos o motivo e daremos chance de esclarecimento, salvo casos graves ou urgentes.",
        ),
        paragraph(
          "Você pode deixar de usar o serviço a qualquer momento, sujeito às regras de exclusão de conta e de retenção descritas nestes Termos e na Política de Privacidade.",
        ),
      ],
    },
    {
      id: "exclusao-conta",
      title: "13. Exclusão de conta",
      label: "Exclusão de conta",
      blocks: [
        paragraph(
          "Para solicitar a exclusão da sua conta, envie um pedido para ",
          contact,
          ".",
        ),
        paragraph(
          "A exclusão da conta e a retenção de dados observarão a Política de Privacidade e as obrigações legais aplicáveis. A exclusão não apaga automaticamente cópias que terceiros tenham obtido por links, portfólio, Embed ou outros meios antes do pedido.",
        ),
      ],
    },
    {
      id: "limitacao",
      title: "14. Limitação de responsabilidade",
      label: "Limitação de responsabilidade",
      blocks: [
        paragraph(
          "O ",
          productName,
          " é fornecido na forma em que está disponível. Na extensão permitida pela lei, não nos responsabilizamos por danos indiretos, lucros cessantes ou perdas decorrentes do uso ou da impossibilidade de uso da plataforma, inclusive em razão de conteúdo enviado pelo usuário, links compartilhados, sites externos que incorporam conteúdo, configurações escolhidas por você ou indisponibilidade de prestadores de serviço.",
        ),
        paragraph(
          "Nada nestes Termos limita direitos irrenunciáveis previstos em lei, inclusive aos consumidores quando aplicável.",
        ),
      ],
    },
    {
      id: "privacidade",
      title: "15. Política de Privacidade",
      label: "Política de Privacidade",
      blocks: [
        paragraph(
          "O tratamento de dados pessoais no ",
          productName,
          " também é disciplinado pela ",
          legalLink("/privacidade", "Política de Privacidade"),
          ".",
        ),
      ],
    },
    {
      id: "alteracoes",
      title: "16. Alterações dos Termos",
      label: "Alterações dos Termos",
      blocks: [
        paragraph(
          "Podemos atualizar estes Termos para refletir mudanças no serviço ou na legislação. A data da última atualização e a versão são informadas nesta página.",
        ),
        paragraph(
          "Mudanças relevantes podem exigir novo aceite no aplicativo. Quando o ",
          productName,
          " solicitar aceite explícito de uma nova versão, o uso continuado não substitui esse aceite.",
        ),
      ],
    },
    {
      id: "contato",
      title: "17. Contato",
      label: "Contato",
      blocks: [
        paragraph(
          "Dúvidas sobre estes Termos podem ser enviadas para ",
          contact,
          ".",
        ),
        paragraph(
          "Responsável pela operação do produto: ",
          legalName,
          ", CNPJ ",
          cnpj,
          ".",
        ),
      ],
    },
  ],
};
