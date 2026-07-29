# FIVI360 — Documento de Reconstrução da Landing Page

**Versão:** 1.1  
**Data:** 03/06/2026  
**Status:** Referência de arquitetura — **sem implementação**  
**Escopo:** Definir estrutura, conteúdo e plano para reconstruir a Landing Page pública do FIVI360.

**Changelog v1.1:** Showcase/Demo passa a usar **projeto público real** (`LANDING_DEMO.projectId`) com viewer interativo — sem imagem estática, vídeo ou screenshot.

---

## Sumário

1. [Contexto e premissas](#1-contexto-e-premissas)
2. [Estrutura completa da Landing](#2-estrutura-completa-da-landing)
3. [Ordem das seções](#3-ordem-das-seções)
4. [Objetivo de cada seção](#4-objetivo-de-cada-seção)
5. [Componentes necessários](#5-componentes-necessários)
6. [Responsividade esperada](#6-responsividade-esperada)
7. [Conteúdo sugerido](#7-conteúdo-sugerido)
8. [CTAs (Call to Action)](#8-ctas-call-to-action)
9. [Dependências técnicas](#9-dependências-técnicas)
10. [Componentes reutilizáveis do projeto atual](#10-componentes-reutilizáveis-do-projeto-atual)
11. [Plano de implementação por etapas](#11-plano-de-implementação-por-etapas)
12. [Critérios de aceite](#12-critérios-de-aceite)
13. [Referências internas](#13-referências-internas)
14. [Demonstração interativa (projeto público)](#14-demonstração-interativa-projeto-público)

---

## 1. Contexto e premissas

### 1.1 Situação atual

| Aspecto | Estado |
|---------|--------|
| Landing Page no código | **Inexistente** — rota `/` redireciona para `/dashboard` |
| Capturas da versão anterior | Externas ao repositório (referência visual manual) |
| Identidade visual no app | Consistente — dark premium `#050505`, Outfit/Manrope, CTAs brancos |
| Produto funcional | Auth, dashboard, projetos, imagens, viewer Pannellum, hotspots, portfólio, planos |
| Portfólio público FIVI360 | Existente em `/u/fivi360` |
| Projeto demo oficial | A criar/usar — ID fixo em `src/config/landingDemo.js` |
| Assets de marketing | Nenhum no repo (`public/` contém apenas `index.html`) — **Showcase não depende de assets estáticos** |

### 1.2 Objetivo deste documento

Servir como **fonte única de verdade** para reconstruir a Landing combinando:

- **Design da versão anterior** (capturas de tela) — layout, hierarquia visual, tom premium minimalista.
- **Funcionalidades atuais do produto** — recursos que a landing original não mencionava (hotspots, portfólio público, planos com enforcement, compartilhamento por link, etc.).

### 1.3 Princípios de reconstrução

1. **Preservar identidade** conforme `docs/design-system.md` e `docs/design_guidelines.json`.
2. **Expandir conteúdo** para refletir o MVP atual descrito em `docs/product.md`.
3. **Reutilizar** componentes e padrões já extraídos na fundação (`PageHeader`, `SectionHeader`, pricing de `Plan.js`, viewer de `PanoramaViewer`, acesso público de `PublicProject.js`).
4. **Não duplicar lógica** — dados de planos vêm de `src/config/planLimits.js`; demo vem de `src/config/landingDemo.js`.
5. **SPA única** — landing, auth e app compartilham o mesmo deploy (Firebase Hosting).
6. **Conversão primária** — cadastro gratuito (plano Starter); login para usuários existentes.
7. **Demo real** — showcase interativo via projeto público fixo (`LANDING_DEMO`), atualizável pelo app sem deploy.

### 1.4 Diferencial: produto atual vs. landing original

A landing original (capturas) cobria essencialmente: Hero, Recursos, Como Funciona, Preços e FAQ.

O produto evoluiu e a **nova landing deve incluir**:

| Recurso atual | Presente na landing original? | Ação na nova landing |
|---------------|-------------------------------|----------------------|
| Viewer 360° (Pannellum) | Provavelmente sim (genérico) | **Demo interativa real** na seção Showcase |
| Hotspots (info + navegação entre cenas) | Provavelmente não | Nova feature card + passo no "Como funciona" |
| Portfólio público (`/u/:slug`) | Provavelmente não | Seção dedicada "Seu portfólio online" |
| Compartilhamento por link (shared/public) | Parcial | Seção ou bullet em recursos |
| Planos Starter / Professional / Enterprise | Sim (possivelmente 2 tiers) | 3 tiers via `PLAN_LIMITS` |
| Dashboard com métricas | Não | Opcional em showcase (screenshot do app) |
| Upload com preview e substituição | Não | Mencionar em "Como funciona" |
| Visibilidade (private / shared / public) | Não | Explicar em FAQ ou recursos |
| Auth (email + Google preparado) | CTAs para cadastro | CTAs apontam para `/register` e `/login` |

---

## 2. Estrutura completa da Landing

### 2.1 Árvore de arquivos proposta

```
src/
├── pages/
│   └── Landing.jsx                 # Página principal — composição das seções
├── components/
│   └── landing/
│       ├── LandingLayout.jsx       # Shell: header sticky + main + footer
│       ├── LandingHeader.jsx       # Nav + logo + links âncora + auth CTAs
│       ├── LandingFooter.jsx       # Links legais, branding, redes
│       ├── LandingHero.jsx         # Hero principal
│       ├── LandingAudience.jsx     # Público-alvo / segmentos
│       ├── LandingProblem.jsx      # Problema vs. solução (opcional, compacto)
│       ├── LandingFeatures.jsx     # Grid de recursos
│       ├── LandingShowcase.jsx     # Demo interativa (viewer + projeto público real)
│       ├── LandingDemoPreview.jsx  # (opcional) Wrapper do viewer embutido na landing
│       ├── LandingHowItWorks.jsx   # Passos numerados
│       ├── LandingPortfolio.jsx    # Destaque portfólio + compartilhamento
│       ├── LandingPricing.jsx      # Cards de planos (marketing)
│       ├── LandingFaq.jsx          # Accordion de perguntas
│       └── LandingFinalCta.jsx     # Bloco final de conversão
├── config/
│   ├── landingContent.js           # Textos, features, FAQ, steps (estático)
│   └── landingDemo.js              # ID e rotas do projeto demo oficial
└── hooks/
    ├── useLandingRedirect.js       # (opcional) lógica de redirect autenticado
    └── useLandingDemo.js           # Carrega projeto demo por LANDING_DEMO.projectId
```

### 2.2 Roteamento proposto

| Rota | Componente | Guard | Comportamento |
|------|------------|-------|---------------|
| `/` | `Landing` | Redirect se autenticado → `/dashboard` | Landing pública |
| `/register` | `SignUp` | `PublicRoute` | CTA principal |
| `/login` | `Login` | `PublicRoute` | CTA secundário |
| `#recursos`, `#demo`, `#como-funciona`, `#precos`, `#faq` | âncoras na Landing | — | Scroll suave |

**Alteração em `App.js` (futura):**

```jsx
// Substituir:
<Route path="/" element={<Navigate to="/dashboard" replace />} />

// Por:
<Route path="/" element={<LandingRoute><Landing /></LandingRoute>} />
```

`LandingRoute` — análogo a `PublicRoute`: se `user` existe → `/dashboard`; senão → renderiza Landing.

### 2.3 Layout macro

```
┌─────────────────────────────────────────────────────────┐
│  LandingHeader (sticky, blur, border-b)                 │
├─────────────────────────────────────────────────────────┤
│  LandingHero                                            │
├─────────────────────────────────────────────────────────┤
│  LandingAudience                                        │
├─────────────────────────────────────────────────────────┤
│  LandingProblem (opcional — pode fundir com Hero)       │
├─────────────────────────────────────────────────────────┤
│  LandingFeatures          ← id="recursos"               │
├─────────────────────────────────────────────────────────┤
│  LandingShowcase                                        │
├─────────────────────────────────────────────────────────┤
│  LandingHowItWorks        ← id="como-funciona"          │
├─────────────────────────────────────────────────────────┤
│  LandingPortfolio                                       │
├─────────────────────────────────────────────────────────┤
│  LandingPricing           ← id="precos"                 │
├─────────────────────────────────────────────────────────┤
│  LandingFaq               ← id="faq"                    │
├─────────────────────────────────────────────────────────┤
│  LandingFinalCta                                        │
├─────────────────────────────────────────────────────────┤
│  LandingFooter                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Ordem das seções

| # | Seção | ID âncora | Prioridade |
|---|-------|-----------|------------|
| 0 | Header / Navegação | — | P0 |
| 1 | Hero | — | P0 |
| 2 | Público-alvo | — | P1 |
| 3 | Problema → Solução | — | P2 (pode ser absorvido pelo Hero) |
| 4 | Recursos | `recursos` | P0 |
| 5 | Showcase / Demo | `demo` | P1 |
| 6 | Como funciona | `como-funciona` | P0 |
| 7 | Portfólio e compartilhamento | — | P1 |
| 8 | Planos e preços | `precos` | P0 |
| 9 | FAQ | `faq` | P0 |
| 10 | CTA final | — | P0 |
| 11 | Footer | — | P0 |

**Nota sobre capturas originais:** Se as capturas não incluírem as seções 2, 5 e 7, mantê-las na nova landing por refletirem funcionalidades atuais; ajustar densidade visual para não quebrar o ritmo da versão anterior (espaçamento generoso, uma ideia por bloco).

---

## 4. Objetivo de cada seção

### 4.0 LandingHeader

**Objetivo:** Navegação persistente, reforço de marca e acesso rápido a login/cadastro.

**Elementos:**
- Logo `FIVI**360**` (texto, mesmo padrão de `AuthHeader`)
- Links âncora: Recursos, **Demo**, Como funciona, Preços, FAQ
- Botão secundário "Entrar" → `/login`
- Botão primário "Começar grátis" → `/register`

**Comportamento:** Sticky no topo; `backdrop-blur-xl bg-[#050505]/80` ao scroll; menu hamburger no mobile.

---

### 4.1 LandingHero

**Objetivo:** Comunicar proposta de valor em 5 segundos e direcionar para cadastro.

**Elementos:**
- Headline principal (H1)
- Subheadline explicando o benefício
- CTA primário: **"Começar Gratuitamente"** → `/register`
- CTA secundário: **"Ver Demonstração"** → scroll para `#demo` **ou** abre `LANDING_DEMO.projectPath` em nova aba (decisão de UX na implementação; preferir scroll inline para manter conversão)
- Visual hero: preview estático leve ou frame decorativo apontando para a seção demo — **não** embedar viewer completo no hero (peso duplicado)
- Badge opcional: "Plano Starter gratuito"

**Referência visual:** Variante centralizada de `PageHeader` + visual à direita/abaixo (layout split em desktop).

---

### 4.2 LandingAudience

**Objetivo:** Visitante se identifica com o produto ("é para mim").

**Elementos:**
- Título: "Feito para profissionais que apresentam espaços"
- Grid 2×2 ou 4 colunas: Arquitetos, Designers de interiores, Escritórios, Incorporadoras/construtoras
- Ícones Lucide por segmento

---

### 4.3 LandingProblem (opcional)

**Objetivo:** Contraste entre formatos estáticos (PDF, fotos) e experiência imersiva 360°.

**Elementos:**
- Duas colunas: "Antes" vs. "Com FIVI360"
- Bullets curtos; sem tom agressivo — premium e factual

**Alternativa:** Fundir os bullets no subtítulo do Hero para reduzir scroll.

---

### 4.4 LandingFeatures

**Objetivo:** Listar capacidades do MVP atual de forma escaneável.

**Elementos:**
- `SectionHeader` centralizado
- Grid Bento (2×3 ou 3×2) de feature cards
- Cada card: ícone, título, descrição curta

**Features obrigatórias (produto atual):**

1. Imagens panorâmicas 360°
2. Organização por projetos
3. Viewer imersivo (Pannellum)
4. Hotspots interativos
5. Compartilhamento por link
6. Portfólio público personalizado
7. Controle de visibilidade (privado / link / público)
8. Dashboard e métricas de uso

---

### 4.5 LandingShowcase (Demo interativa)

**Objetivo:** Prova interativa — visitante **navega um projeto real** antes de se cadastrar.

**Estratégia (v1.1):**

| Abordagem | Usar? |
|-----------|-------|
| Imagem estática / screenshot | **Não** |
| Vídeo loop | **Não** |
| Projeto público real via `LANDING_DEMO.projectId` | **Sim** |
| Seleção dinâmica (primeiro projeto do portfólio) | **Não** |

**Elementos:**
- `id="demo"` para âncora de navegação
- Título: **"Experimente uma apresentação 360°"**
- Subtítulo: **"Navegue por um projeto real, explore hotspots e veja como seus clientes podem visualizar ambientes de forma interativa."**
- Container `rounded-2xl border border-zinc-800` com aspect ratio adequado (16:9 desktop; altura mínima no mobile)
- **Viewer real:** `PanoramaViewer` + primeira imagem pública do projeto demo (ou seletor de cena simplificado)
- Carregamento via `useLandingDemo` → `getProjectById(LANDING_DEMO.projectId)` + `getImagesByProjectIdPublic`
- Respeitar `isPubliclyAccessible(project.visibility)` — mesmas regras de `PublicProject.js`
- CTAs abaixo ou ao lado do viewer:
  - **"Abrir projeto demo"** → `LANDING_DEMO.projectPath` (`/share/project/:projectId`)
  - **"Ver portfólio FIVI360"** → `LANDING_DEMO.portfolioPath` (`/u/fivi360`)

**Fallback (obrigatório):**

Se o projeto não existir, estiver `private`, falhar no load ou não tiver imagens:

```
Demonstração temporariamente indisponível.
```

- Exibir placeholder visual amigável (ícone 360°, borda zinc) — **não quebrar a landing**
- CTAs permanecem visíveis; link do portfólio continua funcional
- Sem exigir login

**Performance:**
- Lazy-load do Pannellum apenas quando a seção `#demo` entrar no viewport (`IntersectionObserver`) ou após idle
- Uma cena ativa por vez na landing; navegação entre cenas via hotspots scene ou link "Abrir projeto demo"

**Referência de implementação:** Reutilizar padrões de `PublicImage.js` (viewer + hotspots) e regras de acesso de `PublicProject.js`.

---

### 4.6 LandingHowItWorks

**Objetivo:** Reduzir fricção mostrando fluxo simples do produto.

**Elementos:**
- 4 passos numerados (horizontal desktop, vertical mobile)
- Linha conectora ou setas entre passos

**Passos sugeridos:**

1. **Crie sua conta** — Cadastro gratuito em segundos
2. **Organize seus projetos** — Upload de panoramas e capas
3. **Configure hotspots** — Informações e navegação entre ambientes *(Professional)*
4. **Compartilhe ou publique** — Link direto ou portfólio em `/u/seu-slug`

---

### 4.7 LandingPortfolio

**Objetivo:** Destacar diferencial de portfólio e páginas públicas limpas (funcionalidade nova vs. landing original).

**Elementos:**
- Split layout: texto + link para demo/portfólio real
- Bullets: slug personalizado, projetos públicos, páginas sem sidebar admin
- CTA: **"Ver portfólio FIVI360"** → `LANDING_DEMO.portfolioPath` + **"Criar meu portfólio"** → `/register`

---

### 4.8 LandingPricing

**Objetivo:** Transparência de planos e conversão para Starter gratuito; preparar upgrade futuro.

**Elementos:**
- 3 cards: Starter, Professional (destaque), Enterprise
- Dados de `PLAN_LIMITS` e `PLAN_ORDER`
- Badge "Recomendado" no Professional
- CTA Starter: "Começar grátis" → `/register`
- CTA Professional/Enterprise: "Em breve" (estado atual do app)

**Diferença vs. `Plan.js`:** Versão marketing — sem consumo do usuário, sem "Plano atual", CTAs sempre ativos no Starter.

---

### 4.9 LandingFaq

**Objetivo:** Remover objeções antes do cadastro.

**Elementos:**
- `Accordion` shadcn com 6–8 perguntas
- Link "Ainda tem dúvidas?" → `/ajuda` (quando existir) ou e-mail de contato

---

### 4.10 LandingFinalCta

**Objetivo:** Última oportunidade de conversão antes do footer.

**Elementos:**
- Card full-width ou seção com fundo `bg-zinc-900/50`
- Headline curta: "Apresente seus projetos de forma imersiva"
- Botão primário: **"Começar Gratuitamente"** → `/register`
- Texto "Sem cartão de crédito"

---

### 4.11 LandingFooter

**Objetivo:** Links legais, confiança e branding.

**Elementos:**
- Logo + tagline curta
- Colunas: Produto (âncoras), Legal (`/termos`, `/privacidade`), Conta (`/login`, `/register`)
- Copyright
- "Powered by FIVI360" — alinhado ao padrão de `PublicPageShell`

---

## 5. Componentes necessários

### 5.1 Novos (específicos da landing)

| Componente | Responsabilidade | Dependências |
|------------|------------------|--------------|
| `Landing.jsx` | Orquestra seções, SEO head (react-helmet ou meta tags) | Todas as seções |
| `LandingLayout.jsx` | Shell min-h-screen, fade-in | Header, Footer |
| `LandingHeader.jsx` | Nav sticky, mobile menu | `Sheet` ou `Drawer` shadcn |
| `LandingFooter.jsx` | Rodapé multi-coluna | `Link` react-router |
| `LandingHero.jsx` | Hero split/central | `PageHeader`, `Button` |
| `LandingAudience.jsx` | Grid segmentos | `Card`, ícones Lucide |
| `LandingProblem.jsx` | Antes/depois | — |
| `LandingFeatures.jsx` | Bento grid | `SectionHeader`, `Card` |
| `LandingShowcase.jsx` | Seção demo + CTAs | `useLandingDemo`, `PanoramaViewer`, `LANDING_DEMO` |
| `LandingDemoPreview.jsx` | Viewer embutido (opcional, extraído do Showcase) | `PanoramaViewer`, `useHotspots` |
| `LandingHowItWorks.jsx` | Steps | `Badge` numerado |
| `LandingPortfolio.jsx` | Split + bullets | — |
| `LandingPricing.jsx` | Pricing marketing | `PLAN_LIMITS`, `Check` icon |
| `LandingFaq.jsx` | FAQ | `Accordion` |
| `LandingFinalCta.jsx` | CTA band | `Button` |
| `LandingRoute.jsx` | Guard autenticado | `useAuth`, `Navigate` |
| `landingContent.js` | Copy estático centralizado | — |
| `landingDemo.js` | ID e paths do projeto demo | — |
| `useLandingDemo.js` | Fetch projeto demo + imagens + estados error/loading | `projectService`, `imageService`, `isPubliclyAccessible` |

### 5.2 Extração recomendada (refactor prévio opcional)

| De | Para | Motivo |
|----|------|--------|
| `PublicProject.js` → `PublicPageShell` | `src/components/public/PublicPageShell.jsx` | Reutilizar footer/header em landing |
| `Plan.js` pricing cards | `PlanPricingCard.jsx` | Compartilhar entre `/plan` e landing |

---

## 6. Responsividade esperada

### 6.1 Breakpoints (Tailwind padrão)

| Breakpoint | Largura | Comportamento geral |
|------------|---------|---------------------|
| `default` | < 640px | Coluna única, nav hamburger, CTAs full-width |
| `sm` | ≥ 640px | Tipografia hero aumenta |
| `md` | ≥ 768px | Grids 2 colunas, steps 2×2 |
| `lg` | ≥ 1024px | Hero split 50/50, features 3 colunas, nav horizontal |
| `xl` | ≥ 1280px | `max-w-7xl` centralizado, padding `lg:p-16` |

### 6.2 Por seção

| Seção | Mobile (< md) | Tablet (md) | Desktop (lg+) |
|-------|---------------|-------------|---------------|
| Header | Hamburger + drawer | Links visíveis ou drawer | Nav completa + CTAs inline |
| Hero | Texto acima, visual abaixo | Idem | Split horizontal |
| Audience | 1 col | 2 col | 4 col |
| Features | 1 col | 2 col | 3 col (bento) |
| Showcase | Viewer interativo ou fallback | Idem | Max-width com sombra; lazy-load Pannellum |
| How it works | Steps empilhados | 2×2 grid | 4 col horizontal |
| Portfolio | Stack vertical | Stack | 50/50 split |
| Pricing | Cards empilhados | 2 col + 1 full | 3 col |
| FAQ | Full width accordion | max-w-3xl centered | max-w-3xl centered |
| Final CTA | Padding reduzido, botão full | Idem | Botão inline |

### 6.3 Tokens de espaçamento

Seguir `design_guidelines.json`:

- Page padding: `p-8 md:p-12 lg:p-16`
- Gap entre seções: `py-16 md:py-24` (generoso — premium feel)
- Gap interno grids: `gap-6` ou `gap-8`

### 6.4 Motion

- Entrada de página: classe `fade-in` (`App.css`)
- Cards: `card-hover` em feature e pricing cards
- Botões: `btn-scale` + `active:scale-95`
- Scroll suave para âncoras: `scroll-behavior: smooth` no `html` ou JS

### 6.5 Acessibilidade

- Contraste WCAG AA (texto branco/zinc-300 sobre `#050505`)
- Navegação por teclado no menu mobile
- `aria-expanded` no accordion FAQ
- Todos os CTAs e links interativos com `data-testid` (ver §12)

---

## 7. Conteúdo sugerido

### 7.1 Hero

| Campo | Texto sugerido |
|-------|----------------|
| **H1** | Apresente projetos em 360° |
| **Subheadline** | Transforme panoramas em experiências imersivas. Organize por projetos, adicione hotspots e compartilhe com clientes por link — ou publique seu portfólio online. |
| **CTA primário** | Começar Gratuitamente |
| **CTA secundário** | Ver Demonstração → `#demo` |
| **Badge** | Plano Starter gratuito — sem cartão |

### 7.1.1 Seção Demo (Showcase)

| Campo | Texto sugerido |
|-------|----------------|
| **Título** | Experimente uma apresentação 360° |
| **Subtítulo** | Navegue por um projeto real, explore hotspots e veja como seus clientes podem visualizar ambientes de forma interativa. |
| **CTA demo** | Abrir projeto demo → `LANDING_DEMO.projectPath` |
| **CTA portfólio** | Ver portfólio FIVI360 → `LANDING_DEMO.portfolioPath` |
| **Fallback** | Demonstração temporariamente indisponível. |

### 7.2 Público-alvo

| Segmento | Descrição |
|----------|-----------|
| Arquitetos | Apresente plantas e ambientes finalizados com navegação livre |
| Designers de interiores | Mostre materiais, cores e layout em contexto real |
| Escritórios | Centralize projetos de múltiplos clientes em um só lugar |
| Incorporadoras | Compartilhe unidades decoradas com links profissionais |

### 7.3 Recursos (cards)

| Título | Descrição |
|--------|-----------|
| Viewer 360° imersivo | Navegação fluida com Pannellum — zoom e tela cheia no desktop |
| Hotspots interativos | Pontos de informação e saltos entre ambientes *(Professional)* |
| Projetos organizados | Capa, descrição, cliente e galeria de panoramas |
| Compartilhamento instantâneo | Links públicos limpos, sem barreiras para o cliente |
| Portfólio online | Sua página em `fivi360.com/u/seu-nome` com projetos públicos |
| Controle de visibilidade | Privado, compartilhado por link ou público no portfólio |
| Upload inteligente | Preview antes de enviar; substitua arquivos sem perder hotspots |
| Dashboard completo | Métricas de projetos, imagens, links e armazenamento |

### 7.4 Como funciona (passos)

1. **Cadastre-se** — Crie sua conta gratuita em menos de um minuto.
2. **Suba seus panoramas** — Organize por projeto e adicione capas.
3. **Enriqueça com hotspots** — Guias informativos e tours entre cenas.
4. **Compartilhe** — Envie um link ou ative seu portfólio público.

### 7.5 Portfólio

| Campo | Texto |
|-------|-------|
| **Título** | Seu portfólio profissional, sempre online |
| **Descrição** | Escolha quais projetos são públicos e tenha uma página dedicada com sua marca. Clientes veem apenas o essencial — sem distrações. |
| **Bullets** | Slug personalizado · Páginas limpas sem painel admin · Compartilhamento de projetos e imagens individuais |

### 7.6 Planos (via `planLimits.js`)

Reutilizar `displayName`, `priceLabel` e `featureBullets` de:

- `PLAN_LIMITS.starter` — R$ 0, destaque "Começar grátis"
- `PLAN_LIMITS.professional` — "Em breve", badge Recomendado
- `PLAN_LIMITS.enterprise` — "Em breve", suporte prioritário

**Nota de rodapé:** "Cobrança online em breve. Limites do plano Starter já estão ativos."

### 7.7 FAQ

| Pergunta | Resposta resumida |
|----------|-------------------|
| O que é uma imagem panorâmica 360°? | Formato equirectangular que permite olhar em todas as direções, como estar no ambiente. |
| Preciso de equipamento especial? | Câmera 360° ou render equirectangular de softwares de visualização. |
| O plano gratuito tem limites? | Sim: 2 projetos e 25 MB (~5 imagens panorâmicas). Veja a tabela de planos. |
| O que são hotspots? | Marcadores no viewer com texto ou link para outra cena. Disponível no Professional. |
| Meus clientes precisam de conta? | Não. Links compartilhados e portfólio são acessíveis sem login. |
| Posso substituir uma imagem? | Sim, sem perder nome, descrição ou hotspots. |
| O FIVI360 funciona no celular? | Sim. Viewer otimizado para mobile; controles adaptados. |
| Como funciona o portfólio público? | Ative em Configurações, defina seu slug e marque projetos como públicos. |

### 7.8 CTA final

| Campo | Texto |
|-------|-------|
| **Headline** | Pronto para impressionar seus clientes? |
| **Sub** | Crie sua conta gratuita e publique seu primeiro projeto hoje. |
| **Botão** | Começar Gratuitamente |

### 7.9 SEO (meta tags)

| Tag | Valor sugerido |
|-----|----------------|
| `<title>` | FIVI360 — Apresente projetos com imagens panorâmicas 360° |
| `meta description` | Plataforma para arquitetos e designers apresentarem projetos com viewer 360°, hotspots, compartilhamento por link e portfólio online. Comece grátis. |
| `lang` | `pt-BR` |
| `theme-color` | `#050505` |
| Open Graph | `og:title`, `og:description`, `og:image` (asset a criar) |

---

## 8. CTAs (Call to Action)

### 8.1 Mapa de CTAs

| Local | Label | Destino | Variante | Prioridade |
|-------|-------|---------|----------|------------|
| Header | Entrar | `/login` | Secondary (outline) | Secundário |
| Header | Começar grátis | `/register` | Primary (white pill) | **Primário** |
| Hero | Começar Gratuitamente | `/register` | Primary | **Primário** |
| Hero | Ver Demonstração | `#demo` ou `LANDING_DEMO.projectPath` | Secondary / ghost | Secundário |
| Demo (Showcase) | Abrir projeto demo | `LANDING_DEMO.projectPath` | Primary ou outline | Secundário |
| Demo (Showcase) | Ver portfólio FIVI360 | `LANDING_DEMO.portfolioPath` | Secondary / ghost | Terciário |
| Features | — | — | Sem CTA (escaneabilidade) | — |
| Portfolio | Ver portfólio FIVI360 | `LANDING_DEMO.portfolioPath` | Secondary | Terciário |
| Portfolio | Criar meu portfólio | `/register` | Primary | Secundário |
| Pricing Starter | Começar grátis | `/register` | Primary | **Primário** |
| Pricing Pro/Enterprise | Em breve | — | Disabled | — |
| FAQ | Falar conosco | `mailto:` ou `/ajuda` | Link texto | Terciário |
| Final CTA | Começar Gratuitamente | `/register` | Primary large | **Primário** |
| Footer | Cadastrar / Entrar | `/register`, `/login` | Links | Secundário |

### 8.2 Hierarquia de conversão

```
Primário:   /register  (cadastro Starter gratuito)
Secundário: /login     (usuários existentes)
Terciário:  âncoras    (educação antes da conversão)
```

### 8.3 Estilo visual dos botões

Conforme design system:

```jsx
// Primary
className="bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200"

// Secondary
className="border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900"
```

### 8.4 `data-testid` sugeridos

| Elemento | data-testid |
|----------|-------------|
| Logo header | `landing-logo` |
| CTA header register | `landing-header-register-btn` |
| CTA header login | `landing-header-login-btn` |
| CTA hero primary | `landing-hero-register-btn` |
| CTA hero demo | `landing-hero-demo-btn` |
| Demo open project | `landing-demo-open-project-btn` |
| Demo portfolio | `landing-demo-portfolio-btn` |
| Demo viewer container | `landing-demo-viewer` |
| Demo fallback | `landing-demo-unavailable` |
| Pricing starter | `landing-pricing-starter-btn` |
| Final CTA | `landing-final-register-btn` |
| FAQ accordion item | `landing-faq-item-{index}` |

---

## 9. Dependências técnicas

### 9.1 Stack existente (sem novas dependências obrigatórias)

| Pacote | Uso na landing |
|--------|----------------|
| `react` 19 | Componentes |
| `react-router-dom` 7 | Rotas, `Link`, guards |
| `tailwindcss` 3 | Estilos |
| `lucide-react` | Ícones |
| shadcn/ui | `Button`, `Card`, `Accordion`, `Sheet`, `Badge`, `AspectRatio` |
| `@/lib/utils` (`cn`) | Composição de classes |
| `pannellum` | Viewer 360° embutido na seção demo (já no projeto) |

### 9.2 Dependências opcionais

| Pacote | Motivo | Alternativa |
|--------|--------|-------------|
| `react-helmet-async` | Meta tags dinâmicas por página | Editar `public/index.html` + valores estáticos |
| Nenhum analytics na v1 | Privacidade / Epic 10 | PostHog removido no go-live |

### 9.3 Integrações

| Sistema | Papel |
|---------|-------|
| Firebase Auth | `LandingRoute` verifica sessão via `useAuth` |
| Firebase Hosting | SPA rewrite — `/` serve `index.html` |
| `planLimits.js` | Fonte de copy dos planos |
| `landingDemo.js` | ID e rotas do projeto demo oficial |
| Firebase Firestore | Leitura pública do projeto demo (mesmas regras de share/portfólio) |

### 9.4 Assets a produzir (fora do código)

| Asset | Formato | Uso |
|-------|---------|-----|
| OG image | 1200×630 PNG | SEO / redes sociais |
| Favicon | ICO/SVG | `public/favicon.ico` |
| Logo (futuro) | SVG | Substituir logo texto se necessário |

**Showcase / Demo:** não requer assets — conteúdo vem do projeto público em produção.

Referência temporária de imagens (apenas hero decorativo opcional): `docs/design_guidelines.json` → `media_urls.panoramic_views`.

### 9.5 Alterações de infraestrutura (Epic 10)

- Atualizar `public/index.html`: remover Emergent, PostHog, badge; `lang="pt-BR"`; meta description correta
- Adicionar `favicon.ico` e `manifest.json`
- Configurar redirect `/` com guard de sessão

---

## 10. Componentes reutilizáveis do projeto atual

### 10.1 Componentes comuns

| Componente | Caminho | Uso na landing |
|------------|---------|----------------|
| `PageHeader` | `src/components/common/PageHeader.jsx` | Títulos de seção (Hero, Pricing header) — `align="center"` |
| `SectionHeader` | `src/components/common/SectionHeader.jsx` | H2 de Features, FAQ, How it works |
| `StatCard` | `src/components/common/StatCard.jsx` | Opcional: métricas sociais ("X projetos criados") se houver dado |
| `PanoramaViewer` | `src/components/viewer/PanoramaViewer.jsx` | **Demo interativa** na LandingShowcase |
| `HotspotInfoDialog` | `src/components/viewer/HotspotInfoDialog.jsx` | Hotspots info na demo |
| `useHotspots` | `src/hooks/useHotspots.js` | Hotspots do panorama demo |
| `isPubliclyAccessible` | `src/utils/visibility.js` | Validar visibilidade do projeto demo |

### 10.2 Auth / layout público

| Componente | Caminho | Uso na landing |
|------------|---------|----------------|
| `AuthHeader` | `src/components/auth/AuthHeader.jsx` | Base para logo no header |
| `AuthLayout` | `src/components/auth/AuthLayout.jsx` | Referência de shell full-screen dark |
| `PublicPageShell` | inline em `PublicProject.js` | **Extrair** — footer "Powered by FIVI360", header público |
| `PublicProject.js` | `src/pages/PublicProject.js` | Padrão de load + visibilidade para `useLandingDemo` |
| `PublicImage.js` | `src/pages/PublicImage.js` | Padrão de embed do `PanoramaViewer` com hotspots |
| `PublicRoute` | `src/components/auth/PublicRoute.jsx` | Modelo para `LandingRoute` |
| `AuthLoadingScreen` | `ProtectedRoute.jsx` | Loading enquanto verifica sessão |

### 10.3 Planos

| Recurso | Caminho | Uso na landing |
|---------|---------|----------------|
| `PLAN_LIMITS` | `src/config/planLimits.js` | Copy e features dos cards |
| `PLAN_ORDER` | `src/config/planLimits.js` | Ordem Starter → Pro → Enterprise |
| Pricing card UI | `src/pages/Plan.js` L33–111 | Template visual — extrair componente |
| `PlanUpgradeHint` | `src/components/plans/PlanUpgradeHint.jsx` | Nota "cobrança em breve" abaixo dos planos |

### 10.4 UI shadcn (prontos)

| Componente | Caminho | Uso |
|------------|---------|-----|
| `Button` | `src/components/ui/button.jsx` | CTAs |
| `Card` | `src/components/ui/card.jsx` | Feature cards |
| `Accordion` | `src/components/ui/accordion.jsx` | FAQ |
| `Badge` | `src/components/ui/badge.jsx` | "Recomendado", "Grátis" |
| `Sheet` | `src/components/ui/sheet.jsx` | Menu mobile |
| `AspectRatio` | `src/components/ui/aspect-ratio.jsx` | Showcase 16:9 |
| `Separator` | `src/components/ui/separator.jsx` | Divisores no footer |
| `NavigationMenu` | `src/components/ui/navigation-menu.jsx` | Alternativa ao nav custom |

### 10.5 Utilitários CSS

| Classe | Arquivo | Uso |
|--------|---------|-----|
| `fade-in` | `src/App.css` | Entrada da página |
| `card-hover` | `src/App.css` | Hover em cards |
| `btn-scale` | `src/App.css` | Micro-interação em botões |

### 10.6 O que NÃO reutilizar diretamente

| Item | Motivo |
|------|--------|
| `Layout.js` (sidebar) | Landing é página pública sem sidebar admin |
| `ProtectedRoute` | Landing é pública — usar guard inverso |
| `usePlanLimits` | Landing não precisa de consumo do usuário |
| Seleção dinâmica de demo | ID fixo em `landingDemo.js` — não buscar primeiro projeto do portfólio |
| Analytics / tracking de clique | Fora do escopo v1 |
| Formulário de contato | Fora do escopo v1 |
| Pagamento na landing | Fora do escopo v1 |

---

## 11. Plano de implementação por etapas

### Etapa 0 — Preparação (pré-requisitos)

**Objetivo:** Fundamentos antes de codar a landing.

| # | Tarefa | Entregável |
|---|--------|------------|
| 0.1 | Revisar capturas da landing original | Checklist visual (layout, cores, ordem) |
| 0.2 | Extrair `PublicPageShell` para componente compartilhado | `src/components/public/PublicPageShell.jsx` |
| 0.3 | Criar `landingContent.js` com copy deste documento | Config estática |
| 0.4 | Criar `landingDemo.js` e **cadastrar projeto demo** no app (visibilidade `shared` ou `public`) | `src/config/landingDemo.js` + projeto real |
| 0.5 | Preencher `LANDING_DEMO.projectId` e `projectPath` com o ID do projeto demo | Config atualizada |

**Estimativa:** 0,5–1 dia

---

### Etapa 1 — Fundação e roteamento

**Objetivo:** Landing acessível em `/` para visitantes não autenticados.

| # | Tarefa | Arquivos |
|---|--------|----------|
| 1.1 | Criar `LandingRoute.jsx` | `src/components/auth/LandingRoute.jsx` |
| 1.2 | Criar `LandingLayout.jsx` | shell mínimo |
| 1.3 | Criar `Landing.jsx` placeholder | `src/pages/Landing.jsx` |
| 1.4 | Atualizar rotas em `App.js` | `/` → Landing com guard |
| 1.5 | Testar: guest vê landing; authed → dashboard | Manual |

**Critério de aceite:** `/` renderiza shell vazio com logo e footer; usuário logado redireciona.

**Estimativa:** 0,5 dia

---

### Etapa 2 — Header, Hero e Footer

**Objetivo:** Primeira impressão e navegação funcional.

| # | Tarefa | Componentes |
|---|--------|-------------|
| 2.1 | `LandingHeader` sticky + mobile menu | Sheet |
| 2.2 | `LandingHero` com CTAs (incl. "Ver Demonstração" → `#demo`) | PageHeader |
| 2.3 | `LandingFooter` com links legais placeholder | Separator, Link |
| 2.4 | Scroll suave para âncoras | CSS ou hook |

**Critério de aceite:** CTAs levam a `/register` e `/login`; nav mobile funciona; footer visível.

**Estimativa:** 1 dia

---

### Etapa 3 — Seções de conteúdo (P0)

**Objetivo:** Corpo principal alinhado à landing original + features atuais.

| # | Tarefa | Componentes |
|---|--------|-------------|
| 3.1 | `LandingFeatures` | SectionHeader, Card grid |
| 3.2 | `LandingHowItWorks` | 4 steps |
| 3.3 | `LandingPricing` | Extrair card de Plan.js ou duplicar markup marketing |
| 3.4 | `LandingFaq` | Accordion + landingContent |
| 3.5 | `LandingFinalCta` | CTA band |

**Critério de aceite:** Todas as âncoras `#recursos`, `#demo`, `#como-funciona`, `#precos`, `#faq` funcionam.

**Estimativa:** 1,5–2 dias

---

### Etapa 4 — Seções complementares (P1)

**Objetivo:** Diferenciais do produto atual.

| # | Tarefa | Componentes |
|---|--------|-------------|
| 4.1 | `LandingAudience` | Grid segmentos |
| 4.2 | `useLandingDemo` + `LandingShowcase` com viewer real e fallback | `PanoramaViewer`, `LANDING_DEMO` |
| 4.3 | `LandingPortfolio` | Split + links reais para `/u/fivi360` |
| 4.4 | `LandingProblem` (se capturas incluírem) | Opcional |

**Estimativa:** 1 dia

---

### Etapa 5 — SEO, polish e testes

**Objetivo:** Pronto para Go Live (Epic 10).

| # | Tarefa | Detalhe |
|---|--------|---------|
| 5.1 | Meta tags | title, description, og:image, lang pt-BR |
| 5.2 | Remover scripts Emergent | `public/index.html` |
| 5.3 | Favicon + manifest | `public/` |
| 5.4 | `data-testid` em CTAs e FAQ | Conforme §8.4 |
| 5.5 | Teste responsivo | Mobile, tablet, desktop |
| 5.6 | Teste E2E fluxo visitante | `/` → register → dashboard |
| 5.7 | Lighthouse | Performance, SEO, a11y ≥ 90 |

**Estimativa:** 1 dia

---

### Etapa 6 — Páginas legais (paralelo / Epic 10)

| # | Tarefa | Rota |
|---|--------|------|
| 6.1 | Termos de uso | `/termos` |
| 6.2 | Política de privacidade (LGPD) | `/privacidade` |
| 6.3 | Ajuda | `/ajuda` (substituir placeholder autenticado ou versão pública) |
| 6.4 | Linkar no footer da landing | — |

---

### Cronograma resumido

```
Etapa 0 ──► Etapa 1 ──► Etapa 2 ──► Etapa 3 ──► Etapa 4 ──► Etapa 5
(prep)      (rotas)     (shell)     (core)      (extra)     (SEO/QA)
  │                                              │
  └──────────────── Etapa 6 (legal) ─────────────┘
```

**Total estimado:** 5–7 dias de desenvolvimento (1 dev), dependendo de assets e revisão de copy.

---

## 12. Critérios de aceite

### Funcional

- [ ] Visitante não autenticado acessa Landing em `/`
- [ ] Usuário autenticado em `/` redireciona para `/dashboard`
- [ ] CTAs primários levam a `/register`
- [ ] Link "Entrar" leva a `/login`
- [ ] Âncoras `#recursos`, `#demo`, `#como-funciona`, `#precos`, `#faq` scrollam corretamente
- [ ] Demo carrega projeto via `LANDING_DEMO.projectId` (sem login)
- [ ] Demo exibe viewer interativo quando projeto está `shared` ou `public`
- [ ] Demo exibe fallback "Demonstração temporariamente indisponível." se projeto private/inexistente/erro
- [ ] Landing não quebra se demo falhar
- [ ] CTAs demo apontam para `/share/project/:projectId` e `/u/fivi360`
- [ ] Planos exibem dados de `planLimits.js` (sem hardcode divergente)

### Visual

- [ ] Paleta e tipografia conforme `design-system.md`
- [ ] Layout responsivo mobile / tablet / desktop
- [ ] Consistência com capturas da landing original (validação manual)
- [ ] Sem sidebar admin na landing

### Técnico

- [ ] Componentes landing isolados em `src/components/landing/`
- [ ] Copy centralizado em `landingContent.js`; demo em `landingDemo.js`
- [ ] `data-testid` nos CTAs principais
- [ ] Nenhum mock de dados de negócio na landing
- [ ] Build de produção sem scripts Emergent

### SEO / Go Live

- [ ] `<title>` e meta description corretos
- [ ] `lang="pt-BR"` no HTML
- [ ] Favicon configurado
- [ ] Footer linka `/termos` e `/privacidade`

---

## 13. Referências internas

| Documento | Relevância |
|-----------|------------|
| `docs/product.md` | Definição de features e MVP |
| `docs/design-system.md` | Cores, tipografia, botões |
| `docs/design_guidelines.json` | Tokens detalhados + URLs de mídia placeholder |
| `docs/rebuild-plan-v2.md` | Epic 10 — Landing, SEO, redirect `/` |
| `docs/roadmap.md` | Sprint 9 — escopo original da landing |
| `docs/foundation-step-01.md` | Padrões de PageHeader, cards, heroes |
| `docs/audit-report.md` §9 | Notas de reaproveitamento |
| `src/config/planLimits.js` | Dados dos planos |
| `src/pages/Plan.js` | Template de pricing cards |
| `src/config/landingDemo.js` | Config do projeto demo oficial |
| `src/components/viewer/PanoramaViewer.jsx` | Viewer 360° reutilizado na demo |
| `src/hooks/usePublicViewerImage.js` | Referência de fetch público |
| `src/utils/visibility.js` | Regras `shared` / `public` |

---

## 14. Demonstração interativa (projeto público)

### 14.1 Configuração

Arquivo: `src/config/landingDemo.js`

```js
export const LANDING_DEMO = {
  portfolioSlug: "fivi360",
  projectId: "COLOCAR_ID_DO_PROJETO_AQUI",
  portfolioPath: "/u/fivi360",
  projectPath: "/share/project/COLOCAR_ID_DO_PROJETO_AQUI",
};
```

**Onde trocar o ID da demo:** substituir `COLOCAR_ID_DO_PROJETO_AQUI` em **`projectId`** e **`projectPath`** no mesmo arquivo. Manter ambos sincronizados.

### 14.2 Rotas envolvidas

| Rota | Uso |
|------|-----|
| `/u/fivi360` | Portfólio público oficial (`LANDING_DEMO.portfolioPath`) |
| `/share/project/:projectId` | Página completa do projeto demo (`LANDING_DEMO.projectPath`) |
| `/share/image/:imageId` | Viewer público (hotspots scene navegam para cá) |
| `#demo` | Âncora na landing para a seção Showcase |

### 14.3 Fluxo de dados

```
LandingShowcase
    │
    ├─► useLandingDemo(LANDING_DEMO.projectId)
    │       ├─► getProjectById(projectId)
    │       ├─► isPubliclyAccessible(visibility)? ──no──► fallback UI
    │       └─► getImagesByProjectIdPublic(projectId)
    │
    └─► PanoramaViewer(primeiraImagem.url, hotspots)
            └─► lazy-load Pannellum no viewport
```

### 14.4 Regras de visibilidade

| Visibilidade do projeto demo | Comportamento na landing |
|------------------------------|--------------------------|
| `shared` ou `public` | Viewer interativo carrega normalmente |
| `private` | Fallback: "Demonstração temporariamente indisponível." |
| ID inexistente / erro de rede | Mesmo fallback — landing permanece funcional |

Atualizar conteúdo da demo (imagens, hotspots, capa) **pelo app**, no projeto cujo ID está em `landingDemo.js`. Não é necessário redeploy para trocar panoramas — apenas para trocar **qual** projeto é a demo oficial.

### 14.5 Fora do escopo (não implementar na v1)

- Analytics e tracking de clique nos CTAs
- Formulário de contato
- Pagamento / checkout na landing
- Seleção dinâmica de demo (ex.: primeiro projeto público do portfólio)

---

*Documento gerado para orientar a reconstrução da Landing Page do FIVI360. Não contém implementação — apenas arquitetura, conteúdo e plano de execução.*
