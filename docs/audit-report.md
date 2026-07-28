# FIVI360 - Auditoria do Projeto Base

> **Nota histórica (RC-CLEANUP-LEGACY-1):** menções a Mercado Pago são do protótipo
> original e **não** descrevem o billing atual (Stripe).

**Documento:** Auditoria visual e estrutural do frontend  
**Versão:** 1.0  
**Data:** 31/05/2026  
**Escopo:** `frontend/` — protótipo gerado pelo Emergent  
**Tipo:** Somente leitura — nenhum código foi alterado  
**Referência anterior:** Consolidação da auditoria realizada em 31/05/2026 (`audit-report-v1.md`)

---

## Resumo Executivo

### Visão geral do projeto encontrado

O repositório `frontend/` contém um protótipo de interface do **FIVI360**, plataforma SaaS para apresentação de imagens panorâmicas 360° voltada a arquitetos e designers. O projeto foi **gerado pelo Emergent** e implementa parcialmente o fluxo visual do produto: área autenticada com sidebar, gestão visual de projetos, configurações, planos e fluxo público de compartilhamento.

A stack é **React 19 + Create React App (CRACO) + Tailwind CSS + shadcn/ui**, com roteamento via React Router DOM v7. Existem **9 páginas** funcionais apenas como wireframes visuais, **1 componente de layout** (`Layout.js`), **46 componentes shadcn** instalados mas não utilizados nas páginas, e **zero integração** com backend, autenticação ou viewer 360 real.

### Estado atual

| Dimensão | Estado |
|----------|--------|
| UI / Design | Parcialmente implementado — identidade visual coerente |
| Navegação / Rotas | 10 rotas declaradas; várias rotas do MVP ausentes |
| Dados | 100% mockados localmente |
| Lógica de negócio | Não implementada |
| API / Persistência | Inexistente |
| Autenticação | Inexistente |
| Viewer 360° | Simulação visual (imagem estática + zoom CSS) |
| Hotspots | Inexistente |
| Testes | Inexistente |
| Documentação de produto | Presente em `docs/` (product, business-rules, roadmap) |

### Nível de maturidade

**Protótipo visual (nível 1 de 5)** — adequado como referência de layout e fluxos de tela, **inadequado como base funcional**.

| Nível | Descrição | Status |
|-------|-----------|--------|
| 1 | Protótipo visual / mock | **Atual** |
| 2 | Componentes extraídos + design system unificado | Pendente |
| 3 | Integração com API + auth | Pendente |
| 4 | MVP funcional completo | Pendente |
| 5 | Produção (SEO, testes, go-live) | Pendente |

**Conclusão executiva:** O projeto base entrega valor como **mapa visual e wireframe** para a reconstrução. Toda lógica, dados, rotas protegidas, modais, viewer real e páginas ausentes precisam ser construídos do zero ou reconstruídos sobre os padrões visuais existentes.

---

## Estrutura do Projeto

### Framework

| Item | Detalhe |
|------|---------|
| Framework UI | React 19.0.0 |
| Bundler / Dev server | Create React App 5.0.1 via `@craco/craco` 7.1.0 |
| Roteamento | `react-router-dom` 7.5.1 |
| Estilização | Tailwind CSS 3.4.17 + PostCSS + Autoprefixer |
| Componentes base | shadcn/ui (estilo **new-york**, base neutral) |
| Ícones | lucide-react 0.507.0 |
| Linguagem | JavaScript (`.js` / `.jsx`) — sem TypeScript |
| Path alias | `@/` → `src/` (CRACO webpack + `jsconfig.json`) |
| Package manager | Yarn 1.22.22 |

### Bibliotecas principais

**Em uso efetivo nas páginas:**

- `react`, `react-dom`
- `react-router-dom`
- `lucide-react`
- `tailwindcss`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate`

**Instaladas mas não utilizadas nas páginas:**

- `axios` — cliente HTTP
- `react-hook-form`, `@hookform/resolvers`, `zod` — formulários e validação
- `recharts` — gráficos
- `date-fns`, `react-day-picker` — datas
- `next-themes` — tema claro/escuro
- `sonner` + componentes toast shadcn — notificações (não montados em `App.js`)
- Todos os 46 componentes em `src/components/ui/` — apenas referenciados entre si

**Específicas da plataforma Emergent:**

- `@emergentbase/visual-edits` — plugin CRACO para edição visual em dev
- `public/index.html` — badge "Made with Emergent", script `emergent-main.js`, PostHog analytics

### Organização de pastas

```
frontend/
├── docs/                         # Documentação de produto e auditoria
│   ├── product.md
│   ├── business-rules.md
│   ├── roadmap.md
│   ├── rules.md
│   ├── architecture.md
│   └── audit-report.md           # Este documento
├── plugins/
│   └── health-check/             # Webpack health plugin (opcional via env)
├── public/
│   └── index.html                # HTML base (Emergent + PostHog)
├── src/
│   ├── App.js                    # Rotas principais
│   ├── App.css                   # Utilitários visuais custom
│   ├── index.js                  # Entry point React
│   ├── index.css                 # Tailwind + tokens shadcn + fontes
│   ├── components/
│   │   ├── Layout.js             # Sidebar + shell autenticado
│   │   └── ui/                   # 46 componentes shadcn (scaffold)
│   ├── hooks/
│   │   └── use-toast.js          # Hook toast (não montado)
│   ├── lib/
│   │   └── utils.js              # Helper cn() para shadcn
│   └── pages/                    # 9 páginas (.js)
│       ├── Dashboard.js
│       ├── Projects.js
│       ├── ProjectDetail.js
│       ├── NewProject.js
│       ├── Viewer.js
│       ├── Settings.js
│       ├── Plan.js
│       ├── PublicProject.js
│       └── PublicImage.js
├── components.json               # Configuração shadcn
├── tailwind.config.js
├── postcss.config.js
├── craco.config.js
├── jsconfig.json
└── package.json
```

**Pastas ausentes (esperadas na reconstrução):**

- `src/services/` ou `src/api/` — camada de API
- `src/context/` ou `src/store/` — estado global / auth
- `src/types/` — tipos/contratos
- `src/features/` — organização por domínio
- `public/` assets — favicon, logo, manifest, imagens locais
- Testes — nenhum arquivo `.test.js` ou `.spec.js`

### Arquitetura encontrada

A arquitetura atual é **monolítica por página**:

```
index.js
  └── App.js (BrowserRouter + Routes)
        ├── Layout.js (sidebar) → páginas autenticadas
        └── Páginas standalone → viewer e rotas públicas
```

**Características:**

- Rotas declaradas centralmente em `App.js`
- Layout aplicado via composição JSX (`<Layout><Page /></Layout>`)
- Sem route guards, lazy loading ou code splitting
- Sem camada de serviços, hooks de domínio ou context providers
- Dados mockados inline em cada arquivo de página
- Dois "design systems" paralelos: Tailwind hardcoded nas páginas vs tokens shadcn não utilizados
- `data-testid` extensivo (~70 ocorrências) — preparado para E2E futuro

---

## Rotas Encontradas

### Rotas implementadas

| Rota | Página | Layout | Status | Observações |
|------|--------|--------|--------|-------------|
| `/` | Redirect → `/dashboard` | — | ⚠️ Parcial | Sem verificação de sessão; deveria ir para landing ou dashboard conforme auth |
| `/dashboard` | `Dashboard.js` | Sidebar | ✅ Visual | Stats e projetos mockados |
| `/projects` | `Projects.js` | Sidebar | ✅ Visual | Lista mock; ações de menu sem função |
| `/projects/new` | `NewProject.js` | Sidebar | ⚠️ Parcial | Form visual; submit fake |
| `/projects/:id` | `ProjectDetail.js` | Sidebar | ⚠️ Parcial | Ignora `:id` da URL; sempre exibe mesmo mock |
| `/viewer/:projectId/:imageId` | `Viewer.js` | Fullscreen | ⚠️ Parcial | Viewer fake; ignora params da URL |
| `/plan` | `Plan.js` | Sidebar | ✅ Visual | Planos mock; diverge de business-rules |
| `/settings` | `Settings.js` | Sidebar | ⚠️ Parcial | Form visual; submit fake; falta `publicSlug` |
| `/share/project/:id` | `PublicProject.js` | Público | ⚠️ Parcial | Mock fixo; não é portfólio `/f/:slug` |
| `/share/image/:projectId/:imageId` | `PublicImage.js` | Público | ⚠️ Parcial | Rota diverge da spec (`/share/image/:imageId`) |

### Rotas esperadas pelo produto e ausentes

| Rota esperada | Funcionalidade | Status |
|---------------|----------------|--------|
| `/login` | Login | ❌ Ausente |
| `/register` ou `/cadastro` | Cadastro | ❌ Ausente |
| `/forgot-password` | Recuperação de senha | ❌ Ausente |
| `/f/:publicSlug` | Portfólio público do usuário | ❌ Ausente |
| `/share/image/:imageId` | Compartilhamento de imagem (spec docs) | ❌ Diverge da implementação |
| `/` ou `/home` | Landing page | ❌ Ausente (redirect ao dashboard) |
| `/ajuda`, `/termos`, `/privacidade` | Páginas legais / ajuda | ❌ Ausentes |
| `*` | Página 404 | ❌ Ausente |
| — | Editor de hotspots | ❌ Ausente |

---

## Páginas Encontradas

### Dashboard

- **Arquivo:** `src/pages/Dashboard.js`
- **Rota:** `/dashboard`
- **Objetivo:** Exibir visão geral da conta — estatísticas agregadas e projetos recentes
- **Componentes utilizados:**
  - Page header (título + subtítulo) — inline
  - Grid de 4 stat cards (Projetos, Imagens, Links, Armazenamento) — inline
  - Grid de project cards com imagem, badge de status, contagem de imagens — inline
  - Botão primário "Criar projeto" (`Link` → `/projects/new`)
  - Ícones lucide: `Plus`, `Image`, `Link2`, `HardDrive`, `FolderOpen`
- **Estado atual:** Protótipo visual completo; dados 100% mockados
- **Observações:**
  - `mockProjects` com 3 itens duplicado de `Projects.js`
  - Stats hardcoded: 24 projetos, 156 imagens, 18 links, 2.4 GB
  - Status usa "Público / Privado / Não listado" em vez de `private / shared / public`
  - Cards navegam para `/projects/:id` (navegação visual funciona)

---

### Projetos

- **Arquivo:** `src/pages/Projects.js`
- **Rota:** `/projects`
- **Objetivo:** Listar todos os projetos do usuário com ações contextuais
- **Componentes utilizados:**
  - Page header com botão "Criar projeto"
  - Grid de project cards (6 itens mock)
  - Dropdown menu custom por card (`MoreVertical` → Ver projeto / Excluir)
  - Ícones lucide: `Plus`, `MoreVertical`, `Eye`, `Trash2`
- **Estado atual:** Protótipo visual; menu de ações parcialmente funcional (abre/fecha)
- **Observações:**
  - "Ver projeto" é `<button>` sem navegação (deveria ser `Link`)
  - "Excluir" sem handler e sem confirmação
  - Dropdown implementado como `<div>` inline — candidato a shadcn `DropdownMenu`
  - `mockProjects` independente do Dashboard (mesmos dados, arrays separados)

---

### Detalhe do Projeto

- **Arquivo:** `src/pages/ProjectDetail.js`
- **Rota:** `/projects/:id`
- **Objetivo:** Exibir detalhes do projeto, capa, descrição, visibilidade e galeria de imagens panorâmicas
- **Componentes utilizados:**
  - Link "Voltar para projetos"
  - Hero card: capa, nome, badge status, botão Compartilhar, descrição
  - Toggle de visualização Grid / Lista
  - Grid ou lista de image cards com menu contextual (Visualizar, Renomear, Excluir)
  - Botão "Adicionar imagem"
  - Ícones lucide: `ArrowLeft`, `Plus`, `Share2`, `MoreVertical`, `Trash2`, `Edit2`, `ExternalLink`
- **Estado atual:** Maior página do projeto (~218 linhas); visual rico, lógica inexistente
- **Observações:**
  - `useParams().id` capturado mas **não usado** — sempre exibe `mockProject` id=1
  - Falta campo `clientName` (obrigatório nas business-rules)
  - Modo lista e grid implementados visualmente (toggle funciona)
  - Links para viewer usam `:id` da URL corretamente na navegação
  - Ações Compartilhar, Adicionar imagem, Renomear, Excluir sem implementação
  - Sem modal de upload

---

### Novo Projeto

- **Arquivo:** `src/pages/NewProject.js`
- **Rota:** `/projects/new`
- **Objetivo:** Formulário de criação de novo projeto
- **Componentes utilizados:**
  - Link "Voltar para projetos"
  - Área de upload de capa (drag-and-drop visual)
  - Inputs: nome (required), descrição (textarea)
  - Radio group de visibilidade: Privado / Não listado / Público
  - Botões: Criar projeto (submit), Cancelar (link)
  - Ícones lucide: `ArrowLeft`, `Upload`
- **Estado atual:** Formulário controlado com `useState`; submit simulado
- **Observações:**
  - `handleSubmit` → `console.log` + `setTimeout` + `navigate('/projects')` — não persiste
  - Input file de capa sem preview, validação ou upload
  - Falta `clientName`
  - Nomenclatura de visibilidade diverge das business-rules
  - Formulário HTML nativo — não usa shadcn `Form`, `Input`, `Textarea`, `RadioGroup`

---

### Viewer 360°

- **Arquivo:** `src/pages/Viewer.js`
- **Rota:** `/viewer/:projectId/:imageId`
- **Objetivo:** Visualização imersiva de imagem panorâmica 360° com controles de zoom e fullscreen
- **Componentes utilizados:**
  - Overlay superior: botão Voltar, botão Compartilhar
  - Área fullscreen com imagem
  - Overlay inferior: info do projeto/imagem + controles zoom/fullscreen
  - Hint central: "Arraste para navegar • Scroll para zoom"
  - Ícones lucide: `ArrowLeft`, `Maximize`, `ZoomIn`, `ZoomOut`, `Share2`
- **Estado atual:** Simulação visual — **não é viewer 360°**
- **Observações:**
  - Imagem estática Unsplash com `object-cover` e zoom via CSS `transform: scale()`
  - `projectId` e `imageId` da URL ignorados — sempre exibe mesmo `mockImage`
  - Fullscreen nativo do browser funciona
  - Hint de interação não implementada (sem drag, sem scroll zoom real)
  - Sem Pannellum ou biblioteca 360°
  - Sem hotspots
  - Mobile exibe zoom/fullscreen — contrário às regras de negócio (mobile deve ocultar controles)
  - Sem sidebar (correto para viewer)

---

### Configurações

- **Arquivo:** `src/pages/Settings.js`
- **Rota:** `/settings`
- **Objetivo:** Gerenciar perfil pessoal e dados do escritório
- **Componentes utilizados:**
  - Seção "Perfil" em card
  - Upload de logo (placeholder visual + botão "Fazer upload")
  - Inputs: nome completo, email, nome do escritório, link externo
  - Botão "Salvar alterações"
  - Ícones lucide: `User`, `Mail`, `Building2`, `Link`, `Upload`
- **Estado atual:** Formulário com valores iniciais hardcoded
- **Observações:**
  - Valores mock: João Silva, joao@studio.com, Studio Arquitetura
  - Submit → `console.log` apenas
  - Upload de logo sem funcionalidade
  - Falta configuração de `publicSlug` para portfólio (business-rules)
  - Falta seção de conta (senha, logout, exclusão)

---

### Planos

- **Arquivo:** `src/pages/Plan.js`
- **Rota:** `/plan`
- **Objetivo:** Apresentar planos de assinatura e consumo atual da conta
- **Componentes utilizados:**
  - Header centralizado
  - Grid de 3 pricing cards (Gratuito, Profissional, Enterprise)
  - Lista de features com ícone Check
  - Botões "Assinar" / "Plano atual"
  - Seção "Seu consumo atual" com 4 stat cards + barras de progresso
  - Ícones lucide: `Check`
- **Estado atual:** Protótipo visual completo; dados mockados
- **Observações:**
  - Planos divergem do roadmap: docs definem **Starter / Professional**
  - Features não refletem business-rules (hotspots, portfólio por plano)
  - Botões "Assinar" sem integração Mercado Pago ou backend
  - Consumo mock: 2/3 projetos, 24/30 imagens, 320/500 MB

---

### Projeto Público (Share)

- **Arquivo:** `src/pages/PublicProject.js`
- **Rota:** `/share/project/:id`
- **Objetivo:** Página pública para visualização de projeto compartilhado por link
- **Componentes utilizados:**
  - Header com logo FIVI360
  - Hero: capa grande, nome, descrição, crédito do escritório
  - Grid de image cards linkando para viewer público
  - Footer "Powered by FIVI360"
  - Ícones lucide: `ExternalLink`
- **Estado atual:** Layout público próprio; dados mock fixos
- **Observações:**
  - `:id` da URL não altera conteúdo exibido
  - Não é o portfólio `/f/:publicSlug` — é share de projeto individual
  - Capa não abre primeira imagem no mobile (regra de negócio não implementada)
  - Bom candidato para extração de `PublicLayout`

---

### Imagem Pública (Share Viewer)

- **Arquivo:** `src/pages/PublicImage.js`
- **Rota:** `/share/image/:projectId/:imageId`
- **Objetivo:** Viewer público de imagem compartilhada
- **Componentes utilizados:**
  - Quase idêntico a `Viewer.js`
  - Overlay: Voltar ao projeto, badge "Powered by FIVI360"
  - Controles zoom/fullscreen + info rodapé com escritório
  - Ícones lucide: `ArrowLeft`, `Maximize`, `ZoomIn`, `ZoomOut`
- **Estado atual:** Duplicação de `Viewer.js` com variações mínimas
- **Observações:**
  - Rota diverge da spec: docs definem `/share/image/:imageId`
  - Mesmas limitações do viewer privado (não 360°, mock fixo)
  - Candidato forte a unificação em componente `PanoramaViewer` compartilhado

---

## Componentes Reutilizáveis

### Headers

| Padrão | Onde | Preservar? |
|--------|------|------------|
| Page header (H1 + subtítulo) | Dashboard, Projects, Settings, Plan, NewProject | ✅ Extrair como `PageHeader` |
| Public header (logo FIVI360) | PublicProject | ✅ Extrair como `PublicHeader` |
| Viewer overlay header | Viewer, PublicImage | ✅ Extrair como `ViewerToolbar` |
| Project hero header | ProjectDetail | ⚠️ Extrair como `ProjectHero` |

**Recomendação:** Preservar padrão visual; reconstruir como componentes parametrizáveis.

---

### Sidebars

| Componente | Arquivo | Preservar? |
|------------|---------|------------|
| Sidebar autenticada | `src/components/Layout.js` | ✅ **Preservar** — responsiva, identidade visual, navegação |

**Detalhes do Layout.js:**

- Largura: `w-64` (256px)
- Itens: Dashboard, Projetos, Plano, Configurações
- Item ativo: `bg-white text-black rounded-xl`
- Mobile: drawer + overlay + botão hamburger fixo
- Logo: FIVI<span>360</span> com tipografia Outfit

**Recomendação:** Preservar estrutura e estilo; adicionar logout, avatar e guards de rota na reconstrução.

---

### Cards

| Padrão | Onde | Preservar? |
|--------|------|------------|
| Stat card | Dashboard, Plan (consumo) | ✅ Extrair `StatCard` |
| Project card | Dashboard, Projects, PublicProject | ✅ Extrair `ProjectCard` |
| Image card | ProjectDetail, PublicProject | ✅ Extrair `ImageCard` |
| Pricing card | Plan | ✅ Extrair `PricingCard` |
| Form section card | NewProject, Settings | ✅ Extrair `FormSection` |
| shadcn `Card` | `components/ui/card.jsx` | ⚠️ Adotar na reconstrução (não usado hoje) |

**Padrão visual comum:**

```
bg-zinc-900/50 border border-zinc-800 rounded-2xl
+ .card-hover (hover border zinc-600)
+ imagem h-48 + .image-zoom-hover
```

---

### Modais

| Tipo | Status | Preservar? |
|------|--------|------------|
| Upload de imagem (preview) | ❌ Não implementado | 🔨 Reconstruir com shadcn `Dialog` |
| Compartilhar (copy link) | ❌ Não implementado | 🔨 Reconstruir |
| Confirmar exclusão | ❌ Não implementado | 🔨 Reconstruir com `AlertDialog` |
| Renomear imagem | ❌ Não implementado | 🔨 Reconstruir |
| shadcn `Dialog`, `AlertDialog`, `Sheet` | Instalados, não usados | ✅ Usar na reconstrução |

**Recomendação:** Nada a preservar de modais — construir do zero usando shadcn.

---

### Botões

| Variante | Padrão visual | Preservar? |
|----------|---------------|------------|
| Primário (CTA) | `bg-white text-black rounded-full btn-scale` | ✅ Preservar estilo |
| Secundário | `bg-zinc-800 border border-zinc-700 rounded-full/xl` | ✅ Preservar estilo |
| Ghost / icon | `p-2 text-zinc-400 hover:text-white` | ✅ Preservar estilo |
| Toggle ativo | `bg-white text-black rounded-lg` | ✅ Preservar estilo |
| shadcn `Button` | `components/ui/button.jsx` | ⚠️ Adaptar variantes shadcn ao visual FIVI360 |

**Utilitário:** `.btn-scale` em `App.css` (scale 0.95 no active)

---

### Formulários

| Formulário | Arquivo | Preservar? |
|------------|---------|------------|
| Novo projeto | NewProject.js | ⚠️ Preservar layout; reconstruir lógica |
| Configurações | Settings.js | ⚠️ Preservar layout; reconstruir lógica |
| shadcn `Form`, `Input`, `Textarea`, `Select`, `RadioGroup` | ui/ | ✅ Adotar na reconstrução |
| react-hook-form + zod | package.json | ✅ Adotar na reconstrução |

**Padrão visual de inputs:**

```
w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl
text-white focus:ring-1 focus:ring-white
```

---

### Grids

| Grid | Colunas | Onde |
|------|---------|------|
| Stats | 1 → 2 → 4 | Dashboard, Plan |
| Projects / Images | 1 → 2 → 3 | Dashboard, Projects, ProjectDetail, PublicProject |
| Pricing | 1 → 3 | Plan |
| Visibilidade (radio) | 1 → 3 | NewProject |

**Preservar:** Padrão de breakpoints e `gap-6` — consistente em todo o projeto.

---

### Tabelas

| Tipo | Status |
|------|--------|
| Lista de imagens (modo lista) | Implementada como `<div>` flex, não `<table>` |
| shadcn `Table` | Instalado, não usado |

**Recomendação:** Modo lista de `ProjectDetail` pode ser preservado como layout flex; avaliar shadcn `Table` se houver sorting/paginação futura.

---

## Sistema Visual

### Paleta de cores

#### Cores aplicadas nas páginas (uso real)

| Token | Valor / Classe | Uso |
|-------|----------------|-----|
| Background principal | `#050505` | body, sidebar, viewers |
| Superfície card | `bg-zinc-900/50` | cards, seções de form |
| Borda card | `border-zinc-800` | contornos, divisores |
| Superfície elevada | `bg-zinc-800`, `bg-zinc-900` | inputs, ícones, menus |
| Texto primário | `text-white` | títulos, valores |
| Texto secundário | `text-zinc-400`, `text-zinc-300` | labels, descrições |
| Texto terciário | `text-zinc-500`, `text-zinc-600` | placeholders, hints |
| CTA / Acento | `bg-white text-black` | botões primários, nav ativo |
| Destructive | `text-red-400` | ações de excluir |
| Overlay | `bg-black/60 backdrop-blur-xl border-white/10` | controles do viewer |
| Badge status | `bg-black/60 backdrop-blur-xl rounded-full` | tags em cards |

#### Tokens shadcn (definidos, não usados nas páginas)

Definidos em `index.css` (`:root` e `.dark`): `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius`.

**Observação:** Classe `.dark` nunca é aplicada ao `<html>` — tema escuro é hardcoded, não gerenciado por tokens.

---

### Tipografia

| Elemento | Fonte | Peso | Tamanho típico | Classes |
|----------|-------|------|----------------|---------|
| H1 página | Outfit | light (300) | 4xl → 6xl | `font-light tracking-tighter` |
| H2 seção | Outfit | light | 2xl → 3xl | `font-light tracking-tight` |
| H3 card | Outfit/Manrope | medium | lg → xl | `font-medium` |
| Body | Manrope | 400–600 | base | `text-base` |
| Labels | Manrope | medium | sm | `text-sm font-medium text-zinc-400` |
| Stats | Manrope | light | 3xl → 5xl | `font-light text-white` |

**Import:** Google Fonts via `index.css` — Outfit (300–600) + Manrope (400–600).

---

### Espaçamentos

| Contexto | Valor |
|----------|-------|
| Padding de página | `p-8 md:p-12 lg:p-16` |
| Gap de grids | `gap-6` |
| Gap de seções | `mb-12` (header), `mb-6` (subseções) |
| Padding de cards | `p-6` (conteúdo), `p-4` (cards menores) |
| Padding de inputs | `px-4 py-3` |
| Border radius cards | `rounded-2xl` |
| Border radius inputs/menus | `rounded-xl` |
| Border radius CTAs/badges | `rounded-full` |

**Utilitários custom (`App.css`):**

- `.fade-in` — animação de entrada 0.3s
- `.card-hover` — transição de borda no hover
- `.image-zoom-hover` — scale 1.05 no hover da imagem
- `.btn-scale` — scale 0.95 no active

---

### Padrões de layout

| Layout | Estrutura | Rotas |
|--------|-----------|-------|
| Autenticado | Sidebar 256px + main scrollável | dashboard, projects, plan, settings |
| Fullscreen viewer | Sem chrome; overlays flutuantes | viewer, share/image |
| Público projeto | Header + main max-w-7xl + footer | share/project |
| Formulário | max-w-3xl centralizado | new project, settings |

---

### Padrões de responsividade

| Breakpoint | Comportamento típico |
|------------|---------------------|
| Mobile (< md) | 1 coluna; sidebar oculta (drawer); padding p-8 |
| Tablet (md) | 2 colunas em grids; padding p-12 |
| Desktop (lg+) | 3–4 colunas; sidebar fixa; padding p-16 |

---

## Responsividade

### Pontos fortes

- Sidebar mobile com drawer, overlay e animação `translate-x` — **bem implementada**
- Grids adaptativos consistentes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Padding escalonado por breakpoint em todas as páginas autenticadas
- Tipografia responsiva (`text-4xl sm:text-5xl lg:text-6xl`)
- Project hero em `ProjectDetail` empilha em mobile (`flex-col lg:flex-row`)
- Pricing cards empilham corretamente em mobile

### Problemas encontrados

| Problema | Página | Severidade |
|----------|--------|------------|
| Controles do viewer (info + zoom) lado a lado podem overflow | Viewer, PublicImage | Alta |
| Hint central fixo sobrepõe conteúdo em telas pequenas | Viewer, PublicImage | Média |
| Header com título + botão CTA sem wrap explícito | Dashboard, Projects | Média |
| Zoom/fullscreen visíveis no mobile (contrário às regras de negócio) | Viewer, PublicImage | Alta |
| Capa do projeto público não abre viewer no mobile | PublicProject | Alta |
| Dropdown menus podem sair da viewport | Projects, ProjectDetail | Baixa |

### Páginas que exigirão revisão

1. **Viewer.js** — redesign mobile (rodapé simplificado, sem controles visuais)
2. **PublicImage.js** — mesmas regras do viewer privado
3. **PublicProject.js** — tap na capa → primeira imagem no mobile
4. **ProjectDetail.js** — menus contextuais em telas pequenas
5. **Plan.js** — badges "Plano atual" / "Mais popular" podem colidir em mobile
6. **Layout.js** — validar z-index do hamburger vs overlays do viewer

---

## Dependências

### Core (produção)

| Pacote | Versão | Uso |
|--------|--------|-----|
| react | ^19.0.0 | Framework UI |
| react-dom | ^19.0.0 | Renderização |
| react-router-dom | ^7.5.1 | Roteamento |
| react-scripts | 5.0.1 | CRA base |
| tailwindcss | ^3.4.17 | Estilos utilitários |
| lucide-react | ^0.507.0 | Ícones |
| clsx | ^2.1.1 | Classes condicionais |
| tailwind-merge | ^3.2.0 | Merge de classes Tailwind |
| class-variance-authority | ^0.7.1 | Variantes de componentes |
| tailwindcss-animate | ^1.0.7 | Animações Tailwind |

### Radix UI (via shadcn — 22 pacotes)

`@radix-ui/react-accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `collapsible`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `slider`, `slot`, `switch`, `tabs`, `toast`, `toggle`, `toggle-group`, `tooltip`

### Formulários e validação (não usados)

| Pacote | Versão |
|--------|--------|
| react-hook-form | ^7.56.2 |
| @hookform/resolvers | ^5.0.1 |
| zod | ^3.24.4 |

### HTTP e dados (não usados)

| Pacote | Versão |
|--------|--------|
| axios | ^1.8.4 |

### UI adicional (não usados)

| Pacote | Versão |
|--------|--------|
| recharts | ^3.6.0 |
| date-fns | ^4.1.0 |
| react-day-picker | 8.10.1 |
| next-themes | ^0.4.6 |
| sonner | ^2.0.3 |
| embla-carousel-react | ^8.6.0 |
| cmdk | ^1.1.1 |
| vaul | ^1.1.2 |
| input-otp | ^1.4.2 |
| react-resizable-panels | ^3.0.1 |

### Dev / plataforma

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| @craco/craco | ^7.1.0 | Override CRA |
| @emergentbase/visual-edits | 1.0.8 | Edição visual Emergent |
| eslint + plugins | 9.23.0 | Linting |
| autoprefixer, postcss | — | CSS pipeline |

### Dependências a adicionar na reconstrução (roadmap)

- **Pannellum** — viewer 360° (mencionado no roadmap)
- Possivelmente biblioteca de auth (Firebase, Auth.js, etc.) — a definir

---

## Dados Mockados

### Páginas que usam mocks

| Página | Objeto mock | Conteúdo |
|--------|-------------|----------|
| `Dashboard.js` | `mockProjects` | 3 projetos + stats hardcoded |
| `Projects.js` | `mockProjects` | 6 projetos (array separado) |
| `ProjectDetail.js` | `mockProject` | 1 projeto com 4 imagens |
| `NewProject.js` | `formData` (state) | Form vazio; submit fake |
| `Viewer.js` | `mockImage` | 1 imagem fixa |
| `Settings.js` | `formData` (state) | João Silva, joao@studio.com |
| `Plan.js` | `plans` + stats inline | 3 planos + consumo |
| `PublicProject.js` | `mockProject` | Mesmo projeto do detail |
| `PublicImage.js` | `mockImage` | Mesma imagem do viewer |

### Componentes que usam mocks

Não existem componentes de domínio separados — **todos os mocks estão inline nas páginas**. O único componente reutilizável (`Layout.js`) não usa mocks.

### Imagens externas

Todas as imagens vêm de URLs **Unsplash** hardcoded — não representam panorâmicas 360° e dependem de conexão externa.

### Riscos dos mocks

| Risco | Impacto |
|-------|---------|
| Params de URL ignorados (`:id`, `:projectId`, `:imageId`) | Alto — falsa impressão de roteamento dinâmico |
| Arrays mock duplicados entre páginas | Médio — inconsistência ao conectar API |
| Submit fake (`console.log`, redirect) | Alto — fluxos parecem funcionar mas não persistem |
| Nomenclatura de visibilidade divergente | Alto — migração de dados/comportamento |
| Planos e features inventados | Médio — UI não reflete business-rules |
| Stats hardcoded inconsistentes (Dashboard vs Plan) | Baixo — confusão visual (24 projetos vs 2/3 consumo) |

---

## Problemas Encontrados

### Crítico

| # | Problema | Detalhe |
|---|----------|---------|
| C1 | Zero funcionalidade real | Nenhuma operação persiste dados ou chama API |
| C2 | Viewer não é 360° | Imagem estática; todo o core do produto precisa ser reconstruído |
| C3 | Autenticação ausente | Todas as rotas "privadas" são acessíveis sem login |
| C4 | Params de rota ignorados | `:id`, `:projectId`, `:imageId` não alteram conteúdo |
| C5 | Páginas MVP ausentes | Auth, landing, portfólio `/f/:slug`, legal, hotspots |
| C6 | Divergência de rotas de share | Implementado `/share/image/:projectId/:imageId` vs spec `/share/image/:imageId` |

### Alto

| # | Problema | Detalhe |
|---|----------|---------|
| A1 | Duplicação massiva de mocks e UI | mockProjects, mockProject, mockImage, viewer duplicado |
| A2 | Dois design systems paralelos | Tailwind hardcoded vs shadcn não integrado |
| A3 | Modais inexistentes | Upload, share, delete confirm — fluxos críticos sem UI |
| A4 | Visibilidade divergente | UI: Privado/Não listado/Público vs docs: private/shared/public |
| A5 | Campo `clientName` ausente | Obrigatório nas business-rules |
| A6 | Regras mobile do viewer não implementadas | Zoom/fullscreen visíveis; rodapé não simplificado |
| A7 | Emergent/PostHog no HTML | Scripts de plataforma devem ser removidos antes do go-live |
| A8 | Monolito por página | Sem services, hooks de domínio, context ou testes |

### Médio

| # | Problema | Detalhe |
|---|----------|---------|
| M1 | Planos divergentes do roadmap | Gratuito/Pro/Enterprise vs Starter/Professional |
| M2 | shadcn dead weight | 46 componentes no repo, zero usados nas páginas |
| M3 | Dependências não usadas | axios, recharts, react-hook-form, zod, etc. |
| M4 | CRA + React 19 | Stack CRA em manutenção; possível fricção |
| M5 | react-day-picker 8 + React 19 | Peer dependency potencialmente conflituosa |
| M6 | Sem assets locais | Sem favicon, logo, manifest |
| M7 | README genérico CRA | Não documenta o projeto FIVI360 |
| M8 | Settings incompleto | Falta publicSlug, senha, logout |

### Baixo

| # | Problema | Detalhe |
|---|----------|---------|
| B1 | Stats inconsistentes entre páginas | Dashboard: 24 projetos; Plan: 2/3 consumo |
| B2 | Hint do viewer sempre visível | Pode atrapalhar UX após primeiro uso |
| B3 | `isFullscreen` state no Viewer | Declarado mas não usado para render condicional |
| B4 | Title HTML "Emergent \| Fullstack App" | Não reflete FIVI360 |
| B5 | lang="en" no HTML | Produto em português |
| B6 | Dropdown custom sem click-outside | Menu permanece aberto até toggle |

---

## Oportunidades de Reaproveitamento

### O que pode ser mantido

| Item | Justificativa |
|------|---------------|
| `Layout.js` | Sidebar responsiva com identidade visual madura |
| `App.css` | Micro-interações testadas (card-hover, btn-scale, fade-in) |
| Padrões visuais de cards | Stat, project, image, pricing — base sólida |
| Overlay do viewer | Estrutura de controles adaptável ao Pannellum |
| `index.css` | Fontes Outfit/Manrope e tokens shadcn como base |
| Biblioteca shadcn completa | Acelerar modals, forms, dropdowns, toasts |
| `data-testid` | Facilitar testes E2E na reconstrução |
| Estrutura de rotas em `App.js` | Esqueleto de navegação reconhecível |
| Layout das 9 páginas | Wireframes funcionais claros para cada feature |

### O que deve ser descartado

| Item | Justificativa |
|------|---------------|
| Objetos `mock*` inline | Substituir por API/hooks |
| Viewer simulado (CSS scale) | Substituir por Pannellum |
| Dropdowns `<div>` custom | Substituir por shadcn `DropdownMenu` |
| Forms HTML nativos | Substituir por shadcn + react-hook-form + zod |
| Scripts Emergent/PostHog/badge | Remover antes do go-live |
| Nomenclatura Privado/Não listado/Público | Migrar para private/shared/public |
| Planos Gratuito/Pro/Enterprise | Alinhar a Starter/Professional |
| Imagens Unsplash hardcoded | Substituir por assets reais da API |
| Duplicação Viewer + PublicImage | Unificar em componente compartilhado |

### O que deve ser reconstruído

| Item | Prioridade |
|------|------------|
| Camada de API (axios/fetch + services) | Alta — fundação |
| Auth (login, register, guards, session) | Alta — Sprint 1 |
| Modais (upload, share, delete, rename) | Alta — Sprint 4 |
| Viewer Pannellum + hotspots | Alta — Sprints 5–6 |
| Portfólio `/f/:publicSlug` | Média — Sprint 7 |
| Landing page | Média — Sprint 9 |
| Páginas legais (termos, privacidade) | Média — Sprint 10 |
| Componentes extraídos (PageHeader, StatCard, etc.) | Alta — Fase 0 |
| Testes E2E | Média — Sprint 10 |

---

## Plano de Reconstrução Recomendado

Ordem alinhada ao `docs/roadmap.md` e ao estado do protótipo visual.

### Fase 0 — Fundação (pré-requisito)

Antes das sprints funcionais:

- Extrair componentes visuais: `PageHeader`, `StatCard`, `ProjectCard`, `ImageCard`, `PrimaryButton`, `FormSection`
- Integrar shadcn de fato: `Button`, `Input`, `Dialog`, `DropdownMenu`, `Toaster`
- Normalizar visibilidade: `private | shared | public`
- Criar layouts: `AuthenticatedLayout`, `PublicLayout`, `ViewerLayout`
- Configurar camada API base (`services/`, interceptors, error handling)
- Remover ou isolar dependências Emergent para builds de produção

---

### 1. Auth

**Sprint 1 — conforme roadmap**

- Criar páginas: login, cadastro, recuperação de senha, login Google
- Implementar route guards para rotas autenticadas
- Redirecionar `/` conforme sessão (landing ou dashboard)
- Logout acessível via sidebar ou menu de usuário
- **Protótipo atual:** nenhuma tela — construir do zero
- **Reaproveitar:** estilo visual de forms de `NewProject.js` / `Settings.js`

---

### 2. Dashboard

**Sprint 2 — conforme roadmap**

- Conectar stat cards à API (projetos, imagens, links, armazenamento)
- Listar projetos recentes com dados reais
- Adicionar seção de imagens recentes (ausente no protótipo)
- **Reaproveitar:** layout completo de `Dashboard.js`
- **Descartar:** `mockProjects` e stats hardcoded

---

### 3. Projetos

**Sprint 3 — conforme roadmap**

- CRUD completo: criar, editar, excluir, compartilhar
- Adicionar campo `clientName`
- Visibilidade: `private`, `shared`, `public`
- Respeitar `:id` da URL em `ProjectDetail`
- **Reaproveitar:** `Projects.js`, `NewProject.js`, `ProjectDetail.js` (layout)
- **Reconstruir:** lógica, menus de ação, share

---

### 4. Imagens

**Sprint 4 — conforme roadmap**

- Modal de upload com preview (fluxo: selecionar → preview → nome → confirmar → loading)
- Renomear, substituir arquivo (preservar metadados), excluir
- Compartilhar imagem por link
- Validação de formatos: JPG, JPEG, PNG (rejeitar HEIC, TIFF, BMP)
- Aviso de qualidade abaixo do recomendado
- **Reaproveitar:** galeria grid/lista de `ProjectDetail.js`
- **Reconstruir:** modais (hoje inexistentes), toda lógica de upload

---

### 5. Viewer

**Sprint 5 — conforme roadmap**

- Integrar **Pannellum** para visualização 360° real
- Fullscreen e zoom no desktop
- Mobile: remover controles visuais de zoom/fullscreen; rodapé com projeto + imagem
- Unificar `Viewer.js` e `PublicImage.js` em componente compartilhado
- Respeitar params de rota para carregar imagem correta
- **Reaproveitar:** overlay de controles (adaptar)
- **Descartar:** simulação CSS scale + imagem estática

---

### 6. Hotspots

**Sprint 6 — conforme roadmap**

- Tipos: `info` (exibe informações) e `scene` (navega para outra imagem)
- Editor de hotspots (UI inexistente no protótipo)
- Restrição por plano (Starter sem hotspots)
- **Reaproveitar:** nada — construir do zero sobre o viewer Pannellum

---

### 7. Portfólio

**Sprint 7 — conforme roadmap**

- Página pública `/f/:publicSlug`
- Exibir projetos com visibilidade `public`
- Mobile: clicar na capa abre primeira imagem do projeto
- Configurar `publicSlug` em Settings (campo ausente)
- **Reaproveitar:** layout parcial de `PublicProject.js`
- **Reconstruir:** rota, slug, filtro por visibilidade public

---

### 8. Planos

**Sprint 8 — conforme roadmap**

- Planos **Starter** e **Professional** conforme business-rules
- Limites: imagens, hotspots, portfólio público
- Consumo real conectado à API
- **Reaproveitar:** layout de pricing cards e barras de progresso de `Plan.js`
- **Descartar:** planos Gratuito/Enterprise e features inventadas

---

### 9. Landing

**Sprint 9 — conforme roadmap**

- Hero, Recursos, Como Funciona, Preços, FAQ
- SEO básico (meta tags, title FIVI360)
- **Reaproveitar:** identidade visual (cores, tipografia, CTAs)
- **Protótipo atual:** inexistente — construir do zero

---

### 10. Go Live

**Sprint 10 — conforme roadmap**

- Páginas legais: termos de uso, política de privacidade, ajuda
- LGPD
- Testes E2E (aproveitar `data-testid` existentes)
- Remover Emergent badge, PostHog, `emergent-main.js`, visual-edits
- Favicon, manifest, assets locais
- Publicação e monitoramento
- Avaliar migração CRA → Vite (opcional, pós-MVP)

---

## Conclusão

O projeto base FIVI360 gerado pelo Emergent representa um **protótipo visual sólido** para a reconstrução funcional da plataforma. A identidade dark premium — fundo `#050505`, tipografia Outfit/Manrope, cards zinc com bordas sutis, CTAs brancos arredondados — está consistente e madura o suficiente para ser preservada como diretriz visual.

Do ponto de vista estrutural, o projeto oferece **9 páginas-wireframe**, **1 layout autenticado funcional**, **10 rotas declaradas** e **46 componentes shadcn prontos para adoção**. Porém, nenhuma feature de negócio está implementada: dados mockados, params de URL ignorados, viewer simulado, modais inexistentes, autenticação ausente e rotas críticas do MVP (landing, portfólio, legal, hotspots) não existem.

**Recomendação final:** tratar o código atual exclusivamente como **documentação visual interativa** — não como base de lógica. A reconstrução deve seguir a ordem Auth → Dashboard → Projetos → Imagens → Viewer → Hotspots → Portfólio → Planos → Landing → Go Live, precedida por uma fase de fundação que unifique o design system, extraia componentes reutilizáveis e estabeleça a camada de API.

Este documento serve como **referência permanente** para consulta durante toda a reconstrução do FIVI360.

---

*Documento gerado com base na auditoria somente leitura realizada em 31/05/2026. Nenhum código do projeto foi alterado durante a produção deste relatório.*
