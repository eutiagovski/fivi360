# AUDIT-LEGAL-DOCS-GOLIVE-1 — Revisão dos Termos de Uso e Política de Privacidade

**Data:** 17 de agosto de 2026  
**Escopo:** somente leitura (textos legais × produto real)  
**Fontes principais:** `src/pages/PrivacyPolicy.jsx`, `src/pages/TermsOfUse.jsx`, `src/config/legal.js`, `docs/AUDIT-COOKIES-PRIVACY-1.md`, código/configuração atuais  
**Restrição:** nenhum código, documento legal, `legal.js`, `LegalConsentGate`, banco, build ou deploy foi alterado nesta auditoria  

> Esta auditoria identifica desalinhamentos e decisões. **Não é parecer jurídico.** Não substitui os textos atuais. A redação final fica para `RC-LEGAL-DOCS-GOLIVE-1`, após aprovação de estrutura, decisões de produto e versionamento.

**Premissa operacional para o primeiro go-live (proposta, não implementada aqui):**

- Firebase Analytics **desativado** em produção pela ausência de `REACT_APP_FIREBASE_MEASUREMENT_ID` no build.
- Pagamentos **desabilitados** (`PAID_CHECKOUT_ENABLED=false` no backend; UI “Em breve”).
- YouTube da LP **desligado** (`videoUrl === ""`).

---

## 1. Resumo executivo

Os Termos de Uso e a Política de Privacidade (ambos datados de **3 de junho de 2026**, versão de aceite **1.0**) descrevem um núcleo correto do produto: conta, projetos 360°, hotspots, compartilhamento, portfólio, planos com limites na página vigente, Firebase como infraestrutura, LGPD, HTTPS e responsabilidade pelo conteúdo do usuário.

Eles **não acompanham** o produto real de agosto de 2026. As lacunas materiais estão na Política (dados da LP, operadores, storage do navegador, comunicações, estatísticas próprias, Stripe/Resend) e nos Termos (login Google, embed, processamento de imagens, distinção dos estados de publicação, billing futuro, exclusão de conta).

**P0:** nenhum. Não há cláusula que contradiga o produto de forma perigosa ou que prometa um direito que o código negue de modo absoluto. Os textos usam hedges (“quando o recurso estiver disponível”, “nesta versão”) que evitam P0, mas deixam o usuário sem informação suficiente.

**Conclusão de go-live:** Termos e Política **precisam ser atualizados antes do lançamento público**. Não é necessário reescrever a arquitetura do aceite (`LEGAL_VERSIONS` + `LegalConsentGate`); é necessário alinhar o conteúdo e decidir versionamento.

| Documento | Precisa atualização? |
|-----------|----------------------|
| Termos de Uso | **SIM** |
| Política de Privacidade | **SIM** |

---

## 2. Estado atual dos documentos

### 2.1 Localização e metadados

| Item | Valor |
|------|--------|
| Política | `src/pages/PrivacyPolicy.jsx` — rotas `/privacidade` |
| Termos | `src/pages/TermsOfUse.jsx` — rotas `/termos` |
| Última atualização exibida | **3 de junho de 2026** (string no JSX; não vem de `legal.js`) |
| Versão de aceite | `LEGAL_VERSIONS` em `src/config/legal.js`: `termsVersion: "1.0"`, `privacyVersion: "1.0"` |
| Versão na página | **Não exibida** ao usuário |
| Contato | `contato@fivi360.com.br` (hardcoded nos dois arquivos; também em `src/config/billing.js`) |
| Controlador | “O FIVI360” — sem razão social, CNPJ, endereço ou DPO |
| Layout | `LegalPageLayout` + índice de seções |

### 2.2 Estrutura da Política (14 seções)

1. Introdução  
2. Dados que coletamos  
3. Como usamos os dados  
4. Dados enviados pelo usuário  
5. Projetos, imagens e links públicos  
6. Armazenamento e infraestrutura  
7. Compartilhamento de dados  
8. Cookies e tecnologias semelhantes  
9. Segurança  
10. Retenção e exclusão de dados  
11. Direitos do titular (LGPD)  
12. Exclusão de conta  
13. Alterações nesta política  
14. Contato  

### 2.3 Estrutura dos Termos (14 seções)

1. Aceitação dos termos  
2. Sobre o FIVI360  
3. Cadastro e conta do usuário  
4. Uso permitido da plataforma  
5. Conteúdo enviado pelo usuário  
6. Propriedade intelectual  
7. Projetos, imagens, hotspots e links públicos  
8. Planos, limites e recursos disponíveis  
9. Exclusão de conta  
10. Disponibilidade do serviço  
11. Suspensão ou encerramento de acesso  
12. Limitação de responsabilidade  
13. Alterações nos termos  
14. Contato  

### 2.4 Referências cruzadas

| De | Para | Existe? |
|----|------|---------|
| Termos §11 | Política de Privacidade (retenção) | Sim, genérico |
| Termos | Política como documento independente | Não há seção “também leia a Política” |
| Política | Termos | **Não** |
| Ambos | Versão `1.0` | **Não** |
| LP | Política | Sim (`AccessEarlyForm` + footer) |
| LP | Termos | Footer da LP; **não** no submit do formulário |
| Cadastro | Termos + Política | `LegalConsentCheckbox` (obrigatório) |
| E-mails transacionais | Política + Termos | Footer dos templates Resend |

### 2.5 Definições

Não há glossário. Termos como “público”, “compartilhado”, “link”, “portfólio” e “cookies” são usados de forma genérica, sem mapear os estados reais do produto (`private` / `shared` / `public` / embed / portfólio).

---

## 3. Produto atual considerado

Confirmado no código (agosto 2026), para comparação com os documentos:

### 3.1 Conta e autenticação

- Cadastro e-mail/senha (`SignUp`): nome, e-mail, senha; aceite legal obrigatório; marketing opcional (desmarcado).
- Login Google (`signInWithPopup` + `GoogleAuthProvider`): aceite legal via `LegalConsentGate` / `LegalConsentModal`; marketing opcional só no modal Google.
- Verificação de e-mail obrigatória para conta senha (`needsEmailVerification` → `/verify-email`).
- Google tratado como verificado (`canReceiveWelcomeEmail`).
- Recuperação de senha (`ForgotPassword` + Resend `password_reset`).
- E-mail da conta **somente leitura** em Configurações.
- `photoURL` do Google existe na sessão Auth; **não** é persistido no perfil Firestore.
- Sem age gate. LP inclui profissão “Estudante”.

### 3.2 Perfil / escritório / portfólio

Persistido em `users/{uid}` + `publicProfiles/{uid}` + `slugs/{slug}`:

- `displayName`, `email`, `companyName`, `bio`, `companyLogo`, `publicSlug`, `socialLinks` (website, Instagram, YouTube, LinkedIn, WhatsApp), `portfolioEnabled` / `portfolioAvailable`, `plan`, `billing`, `marketingPreferences`, `legalConsent`, workspaces pessoais.

**Logo:** UI existe; botão **sem handler** (stub). Campo `companyLogo` existe no modelo, mas upload **não está implementado**.

### 3.3 Projetos, imagens, viewer

- Projetos: título, descrição, `clientName`, visibilidade, capa, `embedSettings`.
- Imagens 360°: título, visibilidade, WebP via Canvas (`processImageForUpload`, qualidade 0,90), Storage `users/{userId}/images/{imageId}.webp`.
- Quota comercial usa `originalSizeBytes` (tamanho do arquivo original), não o tamanho já comprimido.
- Hotspots: `info` (título + descrição) e `scene` (navegação entre imagens). Requer plano Professional+ (`hotspotsEnabled`). Starter: hotspots desligados.
- Viewer interno + viewers públicos (share / embed / portfólio). Pannellum local, sem CDN.

### 3.4 Publicação (estados reais)

| Estado | Código | Efeito |
|--------|--------|--------|
| Privado | `visibility: "private"` | Só o dono (rotas internas) |
| Compartilhado por link | `visibility: "shared"` | `/share/project/:id` (e imagem) para quem tiver o URL |
| Público | `visibility: "public"` | Link + aparece no portfólio `/u/:slug` se o portfólio estiver disponível |
| Imagem | `private` \| `shared` (sem opção `public` na UI de imagem) | Share de imagem avulsa: `/share/standalone/:imageId` |
| Embed | `embedSettings.enabled` + plano Professional+ | `/embed/:projectId`; CSP `frame-ancestors *` só em `/embed/**` |
| Portfólio | `portfolioEnabled` + plano com `publicPortfolioEnabled` → `portfolioAvailable` | `/u/:slug` |

Starter: sem visibilidade pública, sem embed, sem portfólio. Links compartilhados (`shared`) **sim**.

Não há `robots.txt` / `sitemap` / `noindex` no repositório. **Não afirmar indexação por buscadores.**

### 3.5 Planos (`src/config/planLimits.js`)

| Plano | Preço UI | Projetos | Storage | Features relevantes |
|-------|----------|----------|---------|---------------------|
| Starter | Grátis | 2 | 25 MB | Links compartilhados; sem hotspots, público, embed, portfólio |
| Professional | R$ 49/mês | Ilimitado | 250 MB | Hotspots, público, embed, portfólio, “analytics básico” (flag) |
| Studio | R$ 199/mês | Ilimitado | 2 GB | Tudo do Pro + analytics avançado / suporte (flags) |
| Enterprise | Sob consulta | Ilimitado | 10 GB+ | Contact-only; multiusuário **não implementado** (`multiuserEnabled` só no config) |

Workspace pessoal é criado no cadastro (`workspaceId === uid`). Multiusuário **não** está no produto.

`plan.source = "manual"`: concessão administrativa; entitlement igual ao plano pago; UI “acesso concedido”, sem Stripe.

### 3.6 Billing

- Integração Stripe existe (Checkout redirect, webhook, `cancelStripeSubscription`, coleções `subscriptions` e `invoices`).
- Go-live: checkout **off**. Portal de billing no cliente: stub `NOT_ACTIVE`.
- Cancelamento de assinatura Stripe: Function + UI em `/plan` **quando** houver `subscriptionId` e source stripe — irrelevante se pagamentos nunca ligaram.
- Sem Stripe.js no frontend. FIVI360 **não** coleta número de cartão.

### 3.7 LP de pré-lançamento (`/lp/acesso-antecipado`)

Coleção `prelaunchLeads/{id}` (id = e-mail normalizado + `campaignId` `prelaunch_2026`):

nome, e-mail, WhatsApp (`phone` / `phoneNormalized`), profissão, `marketingConsent`, `campaignId`, `attribution` (UTMs, referrer, `landingPath`), `status: "waiting"`.

Duplicidade: não sobrescreve o primeiro registro.  
Grupo WhatsApp: `whatsappGroupUrl === ""` — CTA “em breve”; **não** entra automaticamente em grupo.  
Sem aceite de Termos no submit (só nota + link da Política).

### 3.8 Comunicações (Resend, backend only)

Tipos implementados: `welcome`, `verify_email`, `password_reset`, `billing_upgrade_requested`, `payment_success`, `payment_failed`, `subscription_canceled`, `subscription_cancellation_scheduled`.

Marketing: persistido em `users.marketingPreferences` e `prelaunchLeads.marketingConsent`. **Não há UI em Configurações para revogar.** Não há envio promocional automático confirmado além do opt-in armazenado.

### 3.9 Analytics e stats

- **GA4 / Firebase Analytics:** implementado; no-op sem `measurementId`. Premissa go-live: **off**.
- **Stats próprias:** incrementos agregados em `stats/{userId}` (views de portfólio/projeto/imagem). Sem IP, sem identificador de visitante. Independente do GA4. A flag `analyticsEnabled` do plano **não é usada** na UI auditada.

### 3.10 Exclusão

- Projeto: `deleteProjectCascade` (imagens, hotspots, Storage, stats da imagem).
- Imagem: `deleteImage` (doc, Storage, hotspots, stats).
- **Conta:** nenhum botão, Function ou cascade de usuário. `docs/RC-SETTINGS-UX-REFINE-1.md` registra que exclusão de conta **não foi criada**. Ajuda (`/help`) é placeholder.

### 3.11 Backup

Não há produto de backup/restauração para o usuário. Menção operacional em `docs/AUDITORIA_PRE_DEPLOY_BETA.md` é checklist interno de deploy, não SLA.

---

## 4. Auditoria dos Termos

### 4.1 Conta do usuário (§3)

**O que diz:** cadastro com informações verdadeiras; responsabilidade por credenciais; não compartilhar senha; contato se uso indevido.

**Lacunas:**

| Tema | Status |
|------|--------|
| Login Google | Ausente |
| Verificação de e-mail | Ausente |
| Sessão persistente (IndexedDB Auth) | Ausente (melhor na Política) |
| Uso individual vs escritório | Só “fins profissionais”; workspace pessoal existe, time **não** |
| Uma conta ≠ vários usuários compartilhando senha | Implícito, não explícito |
| Suspensão | Coberto em §11 |
| Encerramento pelo usuário | §9, mas depende de recurso “quando disponível” |

### 4.2 Conteúdo do usuário (§5)

**O que diz (correto e importante):**

- O usuário **mantém a propriedade**.
- Licença **limitada, não exclusiva, revogável**, só para operar o serviço (exemplos: viewer, links, portfólio).
- Usuário declara direitos e assume responsabilidade perante terceiros.

**O que falta na licença técnica (sem ampliar direitos comerciais):**

armazenar, processar, **converter**, **comprimir**, **otimizar**, transmitir, exibir, gerar versões técnicas necessárias à visualização, disponibilizar via share / embed / portfólio **conforme a configuração do usuário**.

A palavra **“distribuir”** é ambígua: pode ser lida como licença ampla. O produto só disponibiliza segundo as ações do usuário. Preferir “disponibilizar conforme suas configurações”.

Não há menção a: `clientName`, logos, textos de hotspot, links sociais do portfólio, obrigação de ter autorização de clientes retratados.

**Não inventar** thumbnails distintos: `previewUrl` / `originalUrl` apontam ao panorama processado; capa do projeto reutiliza a URL da imagem. Conversão WebP **sim**.

### 4.3 Conteúdo público (§7)

Texto genérico (“compartilhado ou público”, “link”, “portfólio”). Não distingue os cinco estados da secção 3.4. Não diz que **o usuário controla** cada opção e que conteúdo publicado pode ser acessado por **qualquer pessoa com o link**, inclusive reencaminhado (isso último **está** no segundo parágrafo — manter).

Não menciona embed em sites de terceiros.

### 4.4 Embed

**Ausente.** Produto: iframe em sites externos, `frame-ancestors *` em `/embed/**`, desligável por `embedSettings.enabled`, depende do plano, conteúdo some se o projeto for excluído/desativado/downgrade. Responsabilidade pelo site que incorpora é do usuário. Não há allowlist de domínios.

Não criar restrições que o produto não enforce (ex.: “proibido embed em sites X”).

### 4.5 Processamento de imagens

**Ausente.** O serviço converte para WebP no cliente antes do upload. Os Termos deveriam dizer, de forma genérica, que o serviço pode converter/comprimir/otimizar para armazenamento e performance — **sem** explicar quota comercial (`originalSizeBytes`).

### 4.6 Planos e limites (§8)

**Bom:** limites vigentes na área de planos; não copia números. Manter essa abordagem.

**Conflito operacional:** “Nesta versão não há cobrança online integrada na plataforma”.

- **Hoje, com gate off:** factual para o usuário final.
- **Integração Stripe existe.** A frase vira falsa no dia em que o checkout ligar, exigindo nova versão dos Termos.
- Enterprise / “Em breve” / plano manual não aparecem.

Recomendação: descrever que **podem existir planos gratuitos e pagos**, com preços e recursos na página de planos **vigente**; cobrança, quando disponibilizada, por provedor de pagamento; **não** afirmar que checkout está ativo hoje nem que nunca existirá.

### 4.7 Plano manual

Implementação administrativa (`source: "manual"`). **Não precisa** de cláusula própria. Se mencionar, tratar como acesso concedido/cortesia, sem obrigação de manter o benefício. A UI já diz que não há cobrança Stripe associada.

### 4.8 Disponibilidade (§10)

Adequado: sem SLA, admite manutenção e falhas. Não nomeia Firebase/Stripe/Resend — aceitável nos Termos (detalhe de operadores na Política).

Não promete uptime. **Manter.**

### 4.9 Backup

§9 menciona “backups técnicos de curto prazo”. **Sem evidência** de política de backup/restauração para o usuário. Risco: o leitor entende que há cópia recuperável. Ver secção 12.

### 4.10 Uso aceitável (§4)

Cobre: leis, conteúdo ilegal/ofensivo, acesso não autorizado, sobrecarga/segurança, spam/fraude/malware.

**Lacunas razoáveis (P2):** engenharia reversa do software da plataforma; automação abusiva / scraping; uso de embed para fraudar terceiros; violar IP de imagens/renders de clientes; compartilhar conta; tentar contornar limites de plano.

Não listar explorações. Linguagem de “tentativa de acesso não autorizado” já cobre o essencial.

### 4.11 IP do FIVI360 (§6)

Marca, software, interface, textos institucionais vs conteúdo do usuário. **OK.** Pode citar o viewer como parte da plataforma. Pannellum é OSS local — não é necessário nomear, desde que não se reivindique autoria de código de terceiros.

### 4.12 Limitação de responsabilidade (§12)

Forma “as is”, danos indiretos, conteúdos de terceiros, links públicos, ressalva de direitos irrenunciáveis.

**Revisão jurídica recomendada (não redigir aqui):** proporcionalidade CDC; sites que incorporam embed; falha de terceiros (Google/Stripe/Resend); perda por configuração do próprio usuário (link público reencaminhado). Não criar cláusula abusiva.

### 4.13 Alterações (§13) × produto

Texto: uso continuado após publicação **pode significar aceitação**.

Produto: `LegalConsentGate` **bloqueia o app autenticado** até novo aceite explícito se `termsVersion` ou `privacyVersion` mudar.

Isso é **conflito de mecanismo**, não de prejuízo ao usuário (o produto é mais protetivo). Os Termos deveriam dizer que alterações relevantes podem exigir novo aceite no aplicativo. Visitantes da LP / share / embed **não** passam pelo gate.

---

## 5. Auditoria da Política

### 5.1 Dados de conta (§2)

Menciona nome, e-mail, senha (Firebase Auth, sem texto legível) — **OK**.

Menciona “foto ou logo” — **parcialmente inexato:** logo está no modelo mas upload é stub; foto Google não é gravada no Firestore.

Não distingue: dados no **Firebase Authentication** (credenciais, `photoURL` de sessão, tokens) vs dados no **Firestore** (perfil). Telefone **não** é dado de conta; WhatsApp é link social opcional do portfólio **e** campo da LP.

### 5.2 Conteúdo do usuário (§2 e §4)

Projetos, panoramas, hotspots, títulos, descrições, visibilidade — **OK**. Faltam: `clientName`, textos de hotspot, URLs sociais, slug, estatísticas de views, fila de e-mail.

Finalidade “fornecimento do serviço” está em §3. Adequado.

### 5.3 Pré-lançamento

**Ausente por completo.** A LP é pública, coleta PII + atribuição, e o form aponta para `/privacidade`. Quem lê a Política hoje **não encontra** o tratamento do lead.

### 5.4 Marketing e comunicações

Consentimento genérico na base legal (§3). “Não compartilhamos com terceiros para fins de marketing nesta versão” (§4) — OK como declaração de **não venda** / não lista.

Não distingue:

- **Necessárias ao serviço:** verificação, reset, welcome, billing (quando houver).
- **Marketing:** `marketingPreferences` / `marketingConsent` (opt-in, default false).

Direito de revogar consentimento está em §11, canal **e-mail**. Produto: **sem tela de opt-out.** Marcar lacuna de produto, não inventar botão.

### 5.5 Browser storage e cookies (§8)

Texto atual: “cookies ou armazenamento local estritamente necessários” + “não utilizamos cookies de marketing/remarketing/publicidade nesta versão”.

Com Analytics **off** e YouTube **off**:

- Nenhum cookie próprio confirmado (`AUDIT-COOKIES-PRIVACY-1`).
- IndexedDB Firebase Auth (sessão).
- Fallback localStorage/sessionStorage do SDK Auth.
- `sessionStorage`: e-mail pós-cadastro; flag de dica do viewer.

A redação “podemos usar cookies **ou** armazenamento local” é parcialmente válida, mas chama a seção de “Cookies” e não descreve o que realmente existe. Melhor título: **“Cookies e tecnologias semelhantes”**, deixando claro que o essencial hoje é armazenamento técnico (não necessariamente cookie).

Não chamar IndexedDB de cookie.

Estrutura à prova de futuro: uma frase de que ferramentas analíticas **poderão** ser usadas posteriormente, **com informação e mecanismo adequados quando forem ativadas** — sem autorização genérica de tracking agora.

### 5.6 Analytics

§2: “Nesta versão não utilizamos ferramentas de analytics de marketing, pixels de remarketing nem cookies de publicidade.”

Com a decisão de go-live (measurementId fora do bundle): **compatível**, se “analytics de marketing” não for lido como “qualquer métrica”. Stats próprias (contadores) **existem** e não estão descritas.

Não afirmar que o GA4 está coletando. Não usar o parágrafo atual como autorização para ligar GA4 depois sem atualizar a Política e o aceite/consentimento cabível.

### 5.7 Operadores / terceiros (§6–7)

Nomeia Firebase Auth, Firestore, Storage. **Não nomeia:** Cloud Functions, Google Fonts, Google OAuth, Resend, Stripe (integração existente), YouTube (futuro).

### 5.8 Google Fonts

Outfit + Manrope via `fonts.googleapis.com` em **todas** as páginas. Transferência técnica típica: IP, User-Agent, URL da requisição. Sem evidência de cookie de ads. Self-host = P2 técnico, fora desta auditoria.

### 5.9 Segurança (§9)

HTTPS, regras Firebase, “medidas razoáveis”, “nenhum sistema é totalmente imune”, comunicação de incidente. **Linguagem razoável.** Sem “100% seguro”. **Manter o tom.**

### 5.10 Direitos (§11)

Lista LGPD clássica + canal e-mail. Prazo “razoável” (a lei tem prazos; revisão jurídica). Portabilidade: produto não oferece exportação estruturada — o texto já diz “quando aplicável”.

Mecanismos no produto hoje: edição de perfil/projetos; exclusão de projeto/imagem; aceite versionado; **não** autoexclusão de conta; **não** painel de marketing.

### 5.11 Menores

**Ausente.** Cadastro sem idade. LP com “Estudante”. Decisão de produto/jurídico.

### 5.12 Controlador (§14)

Identidade incompleta para um go-live público. Ver secção 17.

---

## 6. Conteúdo do usuário

| Afirmação desejada | Termos atuais | Produto |
|--------------------|---------------|---------|
| Usuário permanece dono | Sim | Sim |
| Usuário responsável + direitos/autorizações | Sim | Enforcement só por denúncia/suspensão (§11) |
| FIVI360 não vira dono das imagens | Sim | Sim |
| Licença técnica para hospedar/exibir | Sim, “processar” genérico | Conversão WebP, Storage, CDN Firebase, viewer |
| Converter / comprimir / otimizar | Não explícito | `processImageForUpload` |
| Share / embed / portfólio conforme o usuário | Exemplos parciais | Cinco superfícies públicas |
| `clientName` / logos / hotspots | “textos, hotspots, links” | Sim no modelo |
| Originais do usuário | Não pede cópia de segurança | Originais não ficam no Storage (só WebP) |

Ponto de produto relevante para os Termos (sem alarmismo): o arquivo **original** pode não ser conservado; o usuário deve manter seus arquivos-fonte. Isso é fato do pipeline, não detalhe de quota.

---

## 7. Share / Embed / Portfolio

### 7.1 Documentos atuais

Política §5 e Termos §7 tratam “públicos ou gera links” de forma única. Embed **não** aparece. Portfólio aparece como consequência do público.

### 7.2 O que deveria ficar claro (sem redigir o texto final)

1. O usuário escolhe a visibilidade e as opções de publicação.  
2. **Privado:** não acessível por link público.  
3. **Link compartilhável (`shared`):** quem tiver o URL pode ver, fora do login; o link pode ser reenviado.  
4. **Público:** além do link, pode constar no portfólio `/u/{slug}` se o portfólio estiver ativo e o plano permitir.  
5. **Embed:** o tour pode ser incorporado em site de terceiros; o FIVI360 não controla esse site; desligar embed / excluir projeto / perder o plano interrompe a incorporação.  
6. Cópias já feitas por terceiros (print, download do browser) **não** são apagadas — ambos os documentos já dizem isso; **manter**.  
7. **Não afirmar** indexação Google sem evidência.

### 7.3 Stats de visualização

Visitantes de `/u/:slug` disparam incrementos agregados. Não é cookie. Deve constar na Política como métrica de uso do serviço (contagem), não como perfilamento de visitantes.

---

## 8. Planos e billing

| Tema | Documento | Produto | Status |
|------|-----------|---------|--------|
| Limites na página de planos | Termos §8 | `/plan` + `PLAN_LIMITS` | OK (abordagem correta) |
| Sem copiar R$ 49 / 199 / 25 MB | Não copia | Números no config | OK — não engessar |
| “Não há cobrança online” | Termos §8 | Integração existe; gate off | DESATUALIZADO em potencial / rígido demais |
| Stripe | Ausente | Checkout, webhook, invoices | INCOMPLETO (Política) |
| Cartão no FIVI360 | — | Não armazena PAN | Afirmar só quando billing for descrito |
| Cancelamento ao fim do período | Ausente | Function existe; portal stub | DECISÃO: redigir “quando a cobrança estiver ativa” |
| Downgrade → Starter; conteúdo **não** é apagado | Ausente | `handleSubscriptionDeleted` não remove projetos | Expandir quando billing entrar |
| Perda de embed/portfólio/hotspots no downgrade | Ausente | Flags de plano | Expandir |
| Plano manual | Ausente | Admin grant | Não expor (P3) |
| Enterprise | Ausente | Contact-only | Opcional: “planos sob consulta” |
| Impostos / renovação | Ausente | Mensal Stripe quando on | DECISÃO jurídica quando ligar pagamento |

**Não transformar o gate temporário em regra permanente.** Os Termos devem sobreviver ao ligar pagamentos com um bump de versão, não com reescrita total — mas o §8 atual **obriga** reescrita no dia do checkout.

---

## 9. Privacidade e storage

Resumo alinhado a `AUDIT-COOKIES-PRIVACY-1`, assumindo Analytics **off** no go-live:

| Tecnologia | Go-live | Na Política hoje |
|------------|---------|------------------|
| Cookie 1P próprio | Nenhum confirmado | “podemos usar cookies” (vago) |
| IndexedDB Auth | Sim, sessão | Não |
| sessionStorage verify-email | Sim (e-mail) | Não |
| sessionStorage hint viewer | Sim (flag) | Não |
| Firestore cache IDB | Não habilitado | — |
| GA4 / gtag | Off (premissa) | “não usamos analytics de marketing” |
| Stats Firestore | Sim (agregado) | Não |
| Google Fonts | Sim, todas as rotas | Não |
| Google OAuth cookies | Só se o usuário clicar | Não |
| Stripe cookies | Só no domínio Stripe, se checkout | Não |
| YouTube | Off | — |
| Resend | Backend | Não |

---

## 10. LP / marketing

| Dado LP | Finalidade observada | Na Política |
|---------|----------------------|-------------|
| Nome, e-mail, WhatsApp, profissão | Lista de acesso antecipado / contato da campanha | Não |
| `marketingConsent` | Opt-in e-mail promocional (default false) | Não |
| `campaignId` | Dedup da campanha `prelaunch_2026` | Não |
| UTMs, referrer, `landingPath` | Atribuição da campanha no submit | Não |
| IP / UA / fingerprint no doc do lead | **Não** persistidos pelo código | Não inventar |
| Entrada automática em grupo WhatsApp | **Não** | Não afirmar |

Duplicidade: o segundo submit **não** atualiza consentimento/origem. Se a pessoa desmarcar marketing depois, o produto da LP **não** oferece correção — só e-mail ao controlador (e mesmo assim política operacional inexistente).

Cadastro do app: checkbox “Quero receber novidades e atualizações do FIVI360.” Flags persistidas: `productUpdates` e `tips` acompanham o opt-in; `offers` / `newsletter` / `research` permanecem false nesta versão (`marketingPreferences.js`).

---

## 11. Terceiros

Separação para a redação (não tratar tudo como “coleta ativa”):

### Ativo no go-live (premissa)

| Operador | Papel | Nomear na Política? |
|----------|-------|---------------------|
| Google / Firebase (Auth, Firestore, Storage, Functions, Hosting) | Infraestrutura | Sim (já parcial) |
| Google Fonts | Tipografia | Sim |
| Google OAuth | Login opcional | Sim (“quando você escolhe entrar com Google”) |
| Resend | Envio de e-mails | Sim (operador; não cookie) |

### Integração existente, desabilitada no go-live

| Operador | Papel | Nomear? |
|----------|-------|---------|
| Stripe | Pagamentos quando o checkout for disponibilizado | Sim, no futuro condicional: “quando houver cobrança, o provedor de pagamento trata os dados necessários; o FIVI360 não armazena dados completos de cartão” |
| Firebase Analytics / GA4 | Métricas | Não como coleta atual; frase de possibilidade futura + atualização da Política |

### Futuro / preparado, vazio

| Operador | Estado | Nomear como coleta ativa? |
|----------|--------|---------------------------|
| YouTube | `videoUrl` vazio | **Não** |

---

## 12. Retenção / exclusão

| Categoria | Comportamento real | Documento atual | Status |
|-----------|--------------------|-----------------|--------|
| Projeto | Cascade apaga docs + arquivos + hotspots | Genérico | OK técnico; não descrito |
| Imagem | Idem | Genérico | OK técnico |
| Conta | **Sem fluxo** | “pelas configurações, quando disponível” | INCOMPLETO / hedge |
| Lead LP | Sem TTL, sem delete pelo titular no produto | Ausente | DECISÃO_NECESSÁRIA |
| `emailQueue` | Docs de envio; retenção não definida | Ausente | DECISÃO_NECESSÁRIA |
| `invoices` / `subscriptions` | Permanecem no webhook; downgrade **não** apaga | Ausente | DECISÃO_NECESSÁRIA (quando billing) |
| `stats` | Incrementos; delete de imagem tenta limpar stats da imagem | Ausente | DECISÃO_NECESSÁRIA |
| Logs de plataforma Google | Fora do app | Não | Não inventar prazo |
| Backups técnicos de curto prazo | **Não evidenciados** como política | Afirmados em Termos §9 e Política §10 | CONFLITO / risco |
| Originais do usuário | Não armazenados (WebP) | Não | Expandir Termos com dever de cópia própria |

**Não inventar prazo** (ex.: 30 dias, 5 anos). Onde não houver política técnica: **DECISÃO_NECESSÁRIA**.

Exclusão de conta: o texto atual **não promete** botão imediato (“quando o recurso estiver disponível”). Ainda assim, o usuário razoável procura em Configurações e não encontra. Go-live: canal **e-mail** como mecanismo efetivo, e não sugerir autoexclusão no app até existir.

---

## 13. Versionamento

Arquivos: `src/config/legal.js`, `src/utils/legalConsent.js`, `LegalConsentGate`, `saveLegalConsent` / `buildLegalConsent`.

### Respostas objetivas

1. **Alterar Política e Termos exigirá bump?**  
   Para **usuários autenticados** verem o modal de reaceite: **sim**, se a mudança for material. O gate compara strings `termsVersion` e `privacyVersion` com `LEGAL_VERSIONS`. Mudar só o JSX **não** dispara o modal.  
   Visitantes e leads da LP **não** são versionados.

2. **Como o `LegalConsentGate` reage ao bump?**  
   `isLegalConsentCurrent` falha → status `consent_required` → modal bloqueante nas rotas `PRIVATE`. Não há uso do app autenticado sem novo aceite. Sign-out disponível.

3. **Usuários existentes precisarão aceitar novamente?**  
   **Sim**, se houver bump de `termsVersion` **ou** `privacyVersion`. Bump de um só documento já bloqueia (as duas versões precisam bater).

4. **Risco de loop?**  
   **Baixo / não observado.** Após `SAVE_SUCCESS`, o estado local já contém as versões novas. Reload em background **não reabre** o modal se a leitura falhar ou se o consentimento fresco estiver desatualizado (early return). Falha de save deixa o usuário no modal (bloqueio, não loop).

5. **Histórico do aceite anterior?**  
   **Não.** `legalConsent` é **um objeto sobrescrito** (`termsAccepted`, `privacyAccepted`, `termsVersion`, `privacyVersion`, `acceptedAt`, `acceptedSource`). Sem array de versões antigas.

6. **O aceite registra versão individual de Terms e Privacy?**  
   **Sim**, dois campos. **Não** há aceite separado (um checkbox cobre os dois). Não há registro do texto hash/conteúdo, só o número da versão.

LP: concorda com “uso dos dados para gerenciar acesso antecipado” via nota, **sem** gravar `legalConsent`.

### 13.1 1.0 vs 1.1 (pré-go-live)

Ainda não houve lançamento público. Duas opções:

**A — Tratar a revisão como a versão inicial definitiva `1.0` (sem bump)**

- Prós: número limpo no dia 1; testers internos que já aceitaram 1.0 **não** são interrompidos pelo modal (podem não reler o texto novo).  
- Contras: quem já aceitou 1.0 fica com aceite da versão antiga **materialmente diferente**; auditoria/compliance piores; o gate não documenta que o texto mudou.

**B — Publicar como `1.1` (bump)**

- Prós: todo usuário autenticado relê e aceita o texto alinhado ao produto; histórico mínimo (`acceptedAt` novo); coerente com mudanças materiais.  
- Contras: testers/beta veem o modal de novo (custo baixo).

**Recomendação desta auditoria (não decide sozinha):** se existir **qualquer** conta que já tenha `legalConsent` 1.0 em ambiente que vira produção, preferir **bump (1.1)**. Se o Firestore de produção estiver vazio e 1.0 nunca foi aceito fora de homologação descartável, **manter 1.0** como número público e **substituir o texto**, atualizando a data — desde que homologação não seja promovida com aceites velhos.

A data “3 de junho de 2026” **deve** mudar na publicação, independentemente do número.

---

## 14. Matriz de conformidade

| Tema | Documento atual | Produto atual | Status | Risco | Recomendação |
|------|-----------------|---------------|--------|-------|--------------|
| Identidade do serviço | Plataforma 360° para arquitetos | Correto | OK | Baixo | Manter |
| Aceite versionado | Uso continuado = aceitação (Termos) | Modal obrigatório no app | CONFLITO | Médio | Alinhar Termos ao gate |
| Login e-mail/senha | Sim | Sim + verificação | INCOMPLETO | Baixo | Mencionar verificação |
| Login Google | Não | Sim | INCOMPLETO | Médio | Incluir nos Termos e na Política |
| Credenciais | Responsabilidade do usuário | Auth no Firebase | OK | Baixo | Manter |
| Conteúdo: propriedade do usuário | Sim | Sim | OK | Baixo | Manter |
| Licença técnica | Hospedar/processar/exibir/distribuir | + converter WebP + embed | INCOMPLETO | Médio | Expandir; suavizar “distribuir” |
| Embed | Não | `/embed`, plano Pro+ | INCOMPLETO | Médio | Nova cláusula Termos + Política |
| Estados private/shared/public | Genérico | Três + embed + portfólio | INCOMPLETO | Médio | Distinguir |
| Processamento de imagem | Não | WebP no cliente | INCOMPLETO | Baixo | Frase genérica nos Termos |
| Planos / limites | Página vigente; sem números | `PLAN_LIMITS` | OK | Baixo | Manter ponteiro à página |
| Cobrança “não integrada” | Termos §8 | Gate off; Stripe existe | DESATUALIZADO | Médio | Linguagem condicional futura |
| Plano manual | Não | Admin | OK | Baixo | Não expor |
| SLA / uptime | Sem garantia | Sem SLA | OK | Baixo | Manter |
| Backup | “backups técnicos de curto prazo” | Sem evidência | CONFLITO | Médio | Remover ou condicionar a fato |
| Uso aceitável | Núcleo OK | — | INCOMPLETO | Baixo | Expandir P2 |
| IP FIVI360 vs usuário | Sim | Sim | OK | Baixo | Manter |
| Limitação de responsabilidade | Genérica | Embed/terceiros pouco cobertos | INCOMPLETO | Médio | Revisão jurídica |
| Dados de conta | Nome/e-mail/senha | + Google, escritório, slug | INCOMPLETO | Médio | Completar categorias |
| “Foto ou logo” | Sim | Logo stub; foto Google não persistida | DESATUALIZADO | Baixo | Ajustar ao que existe |
| LP / leads | Não | `prelaunchLeads` | INCOMPLETO | Alto | Nova seção Política |
| UTMs / referrer | Não | No submit da LP | INCOMPLETO | Médio | Incluir na LP |
| Marketing opt-in | Base legal genérica | Checkbox app + LP | INCOMPLETO | Médio | Distinguir transacional vs marketing |
| Opt-out no produto | E-mail LGPD | Sem UI | INCOMPLETO | Médio | Canal e-mail até haver Settings |
| Cookies | Necessários; sem ads | Sem cookie 1P; storage técnico | INCOMPLETO | Médio | “Cookies e tecnologias semelhantes” |
| GA4 | Não usamos analytics de marketing | Off no go-live (premissa) | OK* | Alto se a premissa falhar | *Condicional ao build sem measurementId |
| Stats de views | Não | `stats/{uid}` agregado | INCOMPLETO | Baixo | Mencionar contagem |
| Firebase | Auth/Firestore/Storage | + Functions | INCOMPLETO | Baixo | Incluir Functions |
| Google Fonts | Não | Todas as páginas | INCOMPLETO | Médio | Mencionar transferência técnica |
| Resend | Não | E-mail | INCOMPLETO | Médio | Operador |
| Stripe | Não | Integração; pagamentos off | INCOMPLETO | Médio | Condicional “quando houver pagamento” |
| YouTube | Não | Vazio | OK | — | Não declarar coleta |
| Retenção prazos | Genérico + backups | Sem política por categoria | DECISÃO_NECESSÁRIA | Médio | Não inventar prazos |
| Exclusão de conta | “quando disponível” | Sem botão/Function | INCOMPLETO | Médio | Canal suporte; não sugerir Settings |
| Direitos LGPD | Lista + e-mail | Edição parcial no app | OK / INCOMPLETO | Médio | Ser honesto sobre mecanismos |
| Segurança | Razoável, sem absoluto | Rules + HTTPS + secrets backend | OK | Baixo | Manter tom |
| Menores | Não | Sem age gate; LP “Estudante” | DECISÃO_NECESSÁRIA | Médio | Decidir idade mínima |
| Controlador | “FIVI360” + e-mail | Sem PJ/CNPJ no código | DECISÃO_NECESSÁRIA | Alto (transparência) | DADO NECESSÁRIO |
| Versão 1.0 / data junho | Sim | Produto evoluiu | DESATUALIZADO | Médio | Nova data; decidir 1.0 vs 1.1 |
| Analytics de plano (“básico”) | Não | Flag sem UI | OK | — | Não tratar como GA4 |

\*OK somente se o go-live **não** embutir `REACT_APP_FIREBASE_MEASUREMENT_ID`.

---

## 15. Matriz Termos

| Cláusula atual | Manter | Reescrever | Expandir | Remover | Motivo | Evidência no produto |
|----------------|--------|------------|----------|---------|--------|----------------------|
| 1. Aceitação | Sim | — | Mencionar aceite no cadastro/modal | — | Gate real | `LegalConsentCheckbox`, `LegalConsentGate` |
| 2. Sobre o FIVI360 | Sim | — | Embed como capacidade (sem detalhar plano) | — | Produto tem embed | `planLimits.projectEmbedEnabled` |
| 3. Cadastro | — | — | Google, verificação, não compartilhar conta | — | Fluxos reais | `authService`, `ProtectedRoute` |
| 4. Uso permitido | Sim | — | Abuso de infra, IP de terceiros, automação | — | Lacunas | — |
| 4. Proibições | Sim | — | — | — | Núcleo adequado | — |
| 5. Propriedade do usuário | Sim | — | — | — | Crítico e correto | — |
| 5. Licença ao FIVI360 | — | “Distribuir” | Converter/comprimir/transmitir/embed | — | Pipeline WebP + publicação | `imageConversion.js`, embed |
| 6. IP FIVI360 | Sim | — | Interface/viewer | — | Distinção clara | — |
| 7. Links públicos | — | Distinguir estados | Embed; controle pelo usuário | — | `private`/`shared`/`public` | `visibility.js` |
| 8. Planos | Ponteiro à página | Parágrafo “sem cobrança online” | Billing *quando* oferecido | Números se alguém colar | Gate temporário ≠ regra | `isPaidCheckoutEnabled` |
| 9. Exclusão | Hedge | Canal efetivo hoje = contato | Cópia de originais | Promessa de botão | Sem `deleteAccount` | Settings sem exclusão |
| 9/10 backups | — | — | — | Ou qualificá-los | Sem evidência | — |
| 10. Disponibilidade | Sim | — | Falha de terceiros (genérico) | SLA | Sem SLA | — |
| 11. Suspensão | Sim | — | — | — | Adequado | Sem automação extra |
| 12. Limitação | Sim (base) | Revisão jurídica | Embed, conteúdo do usuário, config do usuário | — | Superfícies públicas | `/embed`, `/share`, `/u` |
| 13. Alterações | — | Uso continuado vs aceite explícito | — | Ficção de aceite tácito no app | Gate bloqueia | `isLegalConsentCurrent` |
| 14. Contato | E-mail | — | Identidade do responsável se definida | — | Mesmo gap da Política | `contato@fivi360.com.br` |
| *(nova)* Embed | — | — | Sim | — | Funcionalidade crítica | `embedSettings`, CSP |
| *(nova)* Processamento de mídia | — | — | Sim | — | Fato do upload | Canvas → WebP |
| *(nova)* Comunicações transacionais | — | — | Opcional (ou só Política) | — | E-mails Resend | `EMAIL_TYPES` |
| Plano manual | — | — | — | Não criar cláusula | Admin interno | `PLAN_SOURCES.MANUAL` |

---

## 16. Matriz Privacidade

| Seção atual | Manter | Reescrever | Expandir | Remover | Nova seção necessária | Motivo | Evidência |
|-------------|--------|------------|----------|---------|----------------------|--------|-----------|
| 1. Introdução | Sim | — | Relação com Termos | — | — | Sem cruzamento | — |
| 2. Dados coletados | Estrutura | “Foto ou logo” | Google, escritório, LP, stats, social | Analytics de marketing como fato se off | Pré-lançamento | Categorias incompletas | `userService`, `prelaunchLeads` |
| 3. Finalidades | Sim | — | Campanha LP; e-mails; contadores | Não usar “melhorar experiência” como GA4 | Comunicações | Distinguir bases | — |
| 4. Dados enviados | Não venda | — | Licença/uso técnico (ou só Termos) | — | Conteúdo do usuário (reforço) | OK parcial | — |
| 5. Projetos públicos | Ideia | Distinguir estados | Embed, portfólio, reenvio de link | Indexação | Dados públicos e compartilhamento | Embed omitido | `App.js` rotas |
| 6. Infraestrutura | Firebase | — | Functions; Auth vs Firestore | — | Prestadores | Resend/Fonts/Stripe | AUDIT-COOKIES |
| 7. Compartilhamento | Lei / segurança | — | Operadores nomeados | — | Prestadores (pode fundir) | Lista curta demais | — |
| 8. Cookies | Título amplo | Corpo | Storage técnico; OAuth/Stripe/YT condicionais | “Utilizamos cookies” como fato único | Cookies e tecnologias semelhantes | Sem cookie 1P | AUDIT-COOKIES |
| 9. Segurança | Sim | — | — | Superlativos (não há) | — | Tom adequado | Rules + HTTPS |
| 10. Retenção | Enquanto a conta existir | Backups | Categorias sem prazo = decisão | Promessa de backup | Retenção (mais honesta) | Sem TTL leads | — |
| 11. Direitos | Lista LGPD | Prazo “razoável” (jurídico) | Mecanismos reais vs e-mail | — | — | Sem export/opt-out UI | Settings |
| 12. Exclusão conta | Não apaga cópias de terceiros | “pelas configurações” | Pedido a `contato@` | Autoexclusão | — | Sem código | Grep `deleteAccount` vazio |
| 13. Alterações | Data no topo | — | Aceite no app quando versão mudar | — | — | Gate | `LEGAL_VERSIONS` |
| 14. Contato / controlador | E-mail + ANPD | Identidade | Endereço se existir | Inventar PJ | — | DADO NECESSÁRIO | Só e-mail no código |
| — | — | — | — | — | **Pré-lançamento e campanhas** | P1 | LP |
| — | — | — | — | — | **Comunicações** | Transacional vs marketing | Resend + checkboxes |
| — | — | — | — | — | **Analytics futuro** (parágrafo, não seção de coleta atual) | Evitar reescrita total | `analyticsService.js` |

---

## 17. Decisões necessárias

Marcações **DADO NECESSÁRIO DO RESPONSÁVEL** / **DECISÃO_NECESSÁRIA** — sem inventar regra.

### Identidade e governança

1. **DADO NECESSÁRIO DO RESPONSÁVEL:** nome empresarial ou pessoa física, CNPJ/CPF se aplicável, endereço se a política institucional exigir, e-mail de privacidade (hoje só `contato@fivi360.com.br`).  
2. O FIVI360 é controlador único? Há operador interno (agência, sócio)? **Não evidenciado no código.**  
3. **Menores:** idade mínima (ex. 18) e o que fazer com “Estudante” na LP. Sem age gate hoje — **não inventar mecanismo**.

### Produto / operação (já propostas, confirmar)

4. Confirmar Analytics **off** no pipeline de build de produção (measurementId ausente).  
5. Confirmar pagamentos **off** no go-live, sem escrever isso como regra eterna.  
6. YouTube permanece desligado no go-live.

### Retenção (não inventar prazo)

7. Leads `prelaunchLeads`: até quando? Após go-live da conta?  
8. `emailQueue`: apagar após envio?  
9. Stats de views: retenção.  
10. Invoices/subscriptions quando billing existir.  
11. Pedido LGPD de exclusão de lead (sem conta): processo manual?

### Exclusão de conta

12. Go-live: **somente pedido por e-mail** (processo operacional) vs adiar menção a Settings.  
13. Cascade futuro: Auth + Firestore + Storage + Stripe customer + leads com o mesmo e-mail?

### Marketing

14. Como o titular revoga: só e-mail até existir Settings? Prazo de atendimento?  
15. Leads duplicados não atualizam `marketingConsent` — aceitável?

### Textos

16. Versionamento **1.0 in-place** vs **1.1** (secção 13.1).  
17. Nomear Stripe/Resend/Google Fonts nominalmente (recomendado) vs “provedores de infraestrutura e comunicação”.  
18. Plano manual visível nos Termos? **Recomendação: não.**  
19. Backup: remover a frase ou baseá-la em fato (ex.: backups do provedor de nuvem, sem garantia de restore ao usuário).  
20. Cópia dos arquivos originais: incluir nos Termos?

### Jurídico (fora do código)

21. Revisão da limitação de responsabilidade à luz do CDC.  
22. Base legal específica por tratamento (execução de contrato vs consentimento vs legítimo interesse), especialmente LP e UTMs.  
23. Transferência internacional (Firebase/Google, Resend, Stripe) — os textos atuais não tratam.

---

## 18. Estrutura proposta dos novos documentos

Não é texto jurídico final. Adaptação ao produto real.

### 18.1 Política de Privacidade (proposta)

1. Introdução e âmbito (site, app, LP, links públicos, embed)  
2. Quem é o responsável (controlador)  
3. Dados que coletamos  
   - Conta e autenticação (e-mail/senha vs Google)  
   - Perfil e escritório  
   - Conteúdo profissional  
   - Pré-lançamento / campanhas  
   - Uso técnico e estatísticas agregadas  
   - Dados que **não** coletamos (cartão completo; IP do lead no doc)  
4. Como utilizamos os dados e bases legais (alto nível)  
5. Conteúdo enviado pelo usuário  
6. Dados públicos, compartilhamento, embed e portfólio  
7. Comunicações (serviço vs marketing; como recusar)  
8. Cookies e tecnologias semelhantes (storage técnico; terceiros condicionais)  
9. Prestadores de serviço (ativos / pagamento quando houver / analytics futuro)  
10. Transferências e infraestrutura  
11. Retenção (honesta: o que se sabe / o que é sob demanda)  
12. Segurança  
13. Direitos do titular e como exercer  
14. Exclusão de conta e de conteúdos  
15. Crianças e adolescentes (após decisão)  
16. Alterações (data + versão + possível novo aceite)  
17. Contato e ANPD  

Parágrafo de **analytics futuro:** ferramentas de medição poderão ser adotadas; a Política será atualizada e, quando exigido, haverá mecanismo específico — **sem** consentimento genérico agora.

### 18.2 Termos de Uso (proposta)

1. Aceitação (cadastro, Google, modal de atualização)  
2. O serviço  
3. Conta (veracidade, credenciais, Google, verificação, uso da conta)  
4. Planos e recursos (página vigente; limites; alteração de plano)  
5. Cobrança (condicional: *quando* disponibilizada; provedor; sem PAN no FIVI360)  
6. Conteúdo do usuário (propriedade, responsabilidade, licença técnica, originais)  
7. Publicação: privado, link, público, portfólio, embed  
8. Processamento técnico de imagens  
9. Uso aceitável  
10. Propriedade intelectual do FIVI360  
11. Disponibilidade, alterações do serviço, ausência de SLA  
12. Suspensão e encerramento  
13. Exclusão de conta  
14. Limitação de responsabilidade (após revisão jurídica)  
15. Relação com a Política de Privacidade  
16. Alterações dos Termos (aceite no app)  
17. Contato / lei aplicável (se o jurídico definir)  

Não incluir: SLA, números de plano, `source=manual`, detalhes de quota WebP, YouTube, lista de exploits.

---

## 19. Priorização

### P0 — conflito grave / bloqueador

**Nenhum.** Os hedges atuais evitam promessa falsa absoluta de autoexclusão ou de checkout ativo. Analytics off (se cumprido) evita contradição frontal com “não usamos analytics de marketing”.

### P1 — corrigir antes do go-live

1. Reescrever a Política para o produto real: LP, operadores (Firebase completo, Fonts, Resend, Stripe condicional), storage técnico, comunicações, stats, exclusão via contato.  
2. Atualizar Termos: Google, embed, estados de publicação, licença técnica (converter/comprimir), billing futuro sem cravar “não há cobrança” para sempre, aceite explícito no app.  
3. **DADO NECESSÁRIO:** identidade do controlador.  
4. Remover ou qualificar “backups técnicos de curto prazo” sem evidência.  
5. Não sugerir exclusão “nas configurações” como caminho atual.  
6. Decidir 1.0 vs 1.1 e **atualizar a data**.  
7. Confirmar operacionalmente Analytics off e pagamentos off no release.  
8. Decisão de menores / “Estudante”.  
9. Distinguir marketing vs e-mail transacional; informar revogação por e-mail enquanto não houver UI.

### P2 — melhoria importante

10. Uso aceitável (automação, IP de clientes, compartilhamento de conta).  
11. Transferência internacional.  
12. Self-host de fontes (técnico; reduz menção a Google Fonts).  
13. Opt-out de marketing em Configurações.  
14. Exibir número de versão na página legal.  
15. Histórico de aceites (array), se o jurídico quiser.  
16. Revisão CDC da limitação de responsabilidade.  
17. Política de retenção por categoria (leads, fila, stats).  
18. Fluxo in-app de exclusão de conta (produto).

### P3 — evolução futura

19. GA4 com consentimento (quando ligar).  
20. YouTube na Política (quando `videoUrl` existir).  
21. Cláusulas detalhadas de assinatura (renovação, tributos, downgrade) no dia do checkout.  
22. Plano manual / Enterprise.  
23. Multiusuário / white label.  
24. CMP / Consent Mode.  
25. Portabilidade automatizada.

---

## 20. Recomendação para go-live

1. **Não lançar** com os textos de 3 de junho de 2026 como se descrevessem o produto atual.  
2. Aprovar as decisões da secção 17 (mínimo: controlador, exclusão por e-mail, Analytics off, pagamentos off, menores, versionamento).  
3. Em seguida, executar **`RC-LEGAL-DOCS-GOLIVE-1`**: novos textos em `PrivacyPolicy.jsx` e `TermsOfUse.jsx`, data nova, bump de `LEGAL_VERSIONS` se for 1.1.  
4. **Não** alterar `LegalConsentGate` além do bump de versão, salvo bug.  
5. Estrutura: Política mais analítica (dados/operadores); Termos mais de uso (conta, conteúdo, publicação, limites).  
6. Redação à prova de Analytics/Stripe futuros: parágrafos condicionais, **sem** declarar coleta ou checkout ativos.  
7. Banner de cookies: **não** necessário no go-live se Analytics e YouTube permanecerem off (`AUDIT-COOKIES-PRIVACY-1`).  
8. Após publicar os textos, testers autenticados devem passar pelo modal se houver bump — isso é desejável.

**Termos precisam atualização: SIM**  
**Política precisa atualização: SIM**

---

*Fim da auditoria AUDIT-LEGAL-DOCS-GOLIVE-1. Somente leitura. Nenhum arquivo de código ou documento legal foi alterado além deste relatório.*
