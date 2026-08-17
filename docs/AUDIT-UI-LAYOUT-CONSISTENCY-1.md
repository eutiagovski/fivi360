# AUDIT-UI-LAYOUT-CONSISTENCY-1 — Consistência visual, layouts e shells

**Data:** 17 de agosto de 2026  
**Escopo:** somente leitura (rotas, shells, headers, footers, tokens, branding)  
**Fontes principais:** `src/App.js`, `src/components/Layout.js`, `src/components/landing/*`, `src/components/legal/*`, `src/help/*`, `src/landing-pages/*`, `src/components/auth/*`, `src/components/public/*`, `src/components/viewer/*`, `src/index.css`, `tailwind.config.js`, `components.json`  
**Restrição:** nenhum código, CSS, componente, asset, rota, build ou deploy foi alterado nesta auditoria.

> Esta auditoria descreve a arquitetura visual atual e propõe uma direção. **Não implementa** `PublicHeader`, `PublicFooter` nem qualquer refatoração. Consistência de marca **não** significa uniformizar todas as superfícies.

**Premissa:** o produto já compartilha fundo `#050505`, wordmark via `BrandLogo`, tipografia Outfit/Manrope e CTA branco pill. O que falta é uma **camada de chrome institucional** compartilhada. As diferenças de shell (app, viewer, embed, LP) são, na maior parte, funcionais e devem permanecer.

---

## 1. Resumo executivo

O FIVI360 **não** tem quatro produtos visuais irreconhecíveis. Fundo, logo, fontes e paleta zinc/branco já atravessam Home, App, Legal, Ajuda, LP e Auth. O problema real é **chrome institucional fragmentado**: cada superfície pública reimplementa header, container e footer com classes próprias.

A inconsistência mais visível — e a que motivou esta auditoria — é a **Central de Ajuda**: `HelpHeader` (h-14, blur fixo, “Central de Ajuda”, “Voltar ao FIVI360”, “Entrar” sempre visível) não é o `LandingHeader` da Home/Legal (h-16, blur no scroll, âncoras de seções, CTAs autenticados).

A inconsistência mais **estrutural** está em Legal: `/termos` e `/privacidade` reutilizam `LandingHeader` com navegação da Home (`#recursos`, `#demo`, `#precos`…). Em páginas legais esses âncoras não existem. Legal **não tem footer**.

| Pergunta | Resposta curta |
|----------|----------------|
| Quantos shells de página distintos? | **12** (8 famílias + 4 ad-hoc/transientes) |
| Quantos headers distintos? | **11** implementações (7 chrome + 4 identidade/overlay) |
| Quantos footers distintos? | **5** (3 institucionais + 2 “powered by”) |
| Home, Legal e Ajuda compartilham header? | **Não.** Home e Legal compartilham `LandingHeader`. Ajuda tem `HelpHeader` próprio. |
| Legal criou terceira linguagem? | **Parcialmente.** Header = Home (inadequado). Corpo = leitura + TOC (justificado). Footer = ausente. |
| LP deve virar Home? | **Não.** Deve continuar campanha. Já reutiliza `BrandLogo` e a paleta. |
| Embed deve ganhar header institucional? | **Não.** |
| Existe `BrandLogo` compartilhado? | **Sim** — único wordmark PNG. Alturas ainda divergem (`h-4` … `h-8`). |
| Tokens shadcn governam o produto? | **Não.** `:root` é light; o produto hardcoda `#050505` / zinc. `.dark` nunca é aplicado. |

**Conclusão:** unificar **marca** (logo, tokens de chrome, CTA pill, container público, footer institucional). Preservar **shells por contexto** (App, Help conteúdo, Legal leitura, LP conversão, Viewer, Embed).

---

## 2. Arquitetura visual atual

Não existe um `PublicShell` nem um `AppShell` nomeados como família. O que existe é um grafo de layouts montado em `src/App.js`:

```
App.js (BrowserRouter)
├── GuestRoute          → AuthLayout
├── PublicAlwaysRoute   → Landing | HelpCenterApp | AccessEarly* | (Home)
├── (sem wrapper)       → LegalPageLayout | PublicPageShell | Embed | Viewer
├── ProtectedRoute      → Layout (sidebar + AppHeader) | Viewer
└── *                   → NotFound (shell próprio)
```

**Camadas visuais de fato:**

1. **Brand hardcoded** — `body` em `src/index.css`: `bg-[#050505]`, `text-white`, Manrope; headings Outfit.
2. **Chrome por superfície** — um header/footer diferente por bounded context.
3. **Conteúdo** — seções da Home, TOC legal, busca da Ajuda, cards do app, viewer 360°.
4. **Kit shadcn** — `components/ui/*` (New York + CSS variables). Usado pontualmente (Sheet, Dialog, Dropdown, Button como âncora). A maior parte do chrome **ignora** `bg-background` / `text-primary` e pinta zinc na mão.

O módulo `src/help/` está isolado de Auth/Firebase (teste `helpIsolation.test.js`), mas **já importa** `BrandLogo` de `@/components/common`. Isolamento não impede primitivas de marca compartilhadas; impede acoplar Ajuda ao dashboard.

---

## 3. Mapa de shells

### 3.1 Superfícies e rotas

| Superfície | Rotas | Guard | Shell | Header | Footer |
|------------|-------|-------|-------|--------|--------|
| Home | `/` | `PublicAlwaysRoute` | `LandingLayout` | `LandingHeader` | `LandingFooter` |
| App autenticado | `/dashboard`, `/projects`, `/projects/:id`, `/images`, `/plan`, `/settings` | `ProtectedRoute` + `LegalConsentGate` | `Layout` | `AppHeader` + sidebar | nenhum |
| App — novo projeto | `/projects/new` | Protected | redirect → `/projects` | — | — |
| App — viewer | `/viewer/:imageId` | Protected, **sem** `Layout` | shell inline em `Viewer.js` | `ViewerPageHeader` | nenhum |
| Legal | `/termos`, `/privacidade` | nenhum (público direto) | `LegalPageLayout` | `LandingHeader` (`fixed`) | **nenhum** |
| Ajuda | `/ajuda`, `/ajuda/:categoria`, `/ajuda/:categoria/:slug` | `PublicAlwaysRoute` | `HelpLayout` | `HelpHeader` | `HelpFooter` |
| Ajuda alias | `/help`, `/help/*` | — | `Navigate` → `/ajuda` | — | — |
| LP campanha | `/lp/acesso-antecipado` | `PublicAlwaysRoute` | div ad-hoc na página | `AccessEarlyHeader` | `AccessEarlyFooter` |
| LP sucesso | `/lp/acesso-antecipado/sucesso` | `PublicAlwaysRoute` | div ad-hoc | header **inline** | `AccessEarlyFooter` |
| Auth | `/login`, `/register`, `/forgot-password`, `/verify-email`, `/verify-email-sent`, `/verify-email/action`, `/reset-password/action` | `GuestRoute` / `VerifyEmailRoute` / livre | `AuthLayout` | `AuthHeader` | **nenhum** |
| Share projeto | `/share/project/:projectId` | público | `PublicPageShell` | `PublicPlatformHeader` | `PublicPoweredByFooter` |
| Share imagem | `/share/project/:id/image/:imageId`, `/share/standalone/:imageId` | público | `PublicImageViewer` | `ViewerPageHeader` | nenhum |
| Share legado | `/share/image/:imageId` | — | redirect | — | — |
| Portfólio | `/u/:slug` | público | `PublicPageShell` (`office` ou `minimal`) | `PublicPortfolioHeader` / minimal | `PublicPoweredByFooter` |
| Portfólio projeto | `/u/:slug/project/:projectId` | público | `PublicPageShell` (`minimal`) | borda só | `PublicPoweredByFooter` |
| Portfólio imagem | `/u/:slug/project/:id/image/:imageId` | público | `PublicImageViewer` | `ViewerPageHeader` | nenhum |
| Embed | `/embed/:projectId`, `/embed/:projectId/image/:imageId` | público | `EmbedProjectPage` | **nenhum** | badge `EmbedPoweredByBrand` |
| 404 | `*` | — | shell inline | logo centrado | nenhum |
| Loading/erro auth | (gate) | — | `AuthLoadingScreen` / `AuthErrorScreen` | nenhum | nenhum |

### 3.2 Nested / não-rota

| Shell | Arquivo | Papel |
|-------|---------|-------|
| `SettingsLayout` | `src/components/settings/SettingsLayout.jsx` | Duas colunas dentro do `Layout` autenticado |
| `LegalConsentGate` + `LegalConsentModal` | `src/components/legal/` | Overlay obrigatório no app; não é page shell |

### 3.3 Mapa ROTA → SHELL → HEADER → FOOTER → CONTAINER

```
/                          LandingLayout      LandingHeader         LandingFooter         max-w-7xl px-6/12/16
/dashboard … /settings     Layout             AppHeader+sidebar     —                     fluido p-8/12/16
/viewer/:id                Viewer.js          ViewerPageHeader      —                     viewport
/termos /privacidade       LegalPageLayout    LandingHeader fixed   —                     max-w-7xl + artigo scroll
/ajuda/*                   HelpLayout         HelpHeader            HelpFooter            max-w-7xl px-4/6/10/16
/lp/acesso-antecipado      ad-hoc             AccessEarlyHeader     AccessEarlyFooter     max-w-6xl px-6/10
/lp/.../sucesso            ad-hoc             header inline         AccessEarlyFooter     max-w-3xl header / max-w-md body
/login … reset             AuthLayout         AuthHeader            —                     max-w-md
/share/project/:id         PublicPageShell    PublicPlatformHeader  PoweredBy             max-w-7xl p-8/12/16
/share/.../image/:id       PublicImageViewer  ViewerPageHeader      —                     viewport
/u/:slug                   PublicPageShell    office/minimal        PoweredBy             max-w-7xl
/embed/:id                 EmbedProjectPage   —                     PoweredBy badge       100vw × 100vh
*                          NotFound           logo centrado         —                     max-w-lg
```

---

## 4. Home

**Referência de marca institucional.** Não deve ser copiada cegamente para App, Embed ou LP.

| Elemento | Implementação atual |
|----------|---------------------|
| Shell | `LandingLayout` — `min-h-screen bg-[#050505] flex flex-col fade-in` |
| Logo | `BrandLogo` `h-4` no header; `h-7` no sheet mobile e no footer |
| Header | `LandingHeader` sticky, h-16, `max-w-7xl mx-auto px-6 md:px-12 lg:px-16` |
| Scroll | `scrolled` (>10px) → `backdrop-blur-xl bg-[#050505]/80 border-zinc-800`; senão `/40` e `border-transparent` |
| Nav desktop | Recursos, Demo, Como funciona, Preços, FAQ (`#` âncoras) — visível `lg+` |
| CTA visitante | “Entrar” outline pill + “Começar grátis” branco pill (`Button` + classes locais) |
| CTA autenticado | “Ir para o Dashboard” (Home é `PUBLIC_ALWAYS`) |
| Mobile | `Sheet` direita, logo `h-7`, nav empilhada, mesmos CTAs; hamburger `lg:hidden` |
| Tipografia | h1 `text-3xl sm:text-4xl lg:text-5xl font-light tracking-tighter` |
| Background | `#050505`; cards `border-zinc-800 bg-zinc-900/50` `rounded-2xl` |
| Container | `max-w-7xl` + `px-6 md:px-12 lg:px-16` em **todas** as seções (repetido, não extraído) |
| Section padding | `py-16 md:py-24` (hero `lg:py-32`) |
| Footer | `LandingFooter` 4 colunas: marca + nav + legais (Termos, Privacidade, Ajuda) + sociais (URLs da LP) |
| Copyright | `© {year} FIVI360. Todos os direitos reservados.` |

**O que é brand (compartilhável):** logo, fundo, blur do header, borda zinc-800, CTA pill, container 7xl, tipografia light, footer institucional.

**O que é Home-specific:** âncoras de seções, hero/demo/pricing, analytics `click_cta_start`, `fixed` vs sticky só faz sentido nesta página (Legal reutiliza `fixed` por outro motivo).

---

## 5. App

**Shell:** `src/components/Layout.js` — `h-dvh`, sidebar 256px, coluna header + main com scroll.

| Elemento | Detalhe | Família |
|----------|---------|---------|
| Sidebar | Fixa `lg+`; drawer mobile; fundo `#050505`; borda `zinc-800`; item ativo **invertido** (bg branco) | **APP-SPECIFIC** |
| Logo sidebar | `BrandLogo` `h-7`, link implícito (não é `<Link>`) | **BRAND SHARED** (asset) / posição app-specific |
| AppHeader | `h-14 lg:h-16`, `bg-[#050505]`, `border-b zinc-800`, `px-4 lg:px-6`, **sem** max-w | **APP-SPECIFIC** |
| Logo no header | Só `lg:hidden`, `h-4 md:h-5`, link `/dashboard` | **BRAND SHARED** |
| User menu | Avatar (logo do escritório ou inicial), nome, empresa, Configurações, Ajuda (`/ajuda`), Sair | **APP-SPECIFIC** |
| Menu mobile | Botão hamburger no header (não Sheet da Home) | **APP-SPECIFIC** |
| Page title | `PageHeader` / `PageActionHeader` — mesma escala da Home (`3xl/4xl/5xl font-light tracking-tighter`) | **BRAND SHARED** (hierarquia) |
| Content width | Fluido; padding `p-8 md:p-12 lg:p-16` (Settings um pouco mais denso) | **APP-SPECIFIC** |
| Background | `#050505` | **BRAND SHARED** |
| Footer | Nenhum | correto |

`/viewer/:imageId` **sai** do `Layout` (sem sidebar). Correto: o viewer precisa de viewport cheio.

`SettingsLayout` é nested: nav 240px + painel. Não compete com o shell público.

**Julgamento:** o app já parece o mesmo produto (fundo, logo, headings). Não deve adotar o header da Home. O que pode convergir no futuro são tokens (`#050505`, `zinc-800`) e o CTA pill já usado em `PageActionHeader` / `PlanLimitButton`.

---

## 6. Legal

**Stack:** `TermsOfUse` / `PrivacyPolicy` → `LegalDocumentRenderer` → `LegalPageLayout` + `LegalSection`.

| Comparado a | Header | Footer | Container | Background | Mobile |
|-------------|--------|--------|-----------|------------|--------|
| Home | **Mesmo** `LandingHeader` | Home tem; Legal **não** | Mesmo `max-w-7xl px-6/12/16` | Igual | Header Sheet da Home |
| Ajuda | **Diferente** (`HelpHeader`) | Ajuda tem; Legal **não** | Ajuda usa gutters menores (`px-4`) | Igual | Ajuda sem Sheet |

**O que é justificado (leitura):**

- Viewport travado (`h-dvh`, `body overflow: hidden`) para header + título fixos e só o artigo rolar.
- TOC desktop (`w-64 xl:w-72`) e Collapsible no mobile.
- Tipografia de leitura `text-zinc-300 leading-relaxed`; h2 `text-lg sm:text-xl font-light`.
- Link “Voltar” / “Voltar ao app” conforme `useAuth`.

**O que é inconsistência de branding:**

1. **Nav da Home no documento legal.** `LandingHeader` sempre renderiza `#recursos` … `#faq`. Em `/termos` esses hrefs não apontam para seções da página.
2. **Sem footer institucional** (Termos, Privacidade, Ajuda, copyright). O usuário legal não encontra o caminho inverso para Ajuda/Home no rodapé.
3. **CTAs de conversão** (“Começar grátis”) no header de um documento jurídico — questionável, embora mantenham a marca.

Legal **não** inventou uma terceira paleta. Inventou um **modo de leitura** (bom) sobre um **header de marketing** (ruim neste contexto).

---

## 7. Help

Módulo `src/help/` — bounded context, comentário explícito de migração futura para `apps/help/` / `ajuda.fivi360.com.br`.

### 7.1 Peças

| Peça | Arquivo | Função |
|------|---------|--------|
| App de rotas | `HelpCenterApp.jsx` | `/`, `/:cat`, `/:cat/:slug`, 404 interno |
| Shell | `HelpLayout.jsx` | header + main `max-w-7xl` + footer; sidebar opcional |
| Header | `HelpHeader.jsx` | marca + label + atalhos |
| Footer | `HelpFooter.jsx` | copyright + legais + e-mail |
| Home | `HelpHomePage.jsx` | kicker, h1, busca hero, grid de categorias |
| Artigo | `HelpArticlePage.jsx` | breadcrumb, corpo, relacionados, CTA suporte |
| Categoria | `HelpCategoryPage.jsx` | breadcrumb + lista |
| Busca | `HelpSearch` / `HelpSearchPanel` | hero vs compact |
| Nav | `HelpCategoryNav` / `HelpSidebar` | desktop aside; mobile Collapsible |
| Breadcrumb | `HelpBreadcrumb.jsx` | **não** usa `components/ui/breadcrumb` (órfão shadcn) |

### 7.2 Header da Ajuda vs Home / Legal / App

| | Home (`LandingHeader`) | Legal | Ajuda (`HelpHeader`) | App (`AppHeader`) |
|--|------------------------|-------|----------------------|-------------------|
| Altura | h-16 | h-16 (mesmo) | **h-14** | h-14 / h-16 lg |
| Container | 7xl px-6/12/16 | igual Home | 7xl **px-4 sm:px-6 md:px-10 lg:px-16** | fluido px-4/6 |
| Fundo | translúcido + blur no scroll | igual Home | **sempre** `/90` + blur + `border-zinc-800` | sólido `#050505` |
| Nav | âncoras Home | âncoras Home (errado) | “Voltar ao FIVI360” + “Entrar” | user menu |
| Auth | `useAuth` → Dashboard se logado | idem | **sem Auth** — “Entrar” sempre | autenticado |
| Contexto | nenhum label | nenhum | “Central de Ajuda” | nenhum |
| Mobile | Sheet | Sheet | **só encolhe** os dois links; sem menu | hamburger da sidebar |

### 7.3 O que é função da Central (manter)

- Busca, breadcrumbs, sidebar de categorias, cards de artigos, CTA `contato@fivi360.com.br`.
- Isolamento de Auth/Firebase (teste de isolação). “Entrar” estático é **decisão de isolamento**, não acaso — mas o visitante autenticado vê “Entrar” em vez de “Dashboard”, diferente da Home.
- “Voltar ao FIVI360” aponta para `/` (`HELP_APP_HOME_PATH`), não para `/dashboard`. Coerente com isolamento; diferente do user menu do app (que manda para `/ajuda`).

### 7.4 O que é inconsistência de branding (corrigir depois)

- Altura, gutters e tratamento de blur diferentes da Home sem motivo de produto.
- Footer compacto de uma linha vs footer 4 colunas da Home (estrutura; links legais existem nos dois).
- CTA “Entrar” é `Link` com borda, não o `Button` pill da Home.
- `bg-[#0c0c0c]` nos cards de categoria / CTA suporte — tom extra, próximo mas não tokenizado.

---

## 8. Landing Pages

Única campanha: `src/landing-pages/access-early/` (`/lp/acesso-antecipado` + `/sucesso`).

**Já compartilhado:** `BrandLogo`, fundo `#050505`, Outfit/Manrope, CTA branco pill, `Button` shadcn como âncora, links `/termos` `/privacidade`, URLs sociais (Home footer importa `ACCESS_EARLY_CONFIG`).

**Próprio (manter):** composição de conversão, âncoras da campanha, formulário, hero com radial-gradient, **sem** Auth, **sem** `LegalConsentGate`, demo viewer via `FIVI360_DEMO_PROJECT` (não `/embed`).

**Divergências de chrome (opcional alinhar, sem virar Home):**

| | Home | LP |
|--|------|-----|
| Container | `max-w-7xl` `px-6 md:px-12 lg:px-16` | **`max-w-6xl` `px-6 md:px-10`** |
| Header height | h-16 | **h-14** (+ `py-4` no inner) |
| Mobile breakpoint | `lg` (Sheet) | **`md`** |
| Header | `LandingHeader` | clone `AccessEarlyHeader` (scroll/blur copiados) |
| Sucesso | — | terceiro header: `max-w-3xl`, sem blur, “Voltar para o FIVI360” |
| Footer | 4 colunas + Ajuda + sociais | 2 blocos; **sem Ajuda**; copyright `text-xs text-zinc-600` |

Não transformar LP em Home. Extrair primitivas (logo size, CTA class, blur header) reduz clone.

---

## 9. Auth

`AuthLayout` + `AuthHeader` + `AuthCard` cobrem login, cadastro, forgot, verify (várias) e reset.

| Elemento | Estado | Pertence ao produto? |
|----------|--------|----------------------|
| Fundo | `#050505` | sim |
| Logo | `BrandLogo` `h-7` centrado | sim (maior que Home header) |
| Header | só logo, `border-b zinc-800`, `p-6`, container `max-w-md` | sim, modo focado |
| Card | `bg-zinc-900/50 border-zinc-800 rounded-2xl p-8 md:p-10` | sim |
| Título | `text-2xl sm:text-3xl font-light tracking-tight` | sim |
| CTA | `<button>` nativo pill branco — **não** `Button` shadcn | visual ok; duplicação de classe |
| Footer / legais | **ausentes** no layout | lacuna: só o checkbox do SignUp aponta Termos/Privacidade |
| Ajuda | sem link | lacuna menor |
| Google | `GoogleSignInButton` pill outline | ok |

Parecem o mesmo produto. Falta chrome institucional mínimo (links legais / Ajuda) no rodapé do card ou do layout — sem copiar o footer da Home.

Telas transientes (`AuthLoadingScreen`, `AuthErrorScreen`) repetem o fundo e o CTA pill. `AuthErrorScreen` não usa `AuthLayout` (sem logo). Aceitável para erro de gate.

---

## 10. Share / Embed / Portfolio

Exceções conscientes. **Não** receber `PublicHeader` institucional.

| Superfície | Chrome | Motivo | Exceção |
|------------|--------|--------|---------|
| Share projeto | `PublicPageShell` + logo FIVI360 (`platform`) + Powered by | visitante precisa saber a plataforma | ok |
| Portfólio `/u/:slug` | header **do escritório** (logo/nome/bio/sociais), não FIVI360 | identidade do cliente | **KEEP** |
| Portfólio projeto | `headerMode="minimal"` (só borda) | o projeto é o conteúdo | **KEEP** |
| Viewer público / autenticado | `ViewerPageHeader` overlay (voltar + título + nav cenas) | ferramenta 360° | **KEEP** |
| Embed | sem header; badge `EmbedPoweredByBrand` | iframe de terceiros | **KEEP — sem header institucional** |
| Mensagens de erro públicas | `PublicPageMessage` no mesmo shell | consistência da experiência pública | ok |

`PublicPortfolioHeader` **não é um header de app**: é um bloco de identidade com `mt-24` / `mt-12`. Nome enganoso; não consolidar com `LandingHeader`.

`PublicSharedProject` usa o header de plataforma (logo FIVI360), não o do escritório — assimetria vs portfólio. Pode ser produto (share = FIVI360; portfolio = escritório), não necessariamente bug visual.

---

## 11. Inventário de headers

| Componente | Arquivo | Rotas | Logo | Altura | Container | Background | Border | Navigation | Mobile | Classificação | Observações |
|------------|---------|-------|------|--------|-----------|------------|--------|------------|--------|---------------|-------------|
| `LandingHeader` | `components/landing/LandingHeader.jsx` | `/`, `/termos`, `/privacidade` | `h-4` (sheet `h-7`) | h-16 | 7xl px-6/12/16 | `/40` → `/80` blur | transparent → zinc-800 | âncoras Home + CTAs auth | Sheet `lg` | **SHARED_CANDIDATE** | Base natural de um PublicHeader; Legal não deveria herdar as âncoras |
| `HelpHeader` | `help/components/HelpHeader.jsx` | `/ajuda/*` | `h-4 md:h-5` | **h-14** | 7xl px-4/6/10/16 | `/90` blur sempre | zinc-800 | Voltar + Entrar | links compactos | **SHARED_CANDIDATE** + contexto | Isolado de Auth; visualmente o outlier público |
| `AccessEarlyHeader` | `landing-pages/access-early/sections/AccessEarlyHeader.jsx` | `/lp/acesso-antecipado` | `h-4 md:h-5` (sheet `h-4`) | h-14 | **6xl** px-6/10 | clone do Landing | clone | âncoras campanha + CTA form | Sheet `md` | **CONTEXT_SPECIFIC** / clone | Não fundir com Home; extrair primitivas |
| Header inline sucesso | `AccessEarlySuccessPage.jsx` | `/lp/.../sucesso` | `h-4 md:h-5` | ~py-5 | **3xl** px-6 | sólido, `/60` na borda | zinc-800/60 | “Voltar para o FIVI360” | inline | **DUPLICATE** | Terceiro header na mesma campanha |
| `AuthHeader` | `components/auth/AuthHeader.jsx` | auth | `h-7` centrado | p-6 | max-w-md | herdado | zinc-800 | nenhuma | n/a | **CONTEXT_SPECIFIC** | Correto para foco de formulário |
| `AppHeader` | `components/layout/AppHeader.jsx` | app autenticado | mobile only `h-4 md:h-5` | h-14 / h-16 | fluido px-4/6 | sólido `#050505` | zinc-800 | user menu | hamburger sidebar | **CONTEXT_SPECIFIC** | Não unificar com público |
| `PublicPlatformHeader` | `PublicPageShell.jsx` (interno) | share default | `h-7` | p-6 | 7xl | herdado | zinc-800 | só logo | n/a | **CONTEXT_SPECIFIC** | Experiência pública |
| `PublicMinimalHeader` | idem | portfolio projeto / erros | nenhum | só borda | — | — | zinc-800 | nenhuma | n/a | **CONTEXT_SPECIFIC** | |
| `PublicPortfolioHeader` | `components/public/PublicPortfolioHeader.jsx` | `/u/:slug` | logo do **escritório** | bloco página | 7xl px-6/12/16 | — | — | identidade + sociais | stack | **CONTEXT_SPECIFIC** | Não é chrome FIVI360 |
| `ViewerPageHeader` | `components/viewer/ViewerPageHeader.jsx` | `/viewer/*`, share/portfolio image | `h-5 md:h-7` se sem back | compacto overlay | px-3 py-2 / p-6 | transparente | — | back + título + slots | 1 linha | **CONTEXT_SPECIFIC** | |
| Sidebar brand | `Layout.js` | app desktop | `h-7` | — | — | — | — | — | hidden em overlay | **CONTEXT_SPECIFIC** | Segundo logo no app |
| NotFound | `pages/NotFound.jsx` | `*` | `h-8` | — | max-w-lg | página cheia | — | CTAs | stack | **CONTEXT_SPECIFIC** | Sem barra |

**Contagem:** **11 implementações** de cabeçalho; **7** são chrome de produto; **~4** públicos institucionais candidatos a convergência (Landing, Help, LP, sucesso).

Não há header “UNKNOWN”. `pages/Help.js` é só redirect.

---

## 12. Inventário de footers

| Componente | Arquivo | Rotas | Copyright | Legais | Contato | Branding | Container | Spacing | Classificação |
|------------|---------|-------|-----------|--------|---------|----------|-----------|---------|---------------|
| `LandingFooter` | `landing/LandingFooter.jsx` | `/` | © year FIVI360. Todos os direitos… | Termos, Privacidade, **Ajuda** | não (sociais) | `BrandLogo` h-7 + tagline | 7xl px-6/12/16 py-12 | grid 4 col | **SHARED_CANDIDATE** (base PublicFooter) |
| `HelpFooter` | `help/components/HelpFooter.jsx` | `/ajuda/*` | © year FIVI360. **Central de Ajuda.** | Termos, Privacidade, Ajuda | `mailto:contato@…` | sem logo | 7xl, gutters da Ajuda, py-8 | 1 linha | **SHARED_CANDIDATE** (variante compacta) |
| `AccessEarlyFooter` | `access-early/sections/AccessEarlyFooter.jsx` | LP + sucesso | © year… `text-xs zinc-600` | Termos, Privacidade, Home (URL absoluta) | não | `BrandLogo` h-7 + tagline | **6xl** px-6/10 py-10 | 2 colunas | **CONTEXT_SPECIFIC** (pode reusar links legais) |
| `PublicPoweredByFooter` | `public/PublicPoweredByFooter.jsx` | share / portfolio | “Powered by FIVI360” | não | não | wordmark texto | 7xl px-6/12/16 py-6 mt-16 | centro 11px | **CONTEXT_SPECIFIC** |
| `EmbedPoweredByBrand` | `embed/EmbedPoweredByBrand.jsx` | embed | badge overlay | não | não | texto | absolute bottom | pill blur | **CONTEXT_SPECIFIC** |

**Sem footer:** Legal, Auth, App, Viewer, NotFound, share-image (viewer).

**PublicFooter compartilhado Home + Legal + Ajuda:** **sim, faz sentido**, com variantes:

- `context="home"` — grid 4 colunas + âncoras da Home + sociais.
- `context="legal"` — marca + Termos/Privacidade/Ajuda + copyright (sem âncoras `#recursos`).
- `context="help"` — compacto + e-mail, ou o grid institucional sem âncoras da Home.

LP: **não** forçar o grid da Home; pode continuar mínimo **desde que** os links legais e o wordmark venham da mesma primitiva.

---

## 13. Branding / logo

### 13.1 Wordmark FIVI360

| Item | Estado |
|------|--------|
| Componente | `src/components/common/BrandLogo.jsx` |
| Asset | `src/assets/img/fivi360_logo.png` (único; KEEP em AUDIT-DEAD-FILES-1) |
| Alt default | `"FIVI360"` |
| Classe default | `h-4 md:h-5 w-auto object-contain` — quase sempre **sobrescrita** |

Não há SVG de wordmark no código da UI. Não há segundo PNG de logo de produto.

**Alturas observadas:** `h-4` (Home header), `h-4 md:h-5` (Ajuda, LP, App mobile), `h-7` (Auth, App sidebar, footers, PublicPlatform, sheet Home), `h-5 md:h-7` (Viewer), `h-8` (404). Default do componente raramente vence.

### 13.2 Outras marcas

| Uso | Onde | Notas |
|-----|------|-------|
| Logo do escritório | `AppHeader` avatar, `PublicPortfolioHeader` | identidade do cliente — **não** unificar |
| Google G | `GoogleSignInButton` SVG inline | terceiros |
| Favicon | `public/favicon.ico` (index.html) | separado do wordmark PNG |
| “FIVI360” texto | copyrights, Powered by, kickers (`FIVI360 · Central de Ajuda`, `FIVI360 · Acesso antecipado`) | copy, não asset |
| E-mail institucional | `contato@fivi360.com.br` (Help, Legal, billing) | duplicado em configs |

Não alterar assets nesta auditoria. Recomendação futura: 2 tamanhos tokenizados (`sm` header, `md` footer/sidebar), não 6.

---

## 14. Design tokens

### 14.1 O que o sistema declara

**`tailwind.config.js`**

- `darkMode: ["class"]`
- Escala de tipo SaaS (base 15px … 6xl 48px)
- `borderRadius` via `--radius`
- Cores shadcn: `background`, `foreground`, `primary`, `muted`, `border`, `ring`, `chart-*`

**`src/index.css`**

- `:root` = **tema claro** (background 100%, foreground 3.9%)
- `.dark` = tema escuro próximo do produto (`background: 0 0% 2%`)
- `body`: **ignora** as variáveis → `bg-[#050505] text-white text-sm`; font Manrope
- Headings: Outfit
- Google Fonts import no CSS (também preconnect no `index.html`)

**`components.json`:** shadcn New York, `baseColor: neutral`, `cssVariables: true`.

**`src/App.css`:** `.App { background: #050505 }`, `.btn-scale`, `.fade-in`, `.card-hover`.

### 14.2 O que o produto realmente usa

| Token declarado | Uso real no chrome |
|-----------------|-------------------|
| `--background` / `bg-background` | Quase nunca no chrome; body e shells usam `#050505` |
| `--primary` | `Button` default; Landing/LP **sobrescrevem** com `bg-white text-black rounded-full` |
| `--muted` | `text-zinc-400` / `zinc-500` na mão |
| `--border` | `border-zinc-800` na mão |
| `--radius` (0.5rem) | Cards públicos `rounded-2xl`; nav app `rounded-xl`; CTAs `rounded-full` |
| `.dark` | **Nunca aplicado** (`document` / `className="dark"`: 0 ocorrências) |

### 14.3 Onde componentes ignoram tokens

Praticamente **todo** o chrome: `Layout`, `LandingHeader`, `HelpHeader`, `LegalPageLayout`, `AuthLayout`, `PublicPageShell`, LP. Padrão: `bg-[#050505]`, `border-zinc-800`, `text-zinc-400`, `text-white`.

Isso é estável (uma paleta de fato), mas **não é o design system shadcn**. Risco: um `Button` / `Dialog` / `Input` sem override cai no tema **claro** das CSS variables.

`components/ui/input.jsx` e `ui/card.jsx` **não têm consumidores** fora de `ui/` (AUDIT-DEAD-FILES-1: ~29 arquivos shadcn órfãos). Formulários do app usam classes zinc locais.

**Não implementar dark mode.** Documentar: o produto é **dark-only hardcoded**; o bloco `.dark` e `:root` light são vestígio shadcn/Emergent.

---

## 15. Tipografia

Fontes globais (todas as superfícies): **Manrope** body, **Outfit** headings. Uma família de marca — consistência boa.

| Superfície | H1 típico | Tracking | Body |
|------------|-----------|----------|------|
| Home | `3xl/4xl/5xl font-light` | **tighter** | `sm/base zinc-400 leading-relaxed` |
| App (`PageHeader`) | igual Home | **tighter** | `sm zinc-400` |
| Portfólio / share projeto | igual Home | **tighter** | `base zinc-300` |
| Legal | `2xl/3xl font-light` | **tight** | `sm/base zinc-300 leading-relaxed` |
| Ajuda home | `3xl/4xl/5xl font-light` | **tight** | `sm/base zinc-400` |
| Ajuda artigo | `2xl/3xl font-light` | **tight** | `sm/base` |
| LP | `3xl/4xl/5xl font-light` | **tight** | `base/lg zinc-400` |
| Auth | `2xl/3xl font-light` (`h2` no card) | **tight** | `sm zinc-400` |

**Inconsistência real, baixa gravidade:** `tracking-tighter` (Home/App/experiências públicas de conteúdo) vs `tracking-tight` (Legal/Help/LP/Auth). Kickers uppercase `tracking-wider` / `tracking-[0.2em]` na Ajuda e na LP — padrão editorial, não erro.

Não propor redesign tipográfico. Se unificar, escolher **um** tracking de h1 institucional (`tight` ou `tighter`) nas primitivas, sem mudar a escala.

`body` força `text-sm` (15px via config). Landing às vezes sobe para `text-base` em subtítulos. Ajuda artigos idem. Aceitável.

---

## 16. Containers e spacing

### 16.1 Tabela de containers

| Superfície | Container | Padding desktop | Padding mobile | Motivo aparente |
|------------|-----------|-----------------|----------------|-----------------|
| Home (todas as seções) | `max-w-7xl mx-auto` | `px-12` md / `px-16` lg | `px-6` | Marketing wide |
| Legal (page chrome) | `max-w-7xl` (constante `CONTAINER_CLASS`) | igual Home | igual Home | Reuso da Home |
| Legal (artigo) | `max-w-3xl` até `lg`, depois `max-w-none` no flex | — | — | Leitura + TOC |
| Ajuda | `max-w-7xl` | `md:px-10 lg:px-16` | **`px-4` sm:`px-6`** | Docs; gutter mais apertado |
| LP | **`max-w-6xl`** | `md:px-10` | `px-6` | Campanha um pouco mais estreita |
| LP sucesso header | `max-w-3xl` | `px-6 py-5` | `px-6` | Página de confirmação |
| Auth | `max-w-md` | `p-8 md:p-12` no main | `p-8` | Card focado |
| App páginas | **fluido** (sem max-w) | `p-12` / `p-16` | `p-8` (Settings `p-6 sm:p-8`) | SaaS workspace |
| Share/portfolio shell | `max-w-7xl` | `p-12` / `p-16` | `p-8` | Experiência pública |
| Viewer / Embed | 100% viewport | overlay `md:p-6` | `px-3 py-2` | Imersão |
| 404 | `max-w-lg` | `p-12` | `p-8` | Mensagem centrada |

**Conclusão:** três larguras públicas reais (`7xl`, `6xl`, `md`) mais leitura (`3xl`) e app fluido. Um `PublicContainer` (`max-w-7xl` + gutters da Home) cobriria Home, Legal chrome e Ajuda **se** a Ajuda adotar os mesmos `px-6/12/16`. `ReadingContainer` (`max-w-3xl`) já é o artigo legal / FAQ / sucesso. `ContentContainer` fluido fica no app. LP pode manter `6xl` como `LandingContainer` de campanha.

### 16.2 Spacing recorrente vs inconsistente

| Padrão | Valores | Onde |
|--------|---------|------|
| Header → conteúdo | `pt-16` (Legal, offset do header fixed); Ajuda `py-8 sm:py-10`; Home hero `py-16 md:py-24 lg:py-32` | misturado por função |
| Section | `py-16 md:py-24` | Home |
| Cards gap | `gap-6` grids app; Ajuda categorias `gap-3` | densidade docs vs app |
| Footer | Home `py-12` + `mt-10` copyright; Ajuda `py-8`; LP `py-10`; Powered by `mt-16 py-6` | |
| Header sticky offset | Legal assume 64px (`pt-16`); Ajuda/Home sticky no fluxo | Legal `fixed` vs outros `sticky` |

Nada disso é P0. O valor de extrair `PublicContainer` é **parar de copiar a string** `max-w-7xl mx-auto px-6 md:px-12 lg:px-16` (Home header, footer e ~8 seções; Legal; Powered by; portfolio header).

---

## 17. Responsividade

| Padrão | Home | Legal | Ajuda | LP | App |
|--------|------|-------|-------|----|-----|
| Nav colapsa em | `lg` (1024) | `lg` (mesmo header) | **não colapsa** (2 links) | **`md` (768)** | sidebar `lg` |
| Menu mobile | Sheet direita | Sheet (âncoras Home) | — | Sheet | overlay + `Layout` aside |
| TOC / nav lateral | n/a | Collapsible `<lg` | Collapsible `<lg` (`HelpCategoryNav`) | n/a | Settings nav `hidden lg:block` |
| Header height | 64px | 64px | **56px** | **56px** | 56→64 |
| Logo extra no mobile | sheet `h-7` | idem | não | sheet `h-4` | header `h-4/5` + sidebar off-canvas |

**Sem motivo funcional:** Ajuda e Home com alturas/gutters diferentes; LP com breakpoint `md` vs Home `lg` (LP tem menos itens — pode ser intencional).

**Com motivo:** App sidebar; Help search+nav; Legal TOC; Embed sem chrome; Viewer header 1 linha no mobile.

---

## 18. Duplicações

### 18.1 Headers equivalentes (chrome público)

| Grupo | Arquivos | Consumidores | Diferenças | Risco de consolidação | Recomendação |
|-------|----------|--------------|------------|------------------------|--------------|
| A — Header institucional | `LandingHeader`, `HelpHeader`, `AccessEarlyHeader`, header inline sucesso | Home, Legal, Ajuda, LP, sucesso | nav, altura, container, auth, blur | **MEDIUM** (Home analytics + Legal âncoras + Help isolamento) | Extrair `PublicHeader` com `context`; LP e sucesso podem **compor** a mesma barra sem herdar nav da Home |
| B — Header app | `AppHeader` + logo sidebar | `Layout` | workspace | **HIGH** se misturar com público | **KEEP** |
| C — Header viewer | `ViewerPageHeader` | Viewer + PublicImageViewer | overlay | LOW se tocado à toa | **KEEP** |
| D — Header experiência | `PublicPlatformHeader`, `PublicMinimalHeader`, `PublicPortfolioHeader` | share/portfolio | identidade | MEDIUM se forçar logo FIVI360 no portfólio | **KEEP** modos |

### 18.2 Footers equivalentes

| Grupo | Arquivos | Diferenças | Recomendação |
|-------|----------|------------|--------------|
| Institucional | `LandingFooter`, `HelpFooter`, `AccessEarlyFooter` | colunas vs linha; Ajuda vs não; sociais | `PublicFooter` + variantes |
| Atribuição | `PublicPoweredByFooter`, `EmbedPoweredByBrand` | barra vs badge | **KEEP** separados; copy “Powered by” pode ser constante |

### 18.3 CTA pill branco (maior duplicação de classes)

A string `bg-white text-black rounded-full … hover:bg-zinc-200` (com `px-6/8`, `py-3/3.5`, `btn-scale`) está copiada em, entre outros:

`LandingHeader`, `LandingHero`, `LandingShowcase`, `LandingPortfolio`, `LandingFinalCta`, `LandingPricing`, `AccessEarlyHeader`, `AccessEarlyHero`, `AccessEarlyDemo`, `AccessEarlyTransition`, `AccessEarlyForm`, `SocialFollowActions`, `Login`, `SignUp`, `ForgotPassword`, `ResetPasswordAction`, `VerifyEmailSent`, `NotFound`, `PageActionHeader`, `PlanLimitButton`, `SettingsSaveActions`, `LegalConsentModal`, `AuthErrorScreen`, `HelpNotFound`.

Uma parte usa `<Button className={primaryBtnClass}>`; a maior parte usa `<button>` / `<Link>` nativos. O variant shadcn `default` **não** é o CTA FIVI360 (é `rounded-md` + `bg-primary`).

**Recomendação:** primitiva `BrandButton` / variant `brand` no `button.jsx` **sem** mudar visual. RC pequena. Não restyle.

### 18.4 Outras duplicações

| Item | Onde | Notas |
|------|------|-------|
| `primaryBtnClass` / `secondaryBtnClass` | 8+ arquivos landing/LP | constantes locais idênticas |
| `max-w-7xl mx-auto px-6 md:px-12 lg:px-16` | Home × N, Legal, PoweredBy, portfolio | candidato `PublicContainer` |
| Scroll listener `scrollY > 10` | `LandingHeader`, `AccessEarlyHeader` | extrair com o header compartilhado |
| Sheet menu | mesmos dois headers | vem de graça na extração |
| `PublicMessage` vs `PublicPageMessage` | `PublicPortfolio.js` vs `PublicPageShell.jsx` | markup quase igual |
| Loading centrado `#050505` + spinner | Viewer, Embed, PublicImageViewer, ProtectedRoute, portfolio project | padrão visual, não precisa de componente agora |
| `pages/Help.js` | redirect `/ajuda` | LEGACY_BUT_USED (alias) |
| `PublicRoute` / `LandingRoute` | aliases | LEGACY_BUT_USED (auth routing) |

---

## 19. Legado Emergent

Não há string “Emergent” no `src/`. O legado é estrutural (CRA + kit shadcn completo + páginas `.js`).

| Item | Classificação | Notas |
|------|---------------|-------|
| `src/components/ui/*` (~29 sem consumidor) | **LEGACY_BUT_USED** (kit) / mortos no grafo | AUDIT-DEAD-FILES-1; não apagar aqui |
| CSS variables light + `.dark` | **LEGACY_BUT_USED** | shadcn default; produto não usa |
| `darkMode: ["class"]` | **KEEP** | não ativar dark mode |
| `App.css` fade-in / btn-scale / card-hover | **KEEP** | usados de verdade |
| `Layout.js`, várias `pages/*.js` | **KEEP** | convenção CRA, não visual |
| `PublicRoute.jsx`, `LandingRoute.jsx` | **LEGACY_BUT_USED** | aliases documentados |
| `pages/Help.js`, `pages/NewProject.js` | **LEGACY_BUT_USED** | redirects |
| `components/ui/breadcrumb` | **REPLACE_LATER** / unused | Ajuda tem `HelpBreadcrumb` próprio — **KEEP** o da Ajuda |
| `components/ui/navigation-menu` | unused | não é o nav da Home |
| `Button` variants default | **SHARED_CANDIDATE** | hoje só âncora; visual vem de className |
| Hardcode `#050505` em ~20 arquivos | **SHARED_CANDIDATE** | token de marca de fato |

Nada para apagar nesta auditoria.

---

## 20. Matriz visual

| Superfície | Header | Footer | Logo | Container | Typography | Background | Buttons | Mobile | Consistência com marca |
|------------|--------|--------|------|-----------|------------|------------|---------|--------|-------------------------|
| Home | LandingHeader | LandingFooter | BrandLogo h-4/h-7 | 7xl | Outfit light / tighter | #050505 | pill Button+override | Sheet lg | **Referência** |
| App | AppHeader+sidebar | — | h-7 sidebar / h-4 mobile | fluido | mesma escala tighter | #050505 | pill nativo + invert nav | drawer lg | Alta (chrome próprio) |
| Legal | LandingHeader **Home nav** | **ausente** | idem Home | 7xl + leitura | tight, corpo zinc-300 | #050505 | CTAs Home | Sheet + TOC | Média (header errado, leitura ok) |
| Help | HelpHeader | HelpFooter | h-4/5 | 7xl gutters menores | tight, kickers | #050505 / cards #0c0c0c | Link pill / borda | sem Sheet | **Média-baixa no chrome**; alta no conteúdo |
| LP | AccessEarlyHeader | AccessEarlyFooter | h-4/5 / h-7 | 6xl | tight | #050505 + radial | pill | Sheet md | Alta na paleta; chrome clone |
| Auth | AuthHeader | — | h-7 centro | max-w-md | tight | #050505 | pill nativo | card full | Alta; sem legais no rodapé |
| Share | Platform header | Powered by | h-7 | 7xl | tighter | #050505 | cards app | ok | Alta (experiência) |
| Embed | **nenhum** | badge | texto | viewport | — | #050505 | — | safe-area | Correta (mínimo chrome) |
| Portfolio | identidade escritório | Powered by | logo cliente | 7xl | tighter | #050505 | — | stack | Alta (marca do cliente + FIVI360 discreto) |

---

## 21. Arquitetura-alvo

O código já sugere **famílias por bounded context**, não um layout único. A estrutura abaixo encaixa no SPA atual e num monorepo futuro (`apps/web`, `apps/app`, `apps/lp`, `apps/help` + `packages/brand`).

```
packages/brand (hoje: src/components/common + tokens)
  BrandLogo          ← já existe
  BrandButton        ← extrair classes pill
  PublicContainer    ← max-w-7xl + gutters institucionais
  ReadingContainer   ← max-w-3xl
  PublicHeader       ← context: home | legal | help
  PublicFooter       ← context: home | legal | help | campaign-minimal

PublicShell ( marca + container )
  ├── Home           (LandingLayout hoje)
  ├── Legal          (LegalPageLayout: TOC continua específico)
  └── Help           (HelpLayout: busca/sidebar/breadcrumb continuam em help/)

AppShell             ← Layout.js (sidebar + AppHeader)
  └── SettingsLayout nested

LandingShell         ← LP (AccessEarly* hoje); opcionalmente usa Brand* sem PublicHeader da Home

AuthShell            ← AuthLayout + links legais mínimos

ExperienceShell      ← PublicPageShell (share / portfolio modes)

ViewerShell          ← Viewer + PublicImageViewer (ViewerPageHeader)

EmbedShell           ← sem chrome institucional; só Powered by
```

**Por que não um único PublicHeader sem variantes:** Home precisa de âncoras e CTAs de conversão; Legal precisa **não** tê-las; Ajuda precisa do label “Central de Ajuda” e não pode importar `useAuth` de dentro de `src/help/` hoje. Variante/`context` (ou slots `nav` / `actions`) resolve isso sem fingir que são a mesma página.

**Monorepo:** `PublicHeader` / `BrandLogo` / tokens devem viver em `packages/brand` (ou `packages/ui`). `HelpLayout` fica em `apps/help` e **importa** brand. `Layout` (app) fica em `apps/app`. Não colocar sidebar do dashboard em `packages/brand`.

Não há evidência de um `AdminShell` no SPA atual.

---

## 22. Componentes compartilháveis (não criar agora)

| Candidato | Base atual | Quem usaria | Quem não usaria |
|-----------|------------|-------------|-----------------|
| `BrandLogo` | já existe | todos | portfólio (logo do escritório) |
| `BrandButton` / variant `brand` | classes pill espalhadas | Home, LP, Auth, 404, Ajuda CTA, app actions | nav invertida do sidebar |
| `PublicHeader` | `LandingHeader` | Home, Legal, Ajuda | App, Embed, Viewer, Portfolio office, Auth |
| `PublicFooter` | `LandingFooter` | Home, Legal, Ajuda; LP variante | App, Embed, Viewer |
| `PublicContainer` | string 7xl repetida | Home, Legal chrome, Ajuda | App, Auth, Embed |
| `PageHeader` | já existe no app | app (+ talvez Help h1) | LP hero, Legal título (já no layout) |
| `HelpBreadcrumb` | já existe | só Ajuda | não promover a ui/breadcrumb shadcn agora |

`SectionTitle` já existe como `SectionHeader` no app/portfolio. Não forçar na Home.

---

## 23. Exceções que devem permanecer específicas

| Superfície | O que não unificar | Por quê |
|------------|--------------------|---------|
| App | sidebar, AppHeader, user menu, padding fluido | ferramenta de trabalho |
| Help conteúdo | busca, breadcrumbs, category cards, sidebar docs | função de documentação |
| Legal corpo | TOC, scroll travado, largura de leitura | documento longo |
| LP | ordem das seções, form, CTA de lista, `max-w-6xl` se conversão pedir | campanha |
| Auth | card centrado, sem nav de marketing | foco em completar o fluxo |
| Portfolio | header do escritório | marca do cliente |
| Viewer | overlay, controles de cena | imersão |
| Embed | zero header institucional | iframe |
| LegalConsentModal | dialog bloqueante | gate, não página |

---

## 24. Plano incremental de migração

Princípio: **uma superfície por RC**, visualmente reversível, testes já existentes (LandingHeader.auth, Help isolation, legal layout).

### RC-UI-BRAND-1 — Primitivas de marca (sem mudar pixels)

- Documentar (ou extrair constantes) de: fundo `#050505`, `BrandLogo` sizes `sm`/`md`, classe CTA pill, `PublicContainer` gutters.
- Opcional: variant `brand` em `button.jsx` **idêntico** ao visual atual; migrar 2–3 consumidores da Home.
- **Não** ativar `.dark`. **Não** restyle.
- Risco: **LOW**. Testes: Landing header auth; visual spot Home.

### RC-UI-PUBLIC-HEADER-1 — PublicHeader a partir de `LandingHeader`

- Extrair `PublicHeader` com slots/`context`: `home` (comportamento atual 100%).
- `legal`: logo + CTAs auth (Entrar / Dashboard) **sem** âncoras `#recursos`…`#faq`. Sticky/fixed permanece decisão do `LegalPageLayout`.
- Home continua visualmente igual (snapshot / testids atuais).
- Ajuda e LP **ainda não** migram.
- Risco: **MEDIUM** (analytics `cta_location: header`, Guest vs autenticado, Legal `fixed` + `pt-16`).
- **Não** tocar `LegalConsentGate`.

### RC-UI-PUBLIC-FOOTER-1 — PublicFooter

- Extrair de `LandingFooter`; Home permanece igual.
- Ligar em Legal (hoje sem footer) — variante sem âncoras da Home.
- Ajuda: ou adota variante compacta, ou espera RC da Ajuda (evitar dois diffs grandes).
- Risco: **LOW–MEDIUM** (links `/termos` `/privacidade` `/ajuda`; sociais da LP config).

### RC-UI-LEGAL-SHELL-1 — Legal

- Consumir `PublicHeader context="legal"` + `PublicFooter`.
- Manter TOC, scroll, `LegalDocumentRenderer`.
- Risco: **MEDIUM** (layout `h-dvh` + footer extra compete com o artigo; testar mobile TOC). Conteúdo legal **não** muda (fora do escopo de AUDIT-LEGAL-DOCS).

### RC-UI-HELP-CHROME-1 — Ajuda

- `HelpHeader` passa a ser `PublicHeader context="help"` (label + Voltar + Entrar).
- Alinhar altura/gutters/blur à Home **ou** documentar desvio restante.
- Preservar isolamento: o componente de marca pode viver fora de `src/help/`; **não** importar `useAuth` dentro do módulo help. Se quiser “Dashboard” quando logado, passar prop **de** `App.js` / wrapper fora de `help/`.
- Footer: variante `help`.
- Risco: **MEDIUM** (`helpIsolation.test.js`, testids `help-header-*`, SEO inalterado).
- Conteúdo de artigos: **não** mexer.

### RC-UI-AUTH-CHROME-1 — Auth

- Links Termos / Privacidade / Ajuda no `AuthLayout` (texto `zinc-500`, sem grid da Home).
- Opcional: `BrandLogo` size alinhado ao header público (`sm`) — só se o time aceitar mudança mínima.
- Risco: **LOW**. Não alterar GuestRoute nem consent checkbox.

### RC-UI-LP-CHROME-1 — LP

- Trocar clone de blur/CTA por primitivas da RC-1.
- Header de sucesso: reusar `AccessEarlyHeader` mínimo ou `PublicHeader` sem nav — **eliminar o terceiro header**.
- Não copiar seções da Home; não mudar copy/form.
- Risco: **MEDIUM** (conversão, testes AccessEarly). Manter `PUBLIC_ALWAYS`.

### Fora de série / depois

- App: **não** unificar header. Tokenizar `#050505` só se RC-1 tiver constantes — substituição mecânica, visual idêntico.
- Embed / Viewer / Portfolio: **não** incluir nestas RCs.
- Podar `components/ui` órfãos: AUDIT-DEAD-FILES-1, não aqui.

Ordem sugerida: **Brand → PublicHeader (Home+Legal) → PublicFooter → Legal shell → Help chrome → Auth → LP**. Ajuda depois de Legal porque o isolamento e os testids da Central são mais frágeis que o header já compartilhado de Legal.

---

## 25. Riscos

| Proposta | Risco | Atenção especial |
|----------|-------|------------------|
| Brand primitives / CTA variant | **LOW** | Não alterar tamanho/cor do pill; regressão visual Home CTAs (`click_cta_start`) |
| PublicHeader Home | **MEDIUM** | `LandingHeader.auth.test.jsx`; visitante vs autenticado; Sheet mobile |
| PublicHeader Legal | **MEDIUM** | Remover âncoras pode ser percebido como “sumiu o menu”; `fixed` + `pt-16`; **não** ligar `LegalConsentGate` |
| PublicFooter em Legal | **MEDIUM** | Viewport travado: footer precisa de lugar (encolher artigo ou abandonar `overflow: hidden` no body) |
| Help chrome | **MEDIUM** | Isolamento (sem `useAuth` em `src/help`); “Entrar” vs Dashboard; rotas `/ajuda/:cat/:slug` |
| Auth links | **LOW** | GuestRoute; não puxar o usuário logado para AuthLayout |
| LP | **HIGH** se restyle / **MEDIUM** se só primitivas | Conversão, form, attribution query; sucesso redirect 20s |
| Unificar App com PublicHeader | **HIGH** | Não fazer |
| Header no Embed | **HIGH** | Não fazer |
| Viewer / hotspots | **HIGH** se mexer no overlay | Fora destas RCs |
| Routing / `PublicAlwaysRoute` | **HIGH** se misturado | RCs visuais não mudam guards |
| Ativar `.dark` / light theme | **HIGH** | Não fazer; Dialog/Button sem override já são armadilha light |

---

## 26. Recomendação

1. Tratar **Home + Legal + Ajuda** como a família **institucional** (mesma marca, mesmo chrome, contextos diferentes). Hoje só Home e Legal compartilham header — e Legal compartilha o **header errado**.
2. Extrair primitivas **antes** de “consertar a Ajuda”: senão nasce um quarto header.
3. **Não** unificar App, LP (estrutura), Embed, Viewer, Portfólio.
4. Aceitar que o design system real é **zinc + `#050505` + pill branco**, não as CSS variables shadcn. Tokenizar isso é mais honesto do que “ligar o dark mode”.
5. Migrar em RCs pequenas, começando por Legal (maior ganho estrutural: nav correta + footer) e só então o chrome da Ajuda (maior ganho percebido).
6. Preservar isolamento da Central: marca compartilhada **sim**; AuthContext dentro de `src/help/` **não**.

**Esta auditoria é somente leitura. Nenhum código foi alterado. Build completo não foi executado. Deploy não foi realizado.**
