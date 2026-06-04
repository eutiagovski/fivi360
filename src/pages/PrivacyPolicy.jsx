import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS = [
  { id: "introducao", label: "Introdução" },
  { id: "dados-coletados", label: "Dados que coletamos" },
  { id: "como-usamos", label: "Como usamos os dados" },
  { id: "dados-usuario", label: "Dados enviados por você" },
  { id: "projetos-publicos", label: "Projetos e links públicos" },
  { id: "armazenamento", label: "Armazenamento" },
  { id: "compartilhamento", label: "Compartilhamento" },
  { id: "cookies", label: "Cookies" },
  { id: "seguranca", label: "Segurança" },
  { id: "retencao", label: "Retenção e exclusão" },
  { id: "direitos", label: "Seus direitos (LGPD)" },
  { id: "exclusao-conta", label: "Exclusão de conta" },
  { id: "alteracoes", label: "Alterações nesta política" },
  { id: "contato", label: "Contato" },
];

const CONTACT_EMAIL = "contato@fivi360.com.br";

export function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      sections={SECTIONS}
      lastUpdated="3 de junho de 2026"
    >
      <LegalSection id="introducao" title="1. Introdução">
        <p>
          Esta Política de Privacidade explica como o FIVI360 trata dados pessoais
          quando você usa nosso site e aplicativo. Buscamos linguagem clara e
          alinhamento com a Lei Geral de Proteção de Dados (LGPD).
        </p>
        <p>
          Ao usar o FIVI360, você entende as práticas descritas aqui. Para
          exercer seus direitos ou tirar dúvidas, use o contato no final desta
          página.
        </p>
      </LegalSection>

      <LegalSection id="dados-coletados" title="2. Dados que coletamos">
        <p>Podemos tratar as seguintes categorias de dados:</p>
        <ul>
          <li>
            <strong className="text-white font-normal">Cadastro e conta:</strong>{" "}
            nome, e-mail e senha (gerenciada pelo Firebase Authentication, sem que
            armazenemos sua senha em texto legível).
          </li>
          <li>
            <strong className="text-white font-normal">Perfil:</strong> nome do
            escritório, bio pública, links de redes sociais, slug do portfólio e
            foto ou logo, quando você informar.
          </li>
          <li>
            <strong className="text-white font-normal">Conteúdo profissional:</strong>{" "}
            projetos, imagens panorâmicas 360°, hotspots, títulos, descrições e
            configurações de visibilidade.
          </li>
          <li>
            <strong className="text-white font-normal">Uso e técnico:</strong>{" "}
            registros necessários ao funcionamento, segurança e melhoria do serviço
            (por exemplo, data de criação de registros, identificadores de sessão e
            metadados de upload).
          </li>
        </ul>
        <p>
          Nesta versão não utilizamos ferramentas de analytics de marketing, pixels
          de remarketing nem cookies de publicidade.
        </p>
      </LegalSection>

      <LegalSection id="como-usamos" title="3. Como usamos os dados">
        <p>Tratamos dados pessoais para finalidades como:</p>
        <ul>
          <li>autenticar você e manter sua sessão segura;</li>
          <li>permitir o funcionamento da plataforma e do painel;</li>
          <li>armazenar, processar e exibir seus projetos e imagens 360°;</li>
          <li>gerar links de compartilhamento e portfólio público, conforme suas configurações;</li>
          <li>prestar suporte e responder solicitações;</li>
          <li>proteger a plataforma contra fraudes e acessos indevidos;</li>
          <li>melhorar estabilidade, desempenho e experiência de uso.</li>
        </ul>
        <p>
          A base legal varia conforme o caso: execução do contrato ou do serviço
          solicitado, legítimo interesse (segurança e melhoria), cumprimento de
          obrigação legal e, quando aplicável, seu consentimento.
        </p>
      </LegalSection>

      <LegalSection id="dados-usuario" title="4. Dados enviados pelo usuário">
        <p>
          Informações e arquivos que você envia são armazenados para que você possa
          editar, organizar e apresentar seus projetos. Você decide o que publicar e
          quais campos preencher no perfil.
        </p>
        <p>
          Não vendemos seus dados pessoais. Não compartilhamos seus dados com
          terceiros para fins de marketing nesta versão do produto.
        </p>
      </LegalSection>

      <LegalSection id="projetos-publicos" title="5. Projetos, imagens e links públicos">
        <p>
          Quando você marca projetos, imagens ou portfólio como públicos ou gera
          links de compartilhamento, o conteúdo configurado pode ser acessado por
          qualquer pessoa que possua o link ou visite seu perfil público.
        </p>
        <p>
          Esse acesso ocorre fora do ambiente logado e pode incluir visualização de
          imagens, hotspots e informações que você associou à apresentação pública.
        </p>
      </LegalSection>

      <LegalSection id="armazenamento" title="6. Armazenamento e infraestrutura">
        <p>
          Utilizamos serviços do Google Firebase, que podem processar dados em
          infraestrutura na nuvem, incluindo:
        </p>
        <ul>
          <li>
            <strong className="text-white font-normal">Firebase Authentication</strong>{" "}
            — login, e-mail e gestão de credenciais;
          </li>
          <li>
            <strong className="text-white font-normal">Cloud Firestore</strong> — dados
            de perfil, projetos, hotspots e metadados;
          </li>
          <li>
            <strong className="text-white font-normal">Firebase Storage</strong> — arquivos
            de imagens panorâmicas e mídias enviadas por você.
          </li>
        </ul>
        <p>
          O Firebase atua como operador de infraestrutura na medida em que processa
          dados em nosso nome, conforme seus termos e políticas aplicáveis.
        </p>
      </LegalSection>

      <LegalSection id="compartilhamento" title="7. Compartilhamento de dados">
        <p>Além do que você torna público por link ou portfólio, podemos compartilhar dados:</p>
        <ul>
          <li>
            com provedores de infraestrutura (como o Firebase) para operar o serviço;
          </li>
          <li>
            quando exigido por lei, ordem judicial ou autoridade competente;
          </li>
          <li>
            para proteger direitos, segurança e integridade do FIVI360 e de usuários.
          </li>
        </ul>
        <p>
          Você tem direito a solicitar informações sobre compartilamentos que não
          sejam óbvios pelo uso normal da plataforma — veja a seção de direitos
          abaixo.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="8. Cookies e tecnologias semelhantes">
        <p>
          Podemos usar cookies ou armazenamento local estritamente necessários ao
          funcionamento, como manter sua sessão de login e preferências essenciais.
        </p>
        <p>
          <strong className="text-white font-normal">
            Não utilizamos cookies de marketing, remarketing ou publicidade
          </strong>{" "}
          nesta versão do FIVI360.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="9. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais razoáveis para proteger dados,
          incluindo comunicação criptografada (HTTPS), regras de acesso no Firebase e
          boas práticas de desenvolvimento.
        </p>
        <p>
          Nenhum sistema é totalmente imune a riscos. Se identificarmos incidente
          relevante que afete seus dados, buscaremos agir conforme a lei e, quando
          cabível, comunicar você e a autoridade competente.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="10. Retenção e exclusão de dados">
        <p>
          Mantemos dados enquanto sua conta estiver ativa e pelo tempo necessário às
          finalidades descritas nesta política, inclusive obrigações legais e
          resolução de disputas.
        </p>
        <p>
          Após exclusão da conta ou pedido de eliminação, removeremos ou
          anonimizaremos dados quando possível, ressalvados backups técnicos de curto
          prazo e registros que a lei exija conservar.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="11. Direitos do titular dos dados">
        <p>
          Nos termos da LGPD e orientações da Autoridade Nacional de Proteção de
          Dados (ANPD), você pode solicitar, entre outros:
        </p>
        <ul>
          <li>confirmação de que tratamos seus dados;</li>
          <li>acesso aos dados que mantemos sobre você;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            exclusão de dados desnecessários, excessivos ou tratados em
            desconformidade com a lei;
          </li>
          <li>anonimização, bloqueio ou eliminação de dados, quando cabível;</li>
          <li>portabilidade dos dados a outro fornecedor, quando aplicável;</li>
          <li>revogação do consentimento, quando o tratamento se basear nele;</li>
          <li>
            informação sobre entidades com as quais compartilhamos dados e sobre a
            possibilidade de não consentir e suas consequências.
          </li>
        </ul>
        <p>
          Para exercer esses direitos, envie um e-mail para{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> com assunto claro
          (por exemplo, &quot;Direitos LGPD&quot;) e dados que permitam identificar sua
          conta. Responderemos em prazo razoável, conforme a legislação.
        </p>
      </LegalSection>

      <LegalSection id="exclusao-conta" title="12. Exclusão de conta">
        <p>
          Você pode excluir sua conta pelas configurações do app, quando o recurso
          estiver disponível na sua versão. A exclusão inicia o processo de remoção
          dos dados vinculados à conta, observadas retenções legais e backups
          técnicos mencionados acima.
        </p>
        <p>
          A exclusão não apaga automaticamente cópias que terceiros tenham obtido
          por links públicos antes do pedido.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="13. Alterações nesta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço, na
          legislação ou em nossas práticas. A data da última atualização aparece no
          topo da página. Alterações relevantes podem ser destacadas no app ou por
          e-mail, quando apropriado.
        </p>
      </LegalSection>

      <LegalSection id="contato" title="14. Contato">
        <p>
          O FIVI360 é o responsável pelo tratamento dos dados descritos nesta
          política, na medida aplicável. Para dúvidas, solicitações de direitos ou
          reclamações:
        </p>
        <p>
          E-mail:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>
          Você também pode registrar reclamação junto à ANPD se entender que seus
          direitos não foram atendidos de forma adequada.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
