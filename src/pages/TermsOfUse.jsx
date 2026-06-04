import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS = [
  { id: "aceitacao", label: "Aceitação dos termos" },
  { id: "sobre", label: "Sobre o FIVI360" },
  { id: "cadastro", label: "Cadastro e conta" },
  { id: "uso-permitido", label: "Uso permitido" },
  { id: "conteudo-usuario", label: "Conteúdo enviado" },
  { id: "propriedade", label: "Propriedade intelectual" },
  { id: "projetos-publicos", label: "Projetos e links públicos" },
  { id: "planos", label: "Planos e limites" },
  { id: "exclusao-conta", label: "Exclusão de conta" },
  { id: "disponibilidade", label: "Disponibilidade" },
  { id: "suspensao", label: "Suspensão de acesso" },
  { id: "limitacao", label: "Limitação de responsabilidade" },
  { id: "alteracoes", label: "Alterações nos termos" },
  { id: "contato", label: "Contato" },
];

const CONTACT_EMAIL = "contato@fivi360.com.br";

export function TermsOfUse() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      sections={SECTIONS}
      lastUpdated="3 de junho de 2026"
    >
      <LegalSection id="aceitacao" title="1. Aceitação dos termos">
        <p>
          Ao acessar ou usar o FIVI360, você concorda com estes Termos de Uso. Se
          não concordar com alguma parte, não utilize a plataforma.
        </p>
        <p>
          Estes termos regem o uso do site, do painel do usuário e dos recursos
          disponíveis na versão atual do serviço.
        </p>
      </LegalSection>

      <LegalSection id="sobre" title="2. Sobre o FIVI360">
        <p>
          O FIVI360 é uma plataforma digital para arquitetos, designers e
          profissionais relacionados organizarem projetos, publicar imagens
          panorâmicas 360°, configurar hotspots e compartilhar trabalhos por link
          ou portfólio público.
        </p>
        <p>
          O serviço é oferecido em evolução contínua; funcionalidades, limites e
          interfaces podem mudar conforme melhorias e manutenção.
        </p>
      </LegalSection>

      <LegalSection id="cadastro" title="3. Cadastro e conta do usuário">
        <p>
          Para usar recursos da conta, você precisa se cadastrar com informações
          verdadeiras e mantê-las atualizadas. Você é responsável por guardar suas
          credenciais e por toda atividade realizada na sua conta.
        </p>
        <p>
          Não compartilhe sua senha com terceiros. Se suspeitar de uso indevido,
          altere a senha e entre em contato conosco.
        </p>
      </LegalSection>

      <LegalSection id="uso-permitido" title="4. Uso permitido da plataforma">
        <p>Você pode usar o FIVI360 para fins profissionais e legítimos, incluindo:</p>
        <ul>
          <li>criar e gerenciar projetos e imagens 360°;</li>
          <li>configurar hotspots e informações de apresentação;</li>
          <li>compartilhar conteúdos conforme as opções de visibilidade que você definir;</li>
          <li>manter um portfólio público, quando disponível no seu plano.</li>
        </ul>
        <p>É proibido, entre outros:</p>
        <ul>
          <li>violar leis, direitos de terceiros ou estes termos;</li>
          <li>enviar conteúdo ilegal, ofensivo, discriminatório ou que viole privacidade de outras pessoas;</li>
          <li>tentar acessar contas, dados ou sistemas sem autorização;</li>
          <li>sobrecarregar, interferir ou comprometer a segurança da plataforma;</li>
          <li>usar o serviço para spam, fraude ou distribuição de malware.</li>
        </ul>
      </LegalSection>

      <LegalSection id="conteudo-usuario" title="5. Conteúdo enviado pelo usuário">
        <p>
          Você mantém a propriedade sobre as imagens, projetos, textos, hotspots,
          links e demais materiais que enviar ao FIVI360.
        </p>
        <p>
          Ao usar a plataforma, você concede ao FIVI360 uma licença limitada,
          não exclusiva e revogável para hospedar, armazenar, processar, exibir e
          distribuir seus conteúdos apenas na medida necessária para operar o
          serviço — por exemplo, exibir um tour 360° no viewer, gerar links de
          compartilhamento ou mostrar itens marcados como públicos no seu
          portfólio.
        </p>
        <p>
          Você declara ter direitos sobre o que publica e assume total
          responsabilidade pelo conteúdo enviado, inclusive perante terceiros.
        </p>
      </LegalSection>

      <LegalSection id="propriedade" title="6. Propriedade intelectual">
        <p>
          A marca FIVI360, o software, o design da interface, textos institucionais
          e demais elementos da plataforma pertencem ao FIVI360 ou a seus
          licenciadores, salvo conteúdo enviado por usuários.
        </p>
        <p>
          Estes termos não transferem a você qualquer direito de propriedade sobre
          a plataforma, apenas o direito de uso conforme descrito aqui.
        </p>
      </LegalSection>

      <LegalSection id="projetos-publicos" title="7. Projetos, imagens, hotspots e links públicos">
        <p>
          Você controla a visibilidade dos seus projetos e imagens. Quando marcar
          conteúdo como compartilhado ou público, pessoas com o link correspondente
          — ou que acessarem seu portfólio público — poderão visualizar o que você
          expôs, dentro das configurações escolhidas.
        </p>
        <p>
          Links públicos podem ser reencaminhados por quem os recebeu. Revise as
          configurações de privacidade antes de divulgar URLs.
        </p>
      </LegalSection>

      <LegalSection id="planos" title="8. Planos, limites e recursos disponíveis">
        <p>
          O FIVI360 pode oferecer diferentes planos com limites de projetos,
          imagens, armazenamento e recursos premium. Os limites vigentes são
          informados na área de planos dentro do app.
        </p>
        <p>
          Nesta versão não há cobrança online integrada na plataforma; alterações
          de plano ou condições comerciais serão comunicadas pelos canais oficiais
          quando aplicável.
        </p>
      </LegalSection>

      <LegalSection id="exclusao-conta" title="9. Exclusão de conta">
        <p>
          Você pode solicitar a exclusão da sua conta pelas configurações da
          plataforma, quando o recurso estiver disponível na sua versão do app.
        </p>
        <p>
          Após a exclusão, removeremos ou agendaremos a remoção dos seus dados
          pessoais e conteúdos associados, respeitando prazos legais, obrigações
          regulatórias e backups técnicos de curto prazo necessários à segurança e
          à integridade do sistema.
        </p>
        <p>
          Conteúdos já acessados por terceiros via links públicos podem ter sido
          salvos ou visualizados fora do nosso controle antes da exclusão.
        </p>
      </LegalSection>

      <LegalSection id="disponibilidade" title="10. Disponibilidade do serviço">
        <p>
          Buscamos manter o FIVI360 disponível de forma estável, mas não
          garantimos funcionamento ininterrupto ou livre de erros. Manutenções,
          atualizações, falhas de infraestrutura ou eventos fora do nosso controle
          podem causar indisponibilidade temporária.
        </p>
      </LegalSection>

      <LegalSection id="suspensao" title="11. Suspensão ou encerramento de acesso">
        <p>
          Podemos suspender ou encerrar o acesso de contas que violem estes
          termos, representem risco à plataforma ou a outros usuários, ou quando
          exigido por lei. Quando possível, informaremos o motivo e daremos chance
          de esclarecimento, salvo casos graves ou urgentes.
        </p>
        <p>
          Você pode deixar de usar o serviço a qualquer momento, sujeito às regras
          de exclusão de conta e retenção de dados descritas nestes termos e na
          Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection id="limitacao" title="12. Limitação de responsabilidade">
        <p>
          O FIVI360 é fornecido na forma em que está disponível. Na extensão
          permitida pela lei, não nos responsabilizamos por danos indiretos,
          lucros cessantes ou perdas decorrentes do uso ou da impossibilidade de uso
          da plataforma, de conteúdos de terceiros ou de links públicos gerados por
          usuários.
        </p>
        <p>
          Nada nestes termos limita direitos irrenunciáveis previstos em lei,
          inclusive aos consumidores quando aplicável.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="13. Alterações nos termos">
        <p>
          Podemos atualizar estes Termos de Uso para refletir mudanças no serviço
          ou na legislação. A data da última atualização será indicada no topo desta
          página. O uso continuado após a publicação de alterações relevantes pode
          significar aceitação da nova versão.
        </p>
      </LegalSection>

      <LegalSection id="contato" title="14. Contato">
        <p>
          Dúvidas sobre estes termos podem ser enviadas para{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
