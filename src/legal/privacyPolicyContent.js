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

export const PRIVACY_POLICY_CONTENT = {
  title: "Política de Privacidade",
  version: LEGAL_VERSIONS.privacyVersion,
  lastUpdated: "17 de agosto de 2026",
  sections: [
    {
      id: "introducao",
      title: "1. Introdução e âmbito",
      label: "Introdução e âmbito",
      blocks: [
        paragraph(
          "Esta Política de Privacidade explica como o ",
          productName,
          " trata dados pessoais quando você acessa ou usa o site, o aplicativo autenticado, as landing pages, as páginas de compartilhamento, o portfólio público, o Embed e os demais recursos públicos da plataforma.",
        ),
        paragraph(
          "O ",
          productName,
          " é um produto da ",
          legalName,
          ", inscrita no CNPJ ",
          cnpj,
          ". Buscamos linguagem clara e alinhamento com a Lei Geral de Proteção de Dados (LGPD).",
        ),
      ],
    },
    {
      id: "responsavel",
      title: "2. Quem é o responsável",
      label: "Quem é o responsável",
      blocks: [
        paragraph(
          "A ",
          legalName,
          ", CNPJ ",
          cnpj,
          ", é a pessoa jurídica responsável pela operação do ",
          productName,
          " e, quando aplicável, pelo tratamento dos dados pessoais descritos nesta Política.",
        ),
        paragraph(
          "Para dúvidas, solicitações de direitos ou comunicações relacionadas a esta Política, utilize o e-mail ",
          contact,
          ".",
        ),
      ],
    },
    {
      id: "dados-coletados",
      title: "3. Dados que coletamos",
      label: "Dados que coletamos",
      blocks: [
        paragraph("Podemos tratar as seguintes categorias de dados:"),
        unorderedList([
          [
            emphasis("Conta e autenticação:"),
            " nome, e-mail e credenciais de acesso. O cadastro pode ocorrer por e-mail e senha ou por provedores de autenticação disponibilizados, como o Google. A autenticação é operada pelo Firebase Authentication; os dados de perfil da conta são armazenados no serviço do ",
            productName,
            ". Não armazenamos sua senha em texto legível.",
          ],
          [
            emphasis("Dados técnicos de autenticação:"),
            " informações necessárias para manter a sessão, identificar o provedor de login utilizado e proteger o acesso à conta.",
          ],
          [
            emphasis("Perfil:"),
            " nome do escritório, biografia, links sociais, slug do portfólio, preferências da conta e demais campos que você informar no produto.",
          ],
          [
            emphasis("Conteúdo profissional:"),
            " projetos, nome do cliente quando informado, imagens panorâmicas 360°, títulos, descrições, hotspots, configurações, links, portfólio e configurações de Embed.",
          ],
          [
            emphasis("Pré-lançamento e campanhas:"),
            " dados informados em formulários de acesso antecipado, descritos na seção específica desta Política.",
          ],
          [
            emphasis("Uso e técnico:"),
            " registros necessários ao funcionamento, à segurança e à operação do serviço, como datas de criação de registros, identificadores técnicos da conta e metadados de envio de arquivos.",
          ],
        ]),
      ],
    },
    {
      id: "como-usamos",
      title: "4. Como utilizamos os dados",
      label: "Como utilizamos os dados",
      blocks: [
        paragraph("Tratamos dados pessoais para finalidades como:"),
        unorderedList([
          "autenticar você e manter sua sessão;",
          "permitir o funcionamento da plataforma, do painel e do Viewer;",
          "armazenar, processar, converter e exibir seus projetos e imagens 360°;",
          "gerar compartilhamento por link, portfólio público e Embed, conforme as configurações que você escolher;",
          "administrar campanhas de acesso antecipado e identificar a origem do cadastro na campanha;",
          "enviar comunicações operacionais necessárias ao serviço;",
          "enviar comunicações de marketing somente quando houver consentimento específico;",
          "prestar suporte e responder solicitações;",
          "proteger a plataforma contra fraudes, abusos e acessos indevidos;",
          "manter estatísticas agregadas de uso de recursos públicos, como visualizações de portfólio, de projetos e de experiências 360°, sem o objetivo de construir um perfil detalhado do visitante.",
        ]),
        paragraph(
          "A base legal varia conforme o caso: execução do contrato ou do serviço solicitado, legítimo interesse (segurança e operação), cumprimento de obrigação legal e, quando aplicável, seu consentimento.",
        ),
      ],
    },
    {
      id: "conteudo-enviado",
      title: "5. Conteúdo enviado pelo usuário",
      label: "Conteúdo enviado pelo usuário",
      blocks: [
        paragraph(
          "Os arquivos, textos, imagens, hotspots e configurações que você envia são tratados para fornecer o serviço: organizar projetos, processar imagens, apresentar experiências 360° e disponibilizar o conteúdo nos recursos que você escolher, inclusive Viewer, compartilhamento, portfólio e Embed.",
        ),
        paragraph(
          "Você decide o que preencher no perfil e o que publicar. Não vendemos seus dados pessoais.",
        ),
      ],
    },
    {
      id: "conteudo-publico",
      title: "6. Conteúdo público, links, portfólio e Embed",
      label: "Conteúdo público, links, portfólio e Embed",
      blocks: [
        paragraph(
          "A visibilidade do conteúdo depende das opções que você configura no produto:",
        ),
        unorderedList([
          [
            emphasis("Privado:"),
            " acesso interno da sua conta.",
          ],
          [
            emphasis("Compartilhado por link:"),
            " qualquer pessoa que possua o URL pode acessar o conteúdo conforme a configuração.",
          ],
          [
            emphasis("Público:"),
            " o conteúdo pode aparecer no portfólio público quando essa opção estiver disponível e habilitada.",
          ],
          [
            emphasis("Portfólio:"),
            " superfície pública associada ao seu perfil, quando disponível no seu plano e ativada por você.",
          ],
          [
            emphasis("Embed:"),
            " você pode permitir a incorporação do projeto em site de terceiros.",
          ],
        ]),
        paragraph(
          "Sites de terceiros que incorporam ou exibem o conteúdo não são controlados pelo ",
          productName,
          ". Links podem ser reencaminhados por quem os recebeu. Cópias feitas por terceiros fora da plataforma não podem necessariamente ser removidas depois.",
        ),
        paragraph(
          "O ",
          productName,
          " não afirma indexação automática do conteúdo por mecanismos de busca.",
        ),
      ],
    },
    {
      id: "pre-lancamento",
      title: "7. Pré-lançamento e campanhas",
      label: "Pré-lançamento e campanhas",
      blocks: [
        paragraph(
          "Quando você preenche um formulário de acesso antecipado ou campanha semelhante, podemos coletar nome, e-mail, WhatsApp, profissão, consentimento de marketing, identificador da campanha, parâmetros de origem da campanha (como UTMs), página de origem (referrer) e o caminho da landing page (landingPath).",
        ),
        paragraph("Esses dados são usados para:"),
        unorderedList([
          "administrar o acesso antecipado;",
          "identificar a origem da campanha;",
          "entrar em contato sobre o lançamento e o serviço;",
          "enviar comunicações de marketing apenas quando houver consentimento específico.",
        ]),
        paragraph(
          "O envio do formulário não implica inscrição automática em grupo de WhatsApp.",
        ),
        paragraph(
          "Parâmetros de campanha e a origem do acesso podem ser registrados no momento do envio do formulário. Esses parâmetros não são cookies e não constituem coleta de perfilamento do dispositivo.",
        ),
      ],
    },
    {
      id: "comunicacoes",
      title: "8. Comunicações e marketing",
      label: "Comunicações e marketing",
      blocks: [
        paragraph(
          emphasis("Comunicações operacionais."),
          " Podemos enviar mensagens necessárias ao funcionamento do serviço, como verificação de e-mail, recuperação de senha, avisos sobre a conta, informações necessárias à operação e, quando houver, avisos de cobrança. Essas comunicações não dependem de consentimento de marketing.",
        ),
        paragraph(
          emphasis("Marketing."),
          " Comunicações promocionais ou de novidades são enviadas somente quando houver opt-in específico e independente. O consentimento de marketing é opcional.",
        ),
        paragraph(
          "Enquanto não houver mecanismo próprio no aplicativo para revogar esse consentimento, você pode solicitar a interrupção das comunicações de marketing pelo e-mail ",
          contact,
          ".",
        ),
      ],
    },
    {
      id: "cookies",
      title: "9. Cookies e tecnologias semelhantes",
      label: "Cookies e tecnologias semelhantes",
      blocks: [
        paragraph(
          "O ",
          productName,
          " pode utilizar tecnologias locais do navegador necessárias para manter a sessão autenticada, preservar estados temporários, lembrar dicas de interface e permitir o funcionamento da aplicação.",
        ),
        paragraph(
          "Essas tecnologias incluem armazenamento técnico do navegador. Não se trata, neste momento, de cookies próprios de publicidade.",
        ),
        paragraph(
          "No primeiro go-live público, não há cookies próprios de publicidade e ferramentas analíticas não essenciais estão desativadas. O ",
          productName,
          " poderá adotar ferramentas de medição e analytics no futuro; caso tecnologias não essenciais sejam ativadas, esta Política e os mecanismos aplicáveis serão atualizados. Esta cláusula não constitui consentimento amplo para tecnologias futuras.",
        ),
        paragraph(
          "As estatísticas agregadas de recursos públicos mencionadas nesta Política são próprias do ",
          productName,
          " e não se confundem com ferramentas de analytics de terceiros.",
        ),
      ],
    },
    {
      id: "prestadores",
      title: "10. Prestadores de serviço e infraestrutura",
      label: "Prestadores de serviço e infraestrutura",
      blocks: [
        paragraph(
          "Utilizamos prestadores para operar o serviço. Conforme o uso real da plataforma, podem incluir:",
        ),
        unorderedList([
          [
            emphasis("Google / Firebase:"),
            " Authentication, Firestore, Storage, Cloud Functions e Hosting.",
          ],
          [
            emphasis("Google Sign-In:"),
            " quando você opta por entrar com Google.",
          ],
          [
            emphasis("Google Fonts:"),
            " tipografias podem ser carregadas a partir de servidores externos do Google Fonts para exibir as páginas.",
          ],
          [
            emphasis("Resend:"),
            " envio de e-mails transacionais e demais mensagens disparadas pelo serviço.",
          ],
          [
            emphasis("Stripe:"),
            " quando planos pagos e cobrança forem disponibilizados, o processamento de pagamentos poderá ser realizado por provedor externo. Dados completos de cartão são tratados pelo provedor de pagamento e não são armazenados pelo ",
            productName,
            ".",
          ],
        ]),
        paragraph(
          "Além do que você torna público por link, portfólio ou Embed, podemos compartilhar dados com esses prestadores na medida necessária à operação, quando exigido por lei, ordem judicial ou autoridade competente, ou para proteger direitos, segurança e integridade do ",
          productName,
          " e de usuários.",
        ),
      ],
    },
    {
      id: "retencao",
      title: "11. Retenção e exclusão",
      label: "Retenção e exclusão",
      blocks: [
        paragraph(
          "Mantemos dados enquanto forem necessários às finalidades descritas nesta Política.",
        ),
        paragraph(
          "Dados poderão ser conservados quando necessários para cumprimento de obrigações legais, exercício de direitos e segurança da plataforma.",
        ),
        paragraph(
          "Pedidos de eliminação serão analisados conforme a LGPD e as limitações aplicáveis, inclusive quando a conservação for exigida ou justificada por lei.",
        ),
      ],
    },
    {
      id: "seguranca",
      title: "12. Segurança",
      label: "Segurança",
      blocks: [
        paragraph(
          "Adotamos medidas técnicas e organizacionais razoáveis para proteger dados, incluindo comunicação criptografada (HTTPS), controles de acesso e o uso da infraestrutura Firebase, além de boas práticas de desenvolvimento.",
        ),
        paragraph(
          "Nenhum sistema é imune a riscos. Se identificarmos incidente relevante que afete seus dados, buscaremos agir conforme a lei e, quando cabível, comunicar você e a autoridade competente.",
        ),
      ],
    },
    {
      id: "direitos",
      title: "13. Direitos do titular",
      label: "Direitos do titular",
      blocks: [
        paragraph(
          "Nos termos da LGPD e orientações da Autoridade Nacional de Proteção de Dados (ANPD), você pode solicitar, entre outros:",
        ),
        unorderedList([
          "confirmação de que tratamos seus dados;",
          "acesso aos dados que mantemos sobre você;",
          "correção de dados incompletos, inexatos ou desatualizados;",
          "exclusão de dados desnecessários, excessivos ou tratados em desconformidade com a lei;",
          "anonimização, bloqueio ou eliminação de dados, quando cabível;",
          "portabilidade dos dados a outro fornecedor, quando aplicável;",
          "revogação do consentimento, quando o tratamento se basear nele;",
          "informação sobre entidades com as quais compartilhamos dados e sobre a possibilidade de não consentir e suas consequências.",
        ]),
        paragraph(
          "Para exercer esses direitos, envie um e-mail para ",
          contact,
          " com assunto claro (por exemplo, \"Direitos LGPD\") e informações que permitam identificar sua conta ou o pedido. Responderemos em prazo razoável, conforme a legislação.",
        ),
      ],
    },
    {
      id: "exclusao-conta",
      title: "14. Exclusão de conta e conteúdo",
      label: "Exclusão de conta e conteúdo",
      blocks: [
        paragraph(
          "Projetos e imagens podem ser excluídos dentro do produto, conforme os recursos disponíveis na sua conta.",
        ),
        paragraph(
          "A exclusão da conta, neste momento, deve ser solicitada pelo e-mail ",
          contact,
          ". Solicitações de eliminação de dados pessoais também podem ser feitas pelo mesmo canal.",
        ),
        paragraph(
          "A exclusão na plataforma não apaga automaticamente cópias que terceiros tenham obtido por links, portfólio, Embed ou outros meios antes do pedido.",
        ),
      ],
    },
    {
      id: "menores",
      title: "15. Pessoas menores de 18 anos",
      label: "Pessoas menores de 18 anos",
      blocks: [
        paragraph(
          "O ",
          productName,
          " é destinado a pessoas com 18 anos ou mais.",
        ),
        paragraph(
          "Não coletamos documento para comprovar idade. Se tomarmos conhecimento de uso por pessoa menor de 18 anos, poderemos adotar as medidas adequadas, inclusive encerrar o acesso associado.",
        ),
      ],
    },
    {
      id: "alteracoes",
      title: "16. Alterações desta Política",
      label: "Alterações desta Política",
      blocks: [
        paragraph(
          "Podemos atualizar esta Política para refletir mudanças no serviço, na legislação ou em nossas práticas. A data da última atualização e a versão são informadas nesta página.",
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
          "O responsável pelo tratamento dos dados descritos nesta Política, na medida aplicável, é a ",
          legalName,
          ", CNPJ ",
          cnpj,
          ", no contexto da operação do produto ",
          productName,
          ".",
        ),
        paragraph("E-mail: ", contact),
        paragraph(
          "Você também pode registrar reclamação junto à ANPD se entender que seus direitos não foram atendidos de forma adequada.",
        ),
        paragraph(
          "Os Termos de Uso da plataforma estão disponíveis em ",
          legalLink("/termos", "Termos de Uso"),
          ".",
        ),
      ],
    },
  ],
};
