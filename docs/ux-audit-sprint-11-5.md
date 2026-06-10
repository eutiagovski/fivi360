# Sprint 11.5 — Auditoria UX Pós-refinamentos

**Data:** 04/06/2026  
**Escopo:** Revisão incremental pós-refinamentos (landing, auth, legais, plano/billing, dashboard, app autenticado, viewer, páginas públicas)  
**Referência:** `docs/ux-audit-sprint-11.md` (03/06/2026)  
**Método:** Revisão estática de código, rotas e componentes — sem alterações no repositório  
**Versão auditada:** pós-Sprint 11 refinements, pré-beta

---

## Resumo Executivo

O FIVI360 evoluiu de forma significativa desde a Sprint 11. Os bloqueadores legais e de navegação básica foram endereçados: páginas `/termos` e `/privacidade` com conteúdo real e layout de leitura, aceite no cadastro e gate para usuários antigos, login com Google, rota 404, fluxo de plano com modal de upgrade e deep links (`/plan?upgrade=professional`), empty states e headers padronizados em Projetos/Imagens/Plano, e enforcement de limites consistente no Dashboard e em `/projects/new`.

Os bloqueadores restantes concentram-se em **configuração operacional da demo** (`landingDemo.js` ainda com placeholder), **assets de marca** (favicon e OG image ausentes em `public/`) e **conversão real de planos pagos** (billing preparado, pagamentos ainda indisponíveis). Há polimento importante em mobile (header do detalhe do projeto, viewer, painel de hotspots) e lacunas funcionais conhecidas (compartilhar imagem dentro do projeto, upload de logo, KPI enganoso).

**Estimativa atualizada:** ~2 críticos, ~9 altos, ~18 médios, ~14 baixos (+ ~4 novos itens pós-refinamento).

**Recomendação:** Configurar demo + favicon antes de beta aberto; alinhar expectativa de upgrade (CTAs “Assinar” vs pagamentos em breve); corrigir KPI e share por imagem no projeto em sprint curta de polimento.

---

## Itens resolvidos desde a Sprint 11

| ID anterior | Item | Evidência no código |
|-------------|------|---------------------|
| **C-02** | Páginas legais placeholder | `TermsOfUse.jsx`, `PrivacyPolicy.jsx` + `LegalPageLayout` com índice, scroll e conteúdo completo |
| **C-03** | Rota 404 inexistente | `App.js` — `<Route path="*" element={<NotFound />} />` |
| **A-03** | Dashboard criar projeto sem limite | `Dashboard.js` — `PlanLimitButton` em seção Projetos Recentes |
| **A-11** | Cadastro sem aceite de termos | `SignUp.js` — `LegalConsentCheckbox` obrigatório |
| **A-12** | `/projects/new` acessível no limite | `NewProject.js` — tela dedicada `new-project-limit-blocked` |
| **M-02** | Empty state imagens no Dashboard sem CTA | `EmptyStateCard` com ação “Adicionar imagem” |
| **M-03** | Empty states inconsistentes no Dashboard | Ambas seções usam `EmptyStateCard` |
| **M-15** | Google Sign-In ausente na UI | `GoogleSignInButton` em `Login.js` e `SignUp.js` |
| **M-17** | `PlanUpgradeHint` sempre no Dashboard | Banner comentado; `UpgradePrompt` só quando limite atingido |
| **M-22** | testid duplicado na landing pricing | `landing-pricing-btn-${id}` em `LandingPricing.jsx` |
| — | Aceite legal usuários antigos | `LegalConsentGate` em `ProtectedRoute.jsx` + `LegalConsentModal` |
| — | Landing reconstruída | `Landing.jsx` modular + `landingContent.js` |
| — | Página Plano refinada | `Plan.js` — `CurrentPlanBanner`, consumo com barras, `UpgradePlanModal`, billing sections |
| — | Billing genérico preparado | `config/billing.js`, `billingService.js`, `ManageSubscriptionSection`, `BillingHistorySection` |
| — | Fluxo landing → plano | `billingPlanFlow.js` — `?plan=` no auth, redirect `/plan?upgrade=` |
| — | Headers padronizados (parcial) | `PageActionHeader` em Projetos, Imagens, Plano |
| — | Sidebar reordenada | `Layout.js` — Imagens antes de Projetos |
| — | Empty states reutilizáveis | `EmptyStateCard.jsx` em Dashboard, Projetos, Imagens, ProjectDetail |
| — | Banner antigo de cobrança na página Plano | `PlanUpgradeHint` removido de `Plan.js` |
| — | Limite em `/projects` | `PageActionHeader` + `UpgradePrompt` quando `!canCreateProject` |

---

## Problemas Críticos

### C-01 — Demo da landing não configurada

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/` — `#demo` (`LandingShowcase`) |
| **Problema** | `landingDemo.js` mantém `projectId: "COLOCAR_ID_DO_PROJETO_AQUI"`. `useLandingDemo` trata esse valor como indisponível; exibe fallback e CTAs apontam para URLs inválidas. |
| **Impacto** | Principal promessa de conversão (“Ver Demonstração”) não se cumpre; visitante não experimenta o produto real. |
| **Prioridade** | Crítico |
| **Sugestão de correção** | Criar projeto demo público com imagens/hotspots; atualizar `LANDING_DEMO.projectId` e `projectPath`; validar slug `fivi360` e portfólio. |
| **Arquivos prováveis** | `src/config/landingDemo.js`, `src/hooks/useLandingDemo.js`, `src/components/landing/LandingShowcase.jsx` |

### C-04 — Favicon ausente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Global |
| **Página/rota** | Todas |
| **Problema** | `index.html` referencia `favicon.ico`; `public/` contém apenas `index.html` (sem favicon nem `og-image.png`). |
| **Impacto** | Aba do browser sem ícone; aparência não profissional em bookmarks. |
| **Prioridade** | Crítico (go-live); Alto (beta fechado) |
| **Sugestão de correção** | Adicionar `favicon.ico` (ou `.svg`) e, se possível, `og-image.png` em `public/`. |
| **Arquivos prováveis** | `public/index.html`, `public/` |

---

## Problemas Altos

### A-01 — Hero exibe placeholder estático, não demo real

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/` — `LandingHero` |
| **Problema** | Lado direito mostra ícone Orbit + *"Experiência 360° interativa"*, sem viewer embutido. Demo real só na seção Showcase (e depende de C-01). |
| **Impacto** | Primeira impressão não transmite valor 360°; redundância visual com fallback da demo. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Mini-viewer no Hero com mesmo projeto demo ou loop/GIF de navegação. |
| **Arquivos prováveis** | `src/components/landing/LandingHero.jsx` |

### A-02 — Upgrade sem checkout real (expectativa vs. entrega)

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Planos e limites |
| **Página/rota** | `/plan`, `UpgradePlanModal`, `UpgradePrompt`, landing `#precos` |
| **Problema** | Fluxo melhorou (modal, deep link, toast honesto), mas botões **“Assinar Professional/Enterprise”** e **“Fazer upgrade”** ainda não concluem pagamento — apenas `PAYMENTS_COMING_SOON_MESSAGE`. |
| **Impacto** | Usuário no limite ou vindo da landing acredita que pode assinar; frustração ao clicar. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Até integração: desabilitar CTAs de assinatura com copy “Lista de espera”/“Em breve”; ou formulário de contato comercial. |
| **Arquivos prováveis** | `src/components/plans/UpgradePlanModal.jsx`, `src/pages/Plan.js`, `src/config/billing.js`, `src/components/plans/UpgradePrompt.jsx` |

### A-04 — KPI “Links compartilhados” enganoso

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard / Plano |
| **Página/rota** | `/dashboard`, `/plan` |
| **Problema** | Conta `projects.filter(p => p.visibility !== 'private').length` — projetos compartilháveis, não links gerados; imagens soltas compartilhadas não entram. |
| **Impacto** | Métrica distorce uso real do produto. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Renomear para “Projetos compartilháveis” ou calcular projetos + imagens com visibilidade ≠ private. |
| **Arquivos prováveis** | `src/pages/Dashboard.js`, `src/pages/Plan.js` |

### A-05 — Compartilhar imagem indisponível no detalhe do projeto

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Detalhe do projeto |
| **Página/rota** | `/projects/:id` |
| **Problema** | `ImageCard` no projeto não recebe `onShare`; compartilhamento só no projeto (`ShareProjectDialog`) ou em imagens soltas (`/images`). |
| **Impacto** | Usuário não obtém link de imagem específica sem ir em Imagens ou inferir link do projeto. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Integrar `ShareImageDialog` em `ProjectDetail`, como em `Images.js`. |
| **Arquivos prováveis** | `src/pages/ProjectDetail.js`, `src/components/images/ShareImageDialog.jsx` |

### A-06 — Header do projeto quebra em mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Detalhe do projeto |
| **Página/rota** | `/projects/:id` |
| **Problema** | Barra `flex items-start justify-between` com título grande e três botões (Editar, Compartilhar, Excluir) na mesma linha, sem wrap/menu overflow. |
| **Impacto** | Ações espremidas ou fora da viewport no celular. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Empilhar ações abaixo do título em mobile; menu ⋯ para ações secundárias. |
| **Arquivos prováveis** | `src/pages/ProjectDetail.js` |

### A-07 — Upload de logo não funcional

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Página/rota** | `/settings` |
| **Problema** | Botão “Fazer upload” sem handler; `companyLogo` não é persistido. Avatar no header depende desse campo. |
| **Impacto** | Personalização prometida não cumprida; portfólio sem marca do escritório. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Implementar upload via `storageService` ou ocultar seção até estar pronta. |
| **Arquivos prováveis** | `src/pages/Settings.js`, `src/services/storage/storageService.js`, `src/components/layout/AppHeader.jsx` |

### A-08 — Viewer público: label “Voltar ao projeto” incorreta

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento público |
| **Página/rota** | `/share/image/:imageId` (imagem solta) |
| **Problema** | `backHref` é `/` sem projeto, mas o botão mantém texto “Voltar ao projeto” (visível em `sm+`). Subtítulo usa fallback `"Projeto"`. |
| **Impacto** | Visitante de link direto recebe copy enganosa. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Label condicional (“Início” / “Voltar ao projeto”) ou ocultar quando `!project`. |
| **Arquivos prováveis** | `src/pages/PublicImage.js` |

### A-09 — Portfólio demo da landing pode não existir

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/u/fivi360` |
| **Problema** | `LANDING_DEMO.portfolioPath` depende de conta real com slug, `portfolioEnabled` e projetos públicos. |
| **Impacto** | CTAs “Ver portfólio FIVI360” podem levar a erro ou portfólio vazio. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Garantir conta demo configurada ou remover CTAs até setup. |
| **Arquivos prováveis** | `src/config/landingDemo.js`, `src/components/landing/LandingPortfolio.jsx`, `src/components/landing/LandingShowcase.jsx` |

### A-10 — OG/Twitter image ausente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing / compartilhamento social |
| **Página/rota** | `/`, links públicos |
| **Problema** | Meta `og:image` / `twitter:image` comentadas; arquivo não existe em `public/`. |
| **Impacto** | Preview pobre no WhatsApp/LinkedIn. |
| **Prioridade** | Alto |
| **Sugestão de correção** | Criar `og-image.png` 1200×630 e descomentar tags em `index.html`. |
| **Arquivos prováveis** | `public/index.html`, `public/og-image.png` |

---

## Problemas Médios

### M-01 — KPIs do Dashboard sem alertas visuais de uso

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Problema** | `StatCard` variant `metricUsage` sem barra/cores; `/plan` usa variant `usage` com `getUsageVisualClasses`. |
| **Impacto** | Usuário não percebe proximidade do limite até banner ou bloqueio. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Unificar variant `usage` no Dashboard ou colorir ≥80%. |
| **Arquivos prováveis** | `src/pages/Dashboard.js`, `src/components/common/StatCard.jsx` |

### M-04 — Menu do ProjectCard sem fechar ao clicar fora

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Página/rota** | `/projects` |
| **Problema** | Menu custom sem click-outside/Escape; `ImageCard` usa Radix `DropdownMenu`. |
| **Impacto** | Menu permanece aberto; comportamento inconsistente. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Migrar para `DropdownMenu` ou adicionar listener. |
| **Arquivos prováveis** | `src/components/common/ProjectCard.jsx` |

### M-05 — Lista de projetos sem editar rápido

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Página/rota** | `/projects` |
| **Problema** | Menu do card: “Ver projeto” e “Excluir” apenas. |
| **Impacto** | Fluxo extra para renomear ou mudar visibilidade. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Item “Editar” no menu ou modal inline. |
| **Arquivos prováveis** | `src/components/common/ProjectCard.jsx` |

### M-06 — Dashboard ainda usa PageHeader sem stack mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Problema** | `PageHeader` com `flex justify-between` quando há actions; Projetos/Imagens/Plano migraram para `PageActionHeader` responsivo. |
| **Impacto** | Inconsistência visual e risco de quebra em telas estreitas se actions forem reintroduzidas no header. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Migrar Dashboard para `PageActionHeader` ou alinhar `PageHeader` com `flex-col sm:flex-row`. |
| **Arquivos prováveis** | `src/pages/Dashboard.js`, `src/components/common/PageHeader.jsx` |

### M-07 — Botão “Gerenciar hotspots” sem indicação prévia Pro

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` |
| **Problema** | Botão visível; Starter abre `PremiumFeatureModal` só ao clicar. |
| **Impacto** | Clique extra e confusão. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Badge “Pro” ou estilo locked no botão. |
| **Arquivos prováveis** | `src/pages/Viewer.js` |

### M-08 — Painel de hotspots sobrepõe panorama em mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` |
| **Problema** | `HotspotManagerPanel` é `absolute top-4 right-4 w-72` (com `max-w-[calc(100vw-2rem)]`); ainda cobre área significativa em telas pequenas. |
| **Impacto** | Dificulta posicionar hotspots e visualizar resultado. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Bottom sheet em mobile ou modo fullscreen de gestão. |
| **Arquivos prováveis** | `src/components/viewer/HotspotManagerPanel.jsx` |

### M-09 — Header do viewer alto em mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId`, `/share/image/:imageId` |
| **Problema** | Título em `order-3 w-full basis-full` abaixo de `sm` — header ocupa múltiplas linhas. |
| **Impacto** | Menos área útil para o panorama. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Header compacto: título truncado inline. |
| **Arquivos prováveis** | `src/pages/Viewer.js`, `src/pages/PublicImage.js` |

### M-10 — Viewer autenticado: subtítulo “Projeto” para imagem solta

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` (sem projectId) |
| **Problema** | Fallback `{project?.title \|\| "Projeto"}`. |
| **Impacto** | Contexto enganoso. |
| **Prioridade** | Médio |
| **Sugestão de correção** | “Imagens soltas” ou ocultar subtítulo. |
| **Arquivos prováveis** | `src/pages/Viewer.js` |

### M-11 — Portfólio desabilitado: mensagem pouco específica

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Portfólio público |
| **Página/rota** | `/u/:slug` |
| **Problema** | `disabled` e `not_found` têm copy distinta, mas `disabled` não explica que o proprietário desativou vs. slug inválido de forma tão clara quanto poderia. |
| **Impacto** | Visitante pode achar link quebrado. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Copy: *“O proprietário desativou este portfólio”* com tom distinto de “Usuário não encontrado”. |
| **Arquivos prováveis** | `src/pages/PublicPortfolio.js` |

### M-12 — Portfólio sem logo do escritório

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Portfólio público |
| **Página/rota** | `/u/:slug` |
| **Problema** | Exibe nome e bio; não renderiza `companyLogo`. |
| **Impacto** | Identidade visual incompleta. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Exibir logo quando disponível (após A-07). |
| **Arquivos prováveis** | `src/pages/PublicPortfolio.js`, `src/services/users/userService.js` |

### M-13 — Configurações sem card do plano atual

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Página/rota** | `/settings` |
| **Problema** | Plano só na sidebar e `/plan`. |
| **Impacto** | Usuário busca informação no lugar errado. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Card “Plano atual” com link para consumo. |
| **Arquivos prováveis** | `src/pages/Settings.js` |

### M-14 — Preview de URL do portfólio sem domínio em dev

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Página/rota** | `/settings` |
| **Problema** | `buildPortfolioUrl` retorna path relativo sem `REACT_APP_PUBLIC_URL`. |
| **Impacto** | Usuário pode não entender URL final em produção. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Fallback `window.location.origin` ou hint explicativo. |
| **Arquivos prováveis** | `src/utils/slug.js`, `src/pages/Settings.js` |

### M-16 — Senha mínima sem orientação no cadastro

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Página/rota** | `/register` |
| **Problema** | `minLength={6}` sem hint visível. |
| **Impacto** | Falhas de cadastro sem clareza prévia. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Texto “Mínimo 6 caracteres” abaixo do campo. |
| **Arquivos prováveis** | `src/pages/SignUp.js` |

### M-17 — `PlanUpgradeHint` ainda em modais de compartilhamento

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento |
| **Página/rota** | `ShareProjectDialog`, `ShareImageDialog` |
| **Problema** | Hint de cobrança em breve aparece ao tentar visibilidade premium no Starter. |
| **Impacto** | Ruído em fluxo já bloqueado por plano; pode ser redundante com `PremiumFeatureModal`. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Unificar mensagem ou remover hint duplicado nos dialogs. |
| **Arquivos prováveis** | `src/components/projects/ShareProjectDialog.jsx`, `src/components/images/ShareImageDialog.jsx` |

### M-18 — Página de Ajuda placeholder

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | App autenticado |
| **Página/rota** | `/help` |
| **Problema** | Copy “Em breve…” sem canal de contato. |
| **Impacto** | Dead-end para suporte. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Email/WhatsApp de suporte beta ou link para FAQ da landing. |
| **Arquivos prováveis** | `src/pages/Help.js` |

### M-19 — Visibilidade “Público” com comportamentos diferentes

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento |
| **Página/rota** | `ShareImageDialog` vs `ShareProjectDialog` |
| **Problema** | Mesmo rótulo “Público” com descriptions diferentes (imagem não entra no portfólio). |
| **Impacto** | Confusão terminológica. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Renomear opção de imagem ou tooltip comparativo. |
| **Arquivos prováveis** | `src/components/images/ShareImageDialog.jsx`, `src/utils/visibility.js` |

### M-20 — ImageCard público sem truncate

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Cards públicos / dashboard |
| **Página/rota** | Grids com variant `public` |
| **Problema** | `<h3>` sem `truncate`/`line-clamp`; variant `private` usa `break-words`. |
| **Impacto** | Títulos longos quebram layout. |
| **Prioridade** | Médio |
| **Sugestão de correção** | `line-clamp-2` ou `truncate` no variant público. |
| **Arquivos prováveis** | `src/components/common/ImageCard.jsx` |

### M-21 — Tooltip de limite inacessível em touch

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Planos e limites |
| **Página/rota** | `PlanLimitButton` disabled |
| **Problema** | Tooltip só em hover. |
| **Impacto** | Botão disabled sem explicação no celular. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Toast ao toque ou label visível; garantir `UpgradePrompt` nas telas críticas. |
| **Arquivos prováveis** | `src/components/plans/PlanLimitButton.jsx` |

---

## Problemas Baixos

### B-01 — CTAs com copy inconsistente na landing

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Problema** | “Começar Gratuitamente” vs “Começar grátis” / “Começar gratuitamente”. |
| **Prioridade** | Baixo |
| **Sugestão de correção** | Unificar uma variante em `landingContent.js` e componentes. |
| **Arquivos prováveis** | `src/components/landing/LandingHero.jsx`, `LandingHeader.jsx`, `landingContent.js` |

### B-02 — Hero e Showcase com placeholder visual redundante

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Problema** | Mesmo padrão Orbit quando demo indisponível. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `LandingHero.jsx`, `LandingShowcase.jsx` |

### B-03 — Seção portfólio: domínio hardcoded no mockup

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Problema** | Copy `fivi360.com/u/seu-nome` em `landingContent.js`. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/config/landingContent.js`, `LandingPortfolio.jsx` |

### B-04 — Logout sem feedback de erro

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Problema** | Falha em `signOut` só reseta estado — sem toast. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/components/Layout.js` |

### B-05 — Auth inputs não usam componente Input shadcn

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Problema** | `<input>` nativo em Login/SignUp/ForgotPassword. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/pages/Login.js`, `SignUp.js`, `ForgotPassword.js` |

### B-06 — ProjectCard: badge de visibilidade vs. menu

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Problema** | Badge no canto superior direito pode competir visualmente com capas claras. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/components/common/ProjectCard.jsx` |

### B-07 — Exclusão de projeto não menciona imagens

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Problema** | Modal não esclarece destino das imagens do projeto. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/pages/Projects.js`, `ProjectDetail.js` |

### B-08 — Viewer: sem indicador “2 de 5”

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Problema** | Navegação prev/next sem contador. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/components/viewer/ViewerNavControls.jsx` |

### B-09 — Hotspot info: texto plano

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Problema** | Descrição sem markdown/links. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/components/viewer/HotspotInfoDialog.jsx` |

### B-10 — Footer público minimalista

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Páginas públicas |
| **Problema** | Só “Powered by FIVI360”. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `PublicProject.js`, `PublicPortfolio.js` |

### B-11 — Settings: email readonly sem explicação

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Problema** | Campo disabled sem hint. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/pages/Settings.js` |

### B-12 — Campos URL sem validação client-side

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Problema** | Redes sociais aceitam qualquer string. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/pages/Settings.js` |

### B-13 — Enterprise na landing sem CTA de contato

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pricing |
| **Problema** | CTA “Assinar Enterprise” leva ao fluxo de upgrade igual ao Professional; não há “Falar com a gente” dedicado. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `landingContent.js`, `LandingPricing.jsx` |

### B-14 — Sidebar: item ativo só match exato

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | App autenticado |
| **Problema** | `/projects/abc` não destaca “Projetos”. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | `src/components/Layout.js` |

### B-15 — Animação fade-in em toda navegação

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Global |
| **Problema** | Classe `fade-in` pode causar flash perceptível. |
| **Prioridade** | Baixo |
| **Arquivos prováveis** | Múltiplas pages, `App.css` |

---

## Novos problemas encontrados

Problemas introduzidos ou expostos pelos refinamentos da Sprint 11.5 (não listados na auditoria anterior).

### N-01 — Banner Starter do Dashboard comentado + imports mortos

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Problema** | Bloco `StarterPlanInfoBanner` / `PlanUpgradeHint` está comentado (linhas 62–71), mas imports permanecem. Usuários Starter sem limite atingido não veem orientação proativa sobre limites do plano. |
| **Impacto** | Regressão de UX informativa planejada; código morto confunde manutenção. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Reativar `StarterPlanInfoBanner` para Starter sem limite OU remover imports; não deixar comentado indefinidamente. |
| **Arquivos prováveis** | `src/pages/Dashboard.js`, `src/components/plans/StarterPlanInfoBanner.jsx` |

### N-02 — Modal de upgrade: botões “Assinar” parecem checkout ativo

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Planos |
| **Página/rota** | `UpgradePlanModal` |
| **Problema** | Botões primários “Assinar {plano}” habilitados disparam apenas toast; aviso “Pagamentos em breve” fica abaixo dos cards. |
| **Impacto** | Affordance enganosa pior que botões disabled da Sprint 11. |
| **Prioridade** | Alto (subconjunto de A-02) |
| **Sugestão de correção** | Estilo secondary/disabled + CTA único “Avise-me quando disponível”. |
| **Arquivos prováveis** | `src/components/plans/UpgradePlanModal.jsx` |

### N-03 — “Cancelar assinatura” visível sem billing ativo

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Plano |
| **Página/rota** | `/plan` — Gerenciar assinatura |
| **Problema** | Usuários não-Starter veem “Cancelar assinatura”; `cancelSubscription` no client retorna mensagem genérica sem integração real. |
| **Impacto** | Sensação de assinatura ativa quando billing ainda não está ligado. |
| **Prioridade** | Médio |
| **Sugestão de correção** | Ocultar ação até `billing.subscriptionStatus === active` ou rotular como simulação. |
| **Arquivos prováveis** | `src/pages/Plan.js`, `src/services/billing/billingService.js` |

### N-04 — Cadastro Google sem checkbox inline (aceite só no gate)

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Página/rota** | `/register` — Google |
| **Problema** | `handleGoogleSignIn` não exige `acceptedLegal` no formulário; aceite ocorre depois via `LegalConsentModal` para perfis sem consentimento. |
| **Impacto** | Comportamento correto legalmente se o gate sempre bloquear, mas inconsistência com fluxo email (checkbox antes). Documentar/testar primeiro login Google. |
| **Prioridade** | Baixo |
| **Sugestão de correção** | Exigir checkbox também no Google OU documentar fluxo único via modal. |
| **Arquivos prováveis** | `src/pages/SignUp.js`, `src/components/legal/LegalConsentGate.jsx` |

---

## Pendências remanescentes

Itens da Sprint 11 que **permanecem abertos** (sem mudança material ou só melhoria parcial):

| ID | Resumo | Status Sprint 11.5 |
|----|--------|-------------------|
| C-01 | Demo landing configurada | Aberto |
| C-04 | Favicon | Aberto |
| A-01 | Hero com demo real | Aberto |
| A-02 | Upgrade sem conversão | Parcial (modal + deep link; pagamento ausente) |
| A-04 | KPI links compartilhados | Aberto |
| A-05 | Share imagem no projeto | Aberto |
| A-06 | Header projeto mobile | Aberto |
| A-07 | Upload logo | Aberto |
| A-08 | Label voltar viewer público | Aberto |
| A-09 | Portfólio demo `/u/fivi360` | Aberto (depende ops) |
| A-10 | OG image | Aberto |
| M-01 | KPIs dashboard sem progresso | Aberto |
| M-04–M-21 | Itens médios listados acima | Abertos (exceto M-02, M-03, M-15, M-17 no Dashboard, M-22) |
| B-01–B-15 | Itens baixos | Majoritariamente abertos |

---

## Quick Wins

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Configurar `LANDING_DEMO.projectId` + conta demo | Baixo (ops) | Muito alto |
| 2 | Adicionar `favicon.ico` em `public/` | Baixo | Médio |
| 3 | Renomear KPI “Links compartilhados” | Baixo | Médio |
| 4 | Hint senha 6 chars no SignUp | Baixo | Médio |
| 5 | Viewer: fallback “Imagens soltas” | Baixo | Médio |
| 6 | `PublicImage`: label voltar condicional | Baixo | Alto |
| 7 | Desabilitar/renomear botões “Assinar” no modal | Baixo | Alto |
| 8 | Reativar ou remover `StarterPlanInfoBanner` comentado | Baixo | Médio |
| 9 | `ImageCard` public: `line-clamp-2` | Baixo | Médio |
| 10 | Descomentar OG meta + `og-image.png` | Baixo | Médio |

---

## Ordem sugerida das próximas sprints

### Sprint 12 — Go-live beta (bloqueadores + conversão)

1. C-01 Demo landing + A-09 Portfólio demo  
2. C-04 Favicon (+ A-10 OG image)  
3. A-02 / N-02 Comunicação honesta de upgrade (modal + CTAs)  
4. A-04 KPI correto  
5. A-05 Share imagem no `ProjectDetail`  
6. N-01 Banner Starter no Dashboard (decisão produto)

### Sprint 13 — Mobile e confiança

7. A-06 Header projeto mobile  
8. M-04 Menu `ProjectCard` → DropdownMenu  
9. M-08 / M-09 Viewer mobile (painel + header)  
10. A-07 Logo upload ou ocultar  
11. M-01 KPIs Dashboard com barras de uso  
12. M-13 Plano em Settings  

### Sprint 14 — Polimento pré-GA

13. M-18 Help com contato  
14. A-01 Hero com mídia real  
15. Billing real (substitui A-02)  
16. Demais itens baixos e M-19–M-21  

---

## Critérios atualizados para Beta

### Obrigatório (go / no-go)

- [x] Termos de Uso e Política de Privacidade publicados  
- [x] Aceite legal no cadastro (email) e gate para usuários antigos / Google  
- [x] Página 404 funcional  
- [x] Limites de plano consistentes em Dashboard, Projects e NewProject  
- [x] Fluxo landing → cadastro → `/plan?upgrade=` preservado  
- [ ] Demo interativa funcional na landing (C-01)  
- [ ] Favicon presente (C-04)  
- [ ] Mensagem/CTA de upgrade sem affordance de checkout falso (A-02, N-02)  
- [ ] Fluxos core testados manualmente: cadastro → projeto → upload → viewer → link público  
- [ ] Portfólio demo `/u/fivi360` acessível se promovido na landing (A-09)

### Desejável (beta fechado)

- [x] Login com Google  
- [x] Empty states e headers padronizados (Projetos, Imagens, Plano)  
- [ ] OG image para compartilhamento social  
- [ ] Share de imagem individual no detalhe do projeto  
- [ ] KPIs do Dashboard com indicadores visuais de limite  
- [ ] Mobile: header de projeto e viewer usáveis  
- [ ] Help com canal de contato mínimo  

### Pós-beta (GA)

- [ ] Billing / upgrade com pagamento real  
- [ ] Upload de logo  
- [ ] Página Help completa  
- [ ] Indicadores “N de M” no viewer  
- [ ] Hotspot panel mobile otimizado  

---

## Apêndice — Mapa de rotas (estado Sprint 11.5)

| Rota | Guard | Status UX |
|------|-------|-----------|
| `/` | LandingRoute | ⚠️ Demo pendente (C-01) |
| `/login`, `/register` | PublicRoute | ✅ Email + Google; termos no cadastro email |
| `/forgot-password` | PublicRoute | ✅ OK |
| `/termos`, `/privacidade` | Público | ✅ Conteúdo + layout legal |
| `/dashboard` | Protected + LegalGate | ⚠️ KPI, banner Starter comentado |
| `/projects`, `/images`, `/plan` | Protected | ✅ Headers/empty states; plano refinado |
| `/projects/new` | Protected | ✅ Bloqueio no limite |
| `/projects/:id` | Protected | ⚠️ Mobile, share imagem |
| `/viewer/:imageId` | Protected | ⚠️ Mobile hotspots |
| `/share/project/:id`, `/share/image/:id` | Público | ⚠️ Label voltar (imagem solta) |
| `/u/:slug` | Público | ⚠️ Depende config demo |
| `*` | — | ✅ NotFound |

---

## Apêndice — Checklist por área auditada

### 1. Landing

| Item | Status |
|------|--------|
| Estrutura modular (Hero, Features, Demo, Pricing, FAQ, Footer) | ✅ |
| Demo real | ❌ C-01 |
| CTAs e âncoras | ✅ |
| Planos com fluxo `?plan=` / upgrade | ✅ |
| FAQ e footnote honesta sobre billing | ✅ |
| Footer com links legais | ✅ |
| Responsividade base | ✅ |
| Hero com mídia real | ❌ A-01 |

### 2. Autenticação

| Item | Status |
|------|--------|
| Login email/senha | ✅ |
| Login Google | ✅ |
| Cadastro + checkbox termos | ✅ |
| Modal aceite usuários antigos | ✅ |
| Recuperação de senha | ✅ |
| Logout | ✅ (sem toast erro — B-04) |

### 3. Páginas legais

| Item | Status |
|------|--------|
| Conteúdo `/termos`, `/privacidade` | ✅ |
| Layout desktop (sidebar índice) | ✅ |
| Índice mobile collapsible | ✅ |
| Scroll no artigo | ✅ |
| Links no cadastro/footer | ✅ |

### 4. Dashboard

| Item | Status |
|------|--------|
| KPIs exibidos | ✅ |
| Banner Starter informativo | ⚠️ Comentado (N-01) |
| Botões seções recentes com limite | ✅ |
| Empty states padronizados | ✅ |
| Banner limite atingido | ✅ `UpgradePrompt` |
| KPI com progresso visual | ❌ M-01 |
| Header padronizado | ⚠️ ainda `PageHeader` (M-06) |

### 5. Projetos e Imagens

| Item | Status |
|------|--------|
| `PageActionHeader` | ✅ |
| `EmptyStateCard` | ✅ |
| Limites de plano na UI | ✅ |
| Menu ProjectCard | ⚠️ M-04 |
| Upload / mover / compartilhar (Imagens) | ✅ |
| Share imagem no projeto | ❌ A-05 |

### 6. Plano/Billing

| Item | Status |
|------|--------|
| Header + banner plano atual | ✅ |
| Consumo com barras | ✅ |
| Gerenciar assinatura (estrutura) | ✅ |
| Modal upgrade + `?upgrade=` | ✅ |
| Histórico de cobrança (empty) | ✅ preparado |
| Sem banner antigo PlanUpgradeHint | ✅ |
| Pagamento real | ❌ A-02 |

### 7. Viewer e Hotspots

| Item | Status |
|------|--------|
| Viewer autenticado | ✅ |
| Viewer público | ✅ |
| Hotspots info/navegação | ✅ |
| Painel mobile | ⚠️ M-08 |
| Navegação entre imagens | ✅ (sem contador — B-08) |

### 8. Portfólio e Compartilhamento

| Item | Status |
|------|--------|
| `/u/:slug` | ✅ (depende dados) |
| `/share/project/:id`, `/share/image/:id` | ✅ |
| Regras private/shared/public | ✅ |
| Logo no portfólio | ❌ M-12 |

---

*Documento gerado na Sprint 11.5 — auditoria somente leitura. Nenhum arquivo de código foi alterado.*
