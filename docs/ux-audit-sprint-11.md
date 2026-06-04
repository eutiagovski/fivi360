# Sprint 11 — Auditoria UX FIVI360

**Data:** 03/06/2026  
**Escopo:** Fluxos principais do produto (landing → auth → app autenticado → viewer → páginas públicas)  
**Método:** Revisão estática de código, rotas, componentes e copy — sem alterações no repositório  
**Versão auditada:** pós-rebuild da landing, core funcional completo, pré-beta

---

## Resumo Executivo

O FIVI360 chegou a um nível de maturidade sólido para beta fechado: identidade visual coerente, fluxos principais implementados de ponta a ponta, enforcement de planos no backend e UX de limites parcialmente refletida na interface. A arquitetura de rotas, guards de auth, viewer 360° com Pannellum, hotspots, compartilhamento e portfólio público está funcional e bem organizada.

Os bloqueadores mais relevantes para o beta concentram-se em **configuração pendente da demo na landing**, **páginas legais placeholder**, **fluxo de upgrade sem saída útil** e **inconsistências de limites de plano** entre telas. Há também polimento importante em mobile (headers densos, menus sem fechar ao clicar fora) e lacunas de funcionalidade aparente (upload de logo, compartilhar imagem dentro do projeto).

**Estimativa:** ~4 problemas críticos, ~12 altos, ~22 médios, ~15 baixos.

**Recomendação geral:** Resolver críticos e altos da landing + planos + inconsistências de limite antes de abrir beta; médios e baixos podem entrar em sprints paralelos de polimento.

---

## Pontos Fortes

1. **Design system consistente** — Paleta escura (#050505), tipografia light, botões rounded-full e cards zinc-900/50 aplicados de forma uniforme em landing, auth e app autenticado.
2. **Landing estruturada** — Seções modulares com copy centralizada (`landingContent.js`), navegação por âncoras, menu mobile via Sheet e demo lazy-loaded com `useInViewport` (performance).
3. **Auth enxuta e clara** — `AuthLayout`/`AuthCard` compartilhados; mensagens de erro amigáveis; recuperação de senha com resposta genérica (segurança).
4. **Enforcement de planos robusto** — `planLimits.js` como fonte única; validação server-side em services; UI com `PlanLimitButton`, `UpgradePrompt` e `PremiumFeatureModal`.
5. **Viewer 360° completo** — Navegação entre imagens, hotspots info/navegação, painel de gestão, versão pública espelhada; controles adaptados a mobile (`hidden sm:inline`).
6. **Compartilhamento bem modelado** — Três níveis de visibilidade (`private` / `shared` / `public`); aviso explícito quando link não funciona em modo privado; URLs limpas (`/share/project/:id`, `/share/image/:imageId`).
7. **Empty states presentes** — Projetos, imagens (projeto e soltas), portfólio e galeria pública têm estados vazios com copy orientativa.
8. **Responsividade base sólida** — Sidebar off-canvas, grids adaptativos, padding escalonado (`p-8 md:p-12 lg:p-16`) em todas as páginas autenticadas.
9. **Slug com feedback em tempo real** — Configurações validam disponibilidade com debounce e preview de URL.
10. **Páginas públicas limpas** — Shell minimalista (logo FIVI360 + conteúdo + footer "Powered by"), sem distrações de painel admin.

---

## Problemas Críticos

### C-01 — Demo da landing não configurada

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/` — seção `#demo` (`LandingShowcase`) |
| **Descrição** | `landingDemo.js` mantém `projectId: "COLOCAR_ID_DO_PROJETO_AQUI"`. O hook `useLandingDemo` trata esse valor como indisponível e exibe fallback *"Demonstração temporariamente indisponível"*. CTAs "Abrir projeto demo" e links do Hero apontam para URLs inválidas. |
| **Impacto** | Visitante não experimenta o produto real na principal página de conversão; promessa do Hero ("Ver Demonstração") não se cumpre. |
| **Prioridade** | Crítico |
| **Sugestão** | Criar projeto demo público com imagens e hotspots; atualizar `LANDING_DEMO.projectId` e paths; validar portfolio slug `fivi360`. |
| **Arquivos** | `src/config/landingDemo.js`, `src/hooks/useLandingDemo.js`, `src/components/landing/LandingShowcase.jsx` |

### C-02 — Páginas legais são placeholders

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/termos`, `/privacidade` |
| **Descrição** | `LegalPlaceholder.jsx` exibe apenas *"Esta página será publicada em breve"*. Links no footer da landing apontam para essas rotas. |
| **Impacto** | Impede conformidade básica para beta (LGPD, termos de uso); quebra confiança em cadastro. |
| **Prioridade** | Crítico |
| **Sugestão** | Publicar conteúdo legal mínimo ou remover links do footer até publicação. |
| **Arquivos** | `src/pages/LegalPlaceholder.jsx`, `src/components/landing/LandingFooter.jsx`, `src/App.js` |

### C-03 — Rota 404 inexistente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Global |
| **Página/rota** | Qualquer URL inválida (ex.: `/dashboardx`, `/share/project/invalido`) |
| **Descrição** | `App.js` não define rota catch-all. URLs desconhecidas renderizam tela em branco. |
| **Impacto** | Usuário fica sem orientação; links quebrados parecem bug do produto. |
| **Prioridade** | Crítico |
| **Sugestão** | Adicionar `<Route path="*" element={<NotFound />} />` com mensagem e links para `/` e `/dashboard`. |
| **Arquivos** | `src/App.js` |

### C-04 — Favicon ausente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Global |
| **Página/rota** | Todas |
| **Descrição** | `index.html` referencia `favicon.ico`, mas não existe em `public/`. Comentário no HTML indica pendência. |
| **Impacto** | Aba do browser sem ícone; aparência não profissional em bookmarks e compartilhamentos. |
| **Prioridade** | Crítico (para go-live; alto para beta fechado) |
| **Sugestão** | Adicionar `favicon.ico` e `og-image.png` em `public/`. |
| **Arquivos** | `public/index.html`, `public/` |

---

## Problemas Altos

### A-01 — Hero exibe placeholder estático, não demo real

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/` — `LandingHero` |
| **Descrição** | Lado direito do Hero mostra ícone Orbit genérico com texto *"Experiência 360° interativa"*, sem viewer embutido. A demo real só aparece mais abaixo (e depende de C-01). |
| **Impacto** | Primeira impressão não transmite valor do produto; discrepância entre promessa visual e entrega. |
| **Prioridade** | Alto |
| **Sugestão** | Embutir mini-viewer no Hero (mesmo projeto demo) ou usar GIF/video loop de navegação 360°. |
| **Arquivos** | `src/components/landing/LandingHero.jsx` |

### A-02 — Fluxo de upgrade sem conversão possível

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Planos e limites |
| **Página/rota** | `/plan`, modais `PremiumFeatureModal`, `UpgradePrompt` em todo o app |
| **Descrição** | Todos os CTAs "Fazer Upgrade" redirecionam para `/plan`, onde botões pagos exibem *"Em breve"* e estão disabled. `PlanUpgradeHint` repete que cobrança não está disponível. |
| **Impacto** | Usuário Starter atinge limite ou tenta recurso premium e não tem caminho de resolução — frustração e possível abandono. |
| **Prioridade** | Alto |
| **Sugestão** | Até billing existir: lista de espera, contato comercial, ou trial manual; desabilitar CTAs de upgrade com copy honesta (*"Entre na lista"*) em vez de prometer upgrade imediato. |
| **Arquivos** | `src/pages/Plan.js`, `src/components/plans/UpgradePrompt.jsx`, `src/components/plans/PremiumFeatureModal.jsx`, `src/components/plans/PlanUpgradeHint.jsx` |

### A-03 — Dashboard permite criar projeto sem verificar limite

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Descrição** | Botão "Criar projeto" em "Projetos recentes" é sempre um `Link` ativo para `/projects/new`, sem checar `canCreateProject`. Em `/projects`, o mesmo botão usa `PlanLimitButton` quando no limite. |
| **Impacto** | Usuário no limite Starter é levado ao formulário, vê hint e botão disabled — fluxo confuso e inconsistente. |
| **Prioridade** | Alto |
| **Sugestão** | Reutilizar mesma lógica de `/projects`: `PlanLimitButton` + `UpgradePrompt` no Dashboard. |
| **Arquivos** | `src/pages/Dashboard.js`, `src/pages/Projects.js` |

### A-04 — KPI "Links compartilhados" enganoso

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Descrição** | StatCard conta `projects.filter(p => p.visibility !== 'private').length` — ou seja, projetos com visibilidade shared/public, não links efetivamente gerados ou compartilhados. Imagens soltas compartilhadas não entram na conta. |
| **Impacto** | Métrica não reflete realidade; usuário pode interpretar errado o uso do produto. |
| **Prioridade** | Alto |
| **Sugestão** | Renomear para "Projetos compartilháveis" ou calcular imagens+projetos com visibilidade ≠ private. |
| **Arquivos** | `src/pages/Dashboard.js` |

### A-05 — Compartilhar imagem indisponível no detalhe do projeto

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Detalhe do projeto |
| **Página/rota** | `/projects/:id` |
| **Descrição** | `ImageCard` no projeto recebe handlers de editar, substituir, mover e excluir, mas **não** `onShare`. Compartilhamento existe só no nível do projeto (`ShareProjectDialog`) ou em imagens soltas (`/images`). |
| **Impacto** | Usuário que quer link de uma imagem específica dentro do projeto precisa ir em Imagens soltas ou inferir que o link do projeto basta. |
| **Prioridade** | Alto |
| **Sugestão** | Adicionar `ShareImageDialog` no `ProjectDetail`, igual à página Imagens. |
| **Arquivos** | `src/pages/ProjectDetail.js`, `src/components/images/ShareImageDialog.jsx`, `src/components/common/ImageCard.jsx` |

### A-06 — Header do projeto quebra em mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Detalhe do projeto |
| **Página/rota** | `/projects/:id` |
| **Descrição** | Barra de ações (Editar, Compartilhar, Excluir) fica ao lado do título em `flex items-start justify-between` sem wrap dedicado. Em telas estreitas, botões competem com título longo. |
| **Impacto** | Ações principais ficam espremidas ou fora da viewport; difícil compartilhar/editar no celular. |
| **Prioridade** | Alto |
| **Sugestão** | Empilhar ações abaixo do título em mobile; menu overflow (⋯) para ações secundárias. |
| **Arquivos** | `src/pages/ProjectDetail.js` |

### A-07 — Upload de logo não funcional

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Página/rota** | `/settings` |
| **Descrição** | Seção "Logo do escritório" exibe botão "Fazer upload" sem handler — placeholder visual. `storageService` existe mas não está conectado. Avatar no header também depende de `companyLogo` que nunca é salvo. |
| **Impacto** | Promessa de personalização não cumprida; portfólio e header sem identidade visual do escritório. |
| **Prioridade** | Alto |
| **Sugestão** | Implementar upload ou ocultar seção até estar pronta. |
| **Arquivos** | `src/pages/Settings.js`, `src/services/storage/storageService.js`, `src/components/layout/AppHeader.jsx` |

### A-08 — Viewer público: imagem solta sem destino de "Voltar"

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento público |
| **Página/rota** | `/share/image/:imageId` (imagem sem projeto) |
| **Descrição** | `backHref` cai em `/` quando não há projeto. Botão "Voltar ao projeto" aparece mesmo sem contexto de projeto; em erro, link só renderiza se `project?.id`. |
| **Impacto** | Visitante de link direto de imagem solta é enviado à landing ao voltar — pode ser OK, mas label "Voltar ao projeto" é incorreto. |
| **Prioridade** | Alto |
| **Sugestão** | Label condicional: "Voltar ao projeto" vs "Início"; ou ocultar botão quando `!project`. |
| **Arquivos** | `src/pages/PublicImage.js` |

### A-09 — Portfólio demo da landing pode não existir

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pública |
| **Página/rota** | `/u/fivi360` (link em `LandingPortfolio`, `LandingShowcase`) |
| **Descrição** | `LANDING_DEMO.portfolioPath` aponta para `/u/fivi360`, mas depende de usuário real com slug, `portfolioEnabled` e projetos públicos configurados. |
| **Impacto** | CTAs "Ver portfólio FIVI360" levam a "Usuário não encontrado" ou portfólio desabilitado. |
| **Prioridade** | Alto |
| **Sugestão** | Garantir conta demo com portfólio ativo ou remover CTAs até configuração. |
| **Arquivos** | `src/config/landingDemo.js`, `src/components/landing/LandingPortfolio.jsx`, `src/components/landing/LandingShowcase.jsx` |

### A-10 — OG/Twitter image ausente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing / compartilhamento social |
| **Página/rota** | `/`, links públicos |
| **Descrição** | Meta tags OG/Twitter existem, mas `og:image` está comentado; arquivo `og-image.png` não está em `public/`. |
| **Impacto** | Preview pobre ao compartilhar landing ou links no WhatsApp/LinkedIn. |
| **Prioridade** | Alto |
| **Sugestão** | Criar imagem OG 1200×630 e descomentar meta tags. |
| **Arquivos** | `public/index.html`, `public/og-image.png` (criar) |

### A-11 — Cadastro sem aceite de termos

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Página/rota** | `/register` |
| **Descrição** | Formulário de cadastro não exige aceite de Termos ou Política de Privacidade (links nem checkbox). |
| **Impacto** | Lacuna legal para beta público; especialmente crítico combinado com C-02. |
| **Prioridade** | Alto |
| **Sugestão** | Checkbox obrigatório com links para `/termos` e `/privacidade` após conteúdo real. |
| **Arquivos** | `src/pages/SignUp.js` |

### A-12 — Rota `/projects/new` acessível no limite

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Página/rota** | `/projects/new` |
| **Descrição** | URL direta ou link do Dashboard abre formulário completo; submit disabled mas usuário preenche dados sem poder salvar. |
| **Impacto** | Tempo perdido e frustração; sensação de bug. |
| **Prioridade** | Alto |
| **Sugestão** | Redirect para `/projects` com banner quando `!canCreateProject`, ou bloquear rota. |
| **Arquivos** | `src/pages/NewProject.js`, `src/pages/Dashboard.js` |

---

## Problemas Médios

### M-01 — KPIs do Dashboard sem alertas visuais de uso

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Descrição** | `StatCard` variant `metricUsage` mostra valor/limite em branco sempre. Página `/plan` usa variant `usage` com barra de progresso e cores amber/red via `getUsageVisualClasses`. |
| **Impacto** | Usuário não percebe proximidade do limite até banner de warning ou bloqueio. |
| **Prioridade** | Médio |
| **Sugestão** | Unificar com barras de progresso ou colorir valores ≥80%. |
| **Arquivos** | `src/pages/Dashboard.js`, `src/components/common/StatCard.jsx`, `src/utils/planUsageAlerts.js` |

### M-02 — Empty state de imagens no Dashboard sem CTA

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Descrição** | Empty de imagens recentes só tem texto; empty de projetos tem texto simples; página Imagens tem botão "Adicionar imagem". |
| **Impacto** | Usuário novo não sabe próximo passo a partir do Dashboard. |
| **Prioridade** | Médio |
| **Sugestão** | Botões "Adicionar imagem" → `/images` e "Criar projeto" no empty respectivo. |
| **Arquivos** | `src/pages/Dashboard.js` |

### M-03 — Empty states inconsistentes (projetos vs imagens)

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard |
| **Página/rota** | `/dashboard` |
| **Descrição** | Imagens vazias usam card estilizado (`bg-zinc-900/50 border rounded-2xl py-16`); projetos vazios são `<p className="text-zinc-400">` sem card. |
| **Impacto** | Hierarquia visual desigual; sensação de incompletude na seção de projetos. |
| **Prioridade** | Médio |
| **Sugestão** | Padronizar ambos com mesmo componente de empty state. |
| **Arquivos** | `src/pages/Dashboard.js` |

### M-04 — Menu do ProjectCard sem fechar ao clicar fora

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Página/rota** | `/projects` |
| **Descrição** | `ProjectCard` usa menu custom (não Radix Dropdown). Toggle manual sem listener de click-outside ou Escape. |
| **Impacto** | Menu permanece aberto; cliques acidentais; comportamento diferente do menu de imagens (DropdownMenu). |
| **Prioridade** | Médio |
| **Sugestão** | Migrar para `DropdownMenu` como `ImageCard` ou adicionar click-outside. |
| **Arquivos** | `src/components/common/ProjectCard.jsx` |

### M-05 — Lista de projetos sem editar rápido

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Página/rota** | `/projects` |
| **Descrição** | Menu do card só oferece "Ver projeto" e "Excluir". Edição exige entrar no detalhe. |
| **Impacto** | Fluxo extra para ações simples (renomear, mudar visibilidade). |
| **Prioridade** | Médio |
| **Sugestão** | Adicionar "Editar" no menu ou modal inline. |
| **Arquivos** | `src/components/common/ProjectCard.jsx`, `src/pages/Projects.js` |

### M-06 — PageHeader com actions quebra layout mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos, Imagens, Dashboard |
| **Página/rota** | Várias |
| **Descrição** | `PageHeader` usa `flex items-center justify-between` com título grande (até `text-6xl`) e botão de ação na mesma linha, sem `flex-wrap` ou stack mobile. |
| **Impacto** | Título e CTA competem horizontalmente; botão pode encolher ou sair da tela. |
| **Prioridade** | Médio |
| **Sugestão** | `flex-col sm:flex-row` com gap; botão full-width em mobile. |
| **Arquivos** | `src/components/common/PageHeader.jsx` |

### M-07 — Botão "Gerenciar hotspots" visível no Starter

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` |
| **Descrição** | Botão sempre visível; ao clicar abre `PremiumFeatureModal`. Funciona, mas expõe recurso bloqueado sem indicação prévia (badge "Pro"). |
| **Impacto** | Clique extra e possível confusão ("por que não funciona?"). |
| **Prioridade** | Médio |
| **Sugestão** | Badge "Pro" no botão ou tooltip; ou estilo secundário locked. |
| **Arquivos** | `src/pages/Viewer.js`, `src/components/plans/PremiumFeatureModal.jsx` |

### M-08 — Painel de hotspots sobrepõe panorama em mobile

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` |
| **Descrição** | `HotspotManagerPanel` é `absolute top-4 right-4 w-72` — ocupa ~40% da largura em telas pequenas durante gestão. |
| **Impacto** | Dificulta posicionar hotspots e visualizar resultado em mobile. |
| **Prioridade** | Médio |
| **Sugestão** | Drawer bottom sheet em mobile; ou modo fullscreen para gestão. |
| **Arquivos** | `src/components/viewer/HotspotManagerPanel.jsx` |

### M-09 — Header do viewer empilha título em linha separada

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId`, `/share/image/:imageId` |
| **Descrição** | Bloco título usa `order-3 w-full basis-full` abaixo de `sm` — ocupa linha inteira, empurrando controles. |
| **Impacto** | Header alto em mobile; menos área útil para panorama. |
| **Prioridade** | Médio |
| **Sugestão** | Compactar header mobile: título truncado inline, controles em linha única. |
| **Arquivos** | `src/pages/Viewer.js`, `src/pages/PublicImage.js` |

### M-10 — Imagem solta no viewer autenticado mostra "Projeto"

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Página/rota** | `/viewer/:imageId` (sem projectId) |
| **Descrição** | Subtítulo usa fallback `{project?.title \|\| "Projeto"}` — incorreto para imagens soltas. |
| **Impacto** | Contexto enganoso; navegação prev/next não aparece (correto), mas label confunde. |
| **Prioridade** | Médio |
| **Sugestão** | Fallback "Imagens soltas" ou ocultar subtítulo. |
| **Arquivos** | `src/pages/Viewer.js` |

### M-11 — Portfólio desabilitado: mensagem genérica para visitante

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Portfólio público |
| **Página/rota** | `/u/:slug` |
| **Descrição** | Erro `disabled` mostra *"Este portfólio não está disponível"* sem distinguir slug válido desabilitado vs erro. |
| **Impacto** | Visitante não sabe se link está errado ou dono desativou. |
| **Prioridade** | Médio |
| **Sugestão** | Copy diferenciada: *"O proprietário desativou este portfólio"* vs *"Usuário não encontrado"*. |
| **Arquivos** | `src/pages/PublicPortfolio.js` |

### M-12 — Portfólio sem logo do escritório

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Portfólio público |
| **Página/rota** | `/u/:slug` |
| **Descrição** | Página exibe nome e bio, mas não renderiza `companyLogo` mesmo se existisse no perfil. |
| **Impacto** | Identidade visual incompleta vs expectativa de "página com sua marca". |
| **Prioridade** | Médio |
| **Sugestão** | Exibir logo acima do nome quando disponível. |
| **Arquivos** | `src/pages/PublicPortfolio.js`, `src/services/users/userService.js` |

### M-13 — Configurações sem exibição do plano atual

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações / Planos |
| **Página/rota** | `/settings` |
| **Descrição** | Settings não mostra plano ativo nem link rápido para `/plan`. Plano só visível em sidebar e página dedicada. |
| **Impacto** | Usuário busca informação de plano em lugar errado. |
| **Prioridade** | Médio |
| **Sugestão** | Card "Plano atual: Starter" com link "Ver detalhes e consumo". |
| **Arquivos** | `src/pages/Settings.js`, `src/hooks/usePlanLimits.js` |

### M-14 — Preview de URL do portfólio sem domínio em dev

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Página/rota** | `/settings` |
| **Descrição** | `buildPortfolioUrl` retorna path relativo `/u/slug` quando `REACT_APP_PUBLIC_URL` não está definido. |
| **Impacto** | Usuário pode não entender URL final de produção. |
| **Prioridade** | Médio |
| **Sugestão** | Usar `window.location.origin` como fallback ou copy explicativa. |
| **Arquivos** | `src/utils/slug.js`, `src/pages/Settings.js` |

### M-15 — Google Sign-In implementado mas ausente na UI

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Página/rota** | `/login`, `/register` |
| **Descrição** | `authService.signInGoogle` e `AuthContext.signInGoogle` existem; telas só oferecem email/senha. |
| **Impacto** | Oportunidade de conversão reduzida; expectativa de login social em SaaS moderno. |
| **Prioridade** | Médio |
| **Sugestão** | Botão "Continuar com Google" ou remover código morto até launch. |
| **Arquivos** | `src/pages/Login.js`, `src/pages/SignUp.js`, `src/services/auth/authService.js` |

### M-16 — Senha mínima sem orientação ao usuário

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Página/rota** | `/register` |
| **Descrição** | `minLength={6}` no input sem texto de ajuda visível. Erro só após submit Firebase. |
| **Impacto** | Cadastros falham sem clareza prévia. |
| **Prioridade** | Médio |
| **Sugestão** | Hint "Mínimo 6 caracteres" abaixo do campo. |
| **Arquivos** | `src/pages/SignUp.js` |

### M-17 — PlanUpgradeHint exibido para todos os planos

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Dashboard / Planos |
| **Página/rota** | `/dashboard`, `/plan` |
| **Descrição** | Banner *"A cobrança online ainda não está disponível"* aparece sempre, inclusive para usuários que não precisam de upgrade. |
| **Impacto** | Ruído visual; sensação de produto incompleto. |
| **Prioridade** | Médio |
| **Sugestão** | Exibir só para Starter ou near-limit; dismissible. |
| **Arquivos** | `src/pages/Dashboard.js`, `src/pages/Plan.js`, `src/components/plans/PlanUpgradeHint.jsx` |

### M-18 — Página de Ajuda placeholder

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | App autenticado |
| **Página/rota** | `/help` |
| **Descrição** | Conteúdo *"Em breve você encontrará aqui tutoriais..."* — acessível via menu do header. |
| **Impacto** | Expectativa não atendida; dead-end para usuário buscando suporte. |
| **Prioridade** | Médio |
| **Sugestão** | FAQ mínimo inline ou link para email/WhatsApp de suporte beta. |
| **Arquivos** | `src/pages/Help.js` |

### M-19 — Visibilidade "Público" vs copy de imagem

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento |
| **Página/rota** | `ShareImageDialog` |
| **Descrição** | Para imagens, opção "Público" tem description override: *"Acessível por link (não aparece no portfólio)"* — diferente de projetos onde "Público" = portfólio. |
| **Impacto** | Terminologia igual com comportamentos diferentes pode confundir. |
| **Prioridade** | Médio |
| **Sugestão** | Renomear opção de imagem para "Compartilhado" ou explicar diferença projeto vs imagem no modal. |
| **Arquivos** | `src/components/images/ShareImageDialog.jsx`, `src/utils/visibility.js` |

### M-20 — ImageCard público sem truncate em nomes longos

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Compartilhamento / portfólio |
| **Página/rota** | Cards públicos |
| **Descrição** | Variant `public` do `ImageCard` usa `<h3>` sem `truncate`/`line-clamp`; variant `private` usa `break-words`. |
| **Impacto** | Títulos longos quebram layout do grid. |
| **Prioridade** | Médio |
| **Sugestão** | `line-clamp-2` ou `truncate` consistente. |
| **Arquivos** | `src/components/common/ImageCard.jsx` |

### M-21 — Tooltip de limite inacessível em touch

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Planos e limites |
| **Página/rota** | Botões `PlanLimitButton` disabled |
| **Descrição** | Tooltip Radix só aparece em hover — mobile/touch não vê "Limite do plano atingido". |
| **Impacto** | Botão disabled sem explicação em celular. |
| **Prioridade** | Médio |
| **Sugestão** | Toast ou label visível ao tocar; `UpgradePrompt` já visível em algumas telas mas não todas. |
| **Arquivos** | `src/components/plans/PlanLimitButton.jsx` |

### M-22 — Landing pricing: testid duplicado

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Página/rota** | `#precos` |
| **Descrição** | Todos os cards ativos usam `data-testid="landing-pricing-starter-btn"` no Link — deveria ser por plano. |
| **Impacto** | Bug de QA/automação; indício de copy-paste na implementação. |
| **Prioridade** | Médio (Baixo para UX final) |
| **Sugestão** | `landing-pricing-btn-${id}`. |
| **Arquivos** | `src/components/landing/LandingPricing.jsx` |

---

## Problemas Baixos

### B-01 — CTAs com copy inconsistente

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Descrição** | "Começar Gratuitamente" (Hero) vs "Começar grátis" (Header) vs "Começar grátis" (Pricing). |
| **Prioridade** | Baixo |
| **Sugestão** | Unificar em uma variante. |
| **Arquivos** | `src/components/landing/LandingHero.jsx`, `LandingHeader.jsx`, `landingContent.js` |

### B-02 — Hero visual duplica placeholder da demo

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Descrição** | Hero e seção Showcase usam o mesmo padrão Orbit + gradient quando demo indisponível — redundância visual. |
| **Prioridade** | Baixo |
| **Arquivos** | `LandingHero.jsx`, `LandingShowcase.jsx` |

### B-03 — Seção portfólio landing: domínio hardcoded

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing |
| **Descrição** | Mockup mostra `fivi360.com/u/seu-nome` — domínio real pode diferir em staging. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/landing/LandingPortfolio.jsx` |

### B-04 — Logout sem feedback de erro

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Descrição** | Falha em `signOut` só reseta `isLoggingOut` — sem toast. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/Layout.js`, `src/components/layout/AppHeader.jsx` |

### B-05 — Auth inputs não usam componente Input shadcn

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Autenticação |
| **Descrição** | Login/SignUp usam `<input>` nativo estilizado; app autenticado mistura padrões. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/pages/Login.js`, `SignUp.js`, `ForgotPassword.js` |

### B-06 — ProjectCard: badge de status sobrepõe menu

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Descrição** | Badge visibilidade no canto superior direito; menu no inferior direito — OK, mas badge pode colidir visualmente com imagens claras. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/common/ProjectCard.jsx` |

### B-07 — Exclusão de projeto não menciona imagens

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Projetos |
| **Descrição** | Modal *"será removido permanentemente"* não esclarece destino das imagens (excluídas vs soltas). |
| **Prioridade** | Baixo |
| **Arquivos** | `src/pages/Projects.js`, `ProjectDetail.js` |

### B-08 — Viewer: sem indicador de progresso entre imagens

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Descrição** | Navegação prev/next existe, mas não mostra "2 de 5". |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/viewer/ViewerNavControls.jsx` |

### B-09 — Hotspot info dialog: sem suporte markdown/links

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Viewer |
| **Descrição** | Descrição de hotspot é texto plano. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/viewer/HotspotInfoDialog.jsx` |

### B-10 — Footer público minimalista demais

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Páginas públicas |
| **Descrição** | Só "Powered by FIVI360" — sem link para landing ou CTA secundário. |
| **Prioridade** | Baixo |
| **Arquivos** | `PublicProject.js`, `PublicPortfolio.js` |

### B-11 — Settings: email readonly sem explicação

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Descrição** | Campo email disabled sem hint *"O email não pode ser alterado"*. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/pages/Settings.js` |

### B-12 — Campos URL sem validação client-side

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Configurações |
| **Descrição** | Redes sociais aceitam qualquer string; URLs inválidas podem ir ao Firestore. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/pages/Settings.js`, `src/services/users/userService.js` |

### B-13 — Enterprise landing CTA "Falar com a gente" disabled

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Landing pricing |
| **Descrição** | Botão desabilitado sem mailto ou formulário alternativo. |
| **Prioridade** | Baixo |
| **Arquivos** | `src/config/landingContent.js`, `LandingPricing.jsx` |

### B-14 — Sidebar: item ativo só match exato

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | App autenticado |
| **Descrição** | `/projects/abc` não destaca "Projetos" na sidebar (`pathname === path`). |
| **Prioridade** | Baixo |
| **Arquivos** | `src/components/Layout.js` |

### B-15 — Animação fade-in em toda navegação

| Campo | Detalhe |
|-------|---------|
| **Fluxo** | Global |
| **Descrição** | Classe `fade-in` em cada página pode causar flash perceptível em navegações rápidas. |
| **Prioridade** | Baixo |
| **Arquivos** | Múltiplas pages, `App.css` |

---

## Recomendações por Fluxo

### 1. Landing pública
- Configurar demo real (C-01, A-09) como **pré-requisito de launch**.
- Substituir placeholder do Hero por mídia real (A-01).
- Publicar legal ou remover links (C-02).
- Adicionar favicon + OG image (C-04, A-10).
- Manter footnote honesta sobre billing; alinhar CTAs de planos pagos.

### 2. Autenticação
- Aceite de termos no cadastro (A-11).
- Hint de senha (M-16).
- Avaliar Google OAuth (M-15).
- Manter consistência visual auth ↔ app.

### 3. Dashboard
- Unificar enforcement de limite no CTA criar projeto (A-03).
- Corrigir KPI links (A-04).
- Barras de progresso nos KPIs (M-01).
- CTAs nos empty states (M-02, M-03).

### 4. Projetos
- Bloquear `/projects/new` no limite (A-12).
- Menu com click-outside (M-04).
- Mobile header no detalhe (A-06).

### 5. Detalhe do projeto
- Share por imagem (A-05).
- Header responsivo (A-06).

### 6. Imagens soltas
- Fluxo maduro; foco em paridade com project detail (share).

### 7. Viewer
- Label contexto imagem solta (M-10).
- UX hotspots Starter (M-07).
- Painel mobile (M-08).

### 8. Portfólio público
- Mensagens de erro diferenciadas (M-11).
- Logo do escritório (M-12).

### 9. Compartilhamento público
- Label voltar condicional (A-08).
- Regras private/shared/public **implementadas corretamente** — manter e documentar para usuários.

### 10. Planos e limites
- Resolver dead-end de upgrade (A-02) antes de beta amplo.
- Tooltip touch (M-21).
- PlanUpgradeHint contextual (M-17).

### 11. Configurações
- Logo funcional ou oculto (A-07).
- Card plano atual (M-13).
- URL preview com domínio (M-14).

---

## Quick Wins

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Configurar `LANDING_DEMO.projectId` com projeto real | Baixo | Muito alto |
| 2 | Adicionar favicon | Baixo | Médio |
| 3 | Dashboard: `PlanLimitButton` no criar projeto | Baixo | Alto |
| 4 | Renomear KPI "Links compartilhados" | Baixo | Médio |
| 5 | Hint senha 6 chars no SignUp | Baixo | Médio |
| 6 | Viewer: fallback "Imagens soltas" | Baixo | Médio |
| 7 | `ProjectCard` → DropdownMenu | Médio | Médio |
| 8 | Empty states Dashboard com botões | Baixo | Médio |
| 9 | Rota 404 simples | Baixo | Alto |
| 10 | Ocultar botão upload logo até implementar | Baixo | Médio |

---

## Ordem sugerida de correção

### Fase 1 — Bloqueadores de beta (Sprint 11)
1. C-01 Demo landing configurada  
2. C-02 Legal mínimo ou links removidos  
3. C-03 Página 404  
4. C-04 Favicon  
5. A-03 Dashboard limite criar projeto  
6. A-12 Bloquear `/projects/new` no limite  
7. A-02 Comunicação honesta sobre upgrade (copy + expectativa)

### Fase 2 — Confiança e conversão (Sprint 12)
8. A-01 Hero com demo real  
9. A-09 Portfólio demo  
10. A-10 OG image  
11. A-11 Aceite termos cadastro  
12. A-04 KPI correto  
13. A-05 Share imagem no projeto  
14. M-01 KPIs com progresso visual  

### Fase 3 — Mobile e polimento (Sprint 13)
15. A-06 Header projeto mobile  
16. M-04 Menu ProjectCard  
17. M-06 PageHeader responsive  
18. M-08 Hotspot panel mobile  
19. A-07 Logo upload ou hide  
20. M-13 Plano em Settings  

### Fase 4 — Nice-to-have pré-GA
21. M-15 Google OAuth  
22. M-18 Help/FAQ  
23. B-08 Indicador imagem N de M  
24. Demais itens baixos  

---

## Critérios para Beta

### Obrigatório (go / no-go)

- [ ] Demo interativa funcional na landing com projeto público real  
- [ ] Termos de Uso e Política de Privacidade publicados (ou links removidos temporariamente)  
- [ ] Página 404 funcional  
- [ ] Favicon presente  
- [ ] Limites de plano consistentes em Dashboard, Projects e NewProject  
- [ ] Mensagem clara quando upgrade não está disponível (sem CTA enganoso "Fazer Upgrade" sem saída)  
- [ ] Fluxos core testados manualmente: cadastro → criar projeto → upload → viewer → compartilhar link → abrir link público  
- [ ] Portfólio demo `/u/fivi360` acessível se promovido na landing  

### Desejável (beta fechado)

- [ ] OG image para compartilhamento social  
- [ ] Share de imagem individual no detalhe do projeto  
- [ ] KPIs do Dashboard com indicadores visuais de limite  
- [ ] Mobile: headers de projeto e viewer usáveis  
- [ ] Help com canal de contato mínimo  

### Pós-beta (GA)

- [ ] Billing / upgrade funcional  
- [ ] Upload de logo  
- [ ] Google Sign-In  
- [ ] Página Help completa  
- [ ] Indicadores avançados no viewer  

---

## Apêndice — Mapa de rotas auditadas

| Rota | Guard | Layout | Status UX geral |
|------|-------|--------|-----------------|
| `/` | LandingRoute | Landing | ⚠️ Demo pendente |
| `/login` | PublicRoute | Auth | ✅ OK |
| `/register` | PublicRoute | Auth | ⚠️ Sem termos |
| `/forgot-password` | PublicRoute | Auth | ✅ OK |
| `/dashboard` | Protected | Sidebar | ⚠️ Limites inconsistentes |
| `/projects` | Protected | Sidebar | ✅ OK |
| `/projects/new` | Protected | Sidebar | ⚠️ Acessível no limite |
| `/projects/:id` | Protected | Sidebar | ⚠️ Mobile, share imagem |
| `/images` | Protected | Sidebar | ✅ OK |
| `/viewer/:imageId` | Protected | Fullscreen | ⚠️ Mobile hotspots |
| `/plan` | Protected | Sidebar | ⚠️ Upgrade dead-end |
| `/settings` | Protected | Sidebar | ⚠️ Logo, plano |
| `/help` | Protected | Sidebar | ⚠️ Placeholder |
| `/share/project/:id` | Público | Public shell | ✅ OK |
| `/share/image/:imageId` | Público | Fullscreen | ⚠️ Label voltar |
| `/u/:slug` | Público | Public shell | ⚠️ Depende config |
| `/termos`, `/privacidade` | Público | Placeholder | ❌ Bloqueador |

---

*Documento gerado na Sprint 11 — auditoria somente leitura. Nenhum arquivo de código foi alterado.*
