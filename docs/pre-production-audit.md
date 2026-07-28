# Auditoria Pré-Produção FIVI360

> **Nota histórica (RC-CLEANUP-LEGACY-1):** menções a Mercado Pago neste documento
> refletem o estado na data da auditoria e **não** são configuração atual.
> Billing ativo = Stripe apenas.

**Sprint 13** — Auditoria somente leitura (sem alteração de código, git ou deploy)  
**Data:** 10 de junho de 2026  
**Versão analisada:** `fivi360@1.0.2`  
**Build:** `npm run build` — **Compiled with warnings** (1 aviso ESLint em `Viewer.js`; bundle principal **331,48 KB** gzip)

---

## Resumo Executivo

O FIVI360 v2 está funcionalmente maduro para beta interno: rotas SPA com guards coerentes, Auth/Firestore/Storage integrados, enforcement de planos na camada de **services** (não nas rules), fluxos públicos de compartilhamento e portfólio implementados, e landing com CTAs legais básicos.

Os bloqueadores para produção pública concentram-se em **segurança backend** e **configuração de deploy**:

1. **Storage Rules** permitem leitura pública de **todos** os arquivos sob `users/`, `projects/` e `images/`.
2. **Firestore Rules** permitem `list` de imagens por `projectId` **sem** validar visibilidade do projeto — vazamento de metadados (e URLs) de projetos privados.
3. **Limites de plano** existem só no cliente/services — usuário autenticado pode alterar `plan`, `portfolioEnabled`, criar hotspots e exceder quotas via API Firestore direta.
4. Risco operacional: `.env` local tem `REACT_APP_USE_FIREBASE_EMULATORS=true` e **não está no `.gitignore`**; build CRA embute env no bundle.

**Recomendação:** **No-Go** para beta público amplo até corrigir rules (Storage + Firestore) e pipeline de env de produção. **Go condicional** para beta fechado com usuários de confiança, emuladores desligados e rules já publicadas no projeto Firebase correto.

---

## Mapa de rotas auditadas

| Rota | Guard | Logado | Visitante | Observação |
|------|--------|--------|-----------|------------|
| `/` | `LandingRoute` | → `/dashboard` | Landing | OK |
| `/login` | `PublicRoute` | → `/dashboard` | Login | OK; suporta `?plan=` |
| `/register` | `PublicRoute` | → `/dashboard` | Cadastro | Email exige checkbox legal; Google não |
| `/forgot-password` | `PublicRoute` | → `/dashboard` | Recuperação | Rota extra (não listada no escopo, presente) |
| `/dashboard` | `ProtectedRoute` + `LegalConsentGate` | App | → `/login` | OK |
| `/images` | idem | App | → `/login` | OK |
| `/projects` | idem | App | → `/login` | OK |
| `/projects/new` | idem | App | → `/login` | Rota extra de criação |
| `/projects/:id` | idem | App | → `/login` | OK |
| `/viewer/:imageId` | `ProtectedRoute` (sem Layout) | Viewer privado | → `/login` | OK; valida `userId` no hook |
| `/plan` | `ProtectedRoute` + Layout | Planos | → `/login` | OK; `?upgrade=` abre modal |
| `/pricing` | `Navigate` → `/plan` | — | — | Redirect legado OK |
| `/settings` | `ProtectedRoute` | Settings | → `/login` | OK |
| `/help` | `ProtectedRoute` | Ajuda | → `/login` | **Protegida** (visitante não vê) |
| `/termos` | — | Pública | Pública | OK |
| `/privacidade` | — | Pública | Pública | OK |
| `/share/project/:id` | — | Pública | Pública | Valida `shared`/`public` no front |
| `/share/image/:imageId` | — | Pública | Pública | Valida via `canAccessPublicImage` |
| `/u/:slug` | — | Pública | Pública | Exige `portfolioEnabled` |
| `*` | — | `NotFound` | `NotFound` | OK; home conforme sessão |

**SPA Hosting:** `firebase.json` — rewrite `**` → `/index.html` (adequado para React Router).

---

## Riscos Críticos

### C-01 — Storage: leitura pública irrestrita

| Campo | Valor |
|--------|--------|
| **Categoria** | Storage Rules / Privacidade |
| **Gravidade** | Crítico |
| **Rota afetada** | Todas (`/viewer`, `/share/image`, `/images`, etc.) |
| **Descrição** | `storage.rules` define `allow read: if true` para `users/{userId}/**`, `projects/{projectId}/**` e `images/**`. Qualquer pessoa com URL ou path pode baixar panoramas, mesmo quando Firestore nega metadados. |
| **Impacto em produção** | Imagens “privadas” ficam acessíveis por URL direta do Firebase Storage; vazamento irreversível via link compartilhado ou enumeração de paths. |
| **Sugestão de correção** | Restringir `read` a owner autenticado OU validar token customizado / signed URLs; para conteúdo público, usar path dedicado `public/` ou regra que consulte visibilidade no Firestore (com custo) ou CDN com tokens. |
| **Arquivos prováveis** | `storage.rules`, `src/services/images/imageService.js` (paths `users/{uid}/...`) |

---

### C-02 — Firestore: listagem de imagens por `projectId` sem checagem de visibilidade

| Campo | Valor |
|--------|--------|
| **Categoria** | Firestore Rules |
| **Gravidade** | Crítico |
| **Rota afetada** | `/share/project/:id`, `/share/image/:imageId`, APIs anônimas |
| **Descrição** | `allow list` em `images` inclui `resource.data.projectId != null` sem exigir projeto `shared`/`public`. Anônimo com ID de projeto privado obtém documentos (título, `previewUrl`, `originalUrl`, `storagePath`). |
| **Impacto em produção** | Enumeração de projetos privados se o ID vazar (links antigos, logs, referer); exposição de URLs que, com C-01, permitem download total. |
| **Sugestão de correção** | Remover branch genérica de `list`; exigir `where` combinado com visibilidade verificável ou negar `list` anônimo e servir imagens públicas via Cloud Function / coleção espelho pública. |
| **Arquivos prováveis** | `firestore.rules` (L198–200), `src/services/images/imageService.js` (`getImagesByProjectIdPublic`) |

---

### C-03 — Limites de plano só no cliente (bypass via Firestore)

| Campo | Valor |
|--------|--------|
| **Categoria** | Planos / Firestore Rules |
| **Gravidade** | Crítico |
| **Rota afetada** | `/plan`, `/projects`, `/images`, `/settings`, `/viewer` |
| **Descrição** | `assertCanCreateProject`, `assertCanUploadImage`, `assertHotspotsEnabled`, `assertPublicVisibilityEnabled` rodam apenas em `planService` e services. Rules de `users` permitem `update` do owner **sem** validar campo `plan`, `portfolioEnabled`, etc. Rules de `images`/`hotspots` não verificam plano. |
| **Impacto em produção** | Usuário pode setar `plan: enterprise`, ativar portfólio, criar hotspots e ultrapassar quotas (projetos/imagens/storage) com SDK ou REST Firestore. |
| **Sugestão de correção** | Cloud Functions nos writes sensíveis; ou rules com `get(users/{uid}).data.plan` e contadores; limites de storage via regras de tamanho + validação server-side. |
| **Arquivos prováveis** | `firestore.rules`, `src/services/plans/planService.js`, `src/config/planLimits.js` |

---

### C-04 — Emulador Firebase pode ir para build de produção

| Campo | Valor |
|--------|--------|
| **Categoria** | Firebase / Build |
| **Gravidade** | Crítico |
| **Rota afetada** | Global |
| **Descrição** | `src/config/firebase.js` conecta emuladores quando `REACT_APP_USE_FIREBASE_EMULATORS === "true"`. O `.env` do workspace está com `true`. CRA embute variáveis no build. |
| **Impacto em produção** | App em hosting aponta para `127.0.0.1` — auth/dados/storage quebrados ou silenciosamente vazios. |
| **Sugestão de correção** | `.env.production` com `false`; CI com env explícito; falhar build se emulador=true em `NODE_ENV=production`; remover `console.log` de diagnóstico. |
| **Arquivos prováveis** | `.env`, `src/config/firebase.js`, pipeline CI/CD |

---

### C-05 — `.env` fora do `.gitignore`

| Campo | Valor |
|--------|--------|
| **Categoria** | Segurança / Secrets |
| **Gravidade** | Crítico |
| **Rota afetada** | — |
| **Descrição** | `.gitignore` ignora `.env.local` etc., mas **não** `.env`. Arquivo contém chaves Firebase reais. |
| **Impacto em produção** | Vazamento de credenciais em repositório; rotação de chaves e abuso de quota. |
| **Sugestão de correção** | Adicionar `.env` ao `.gitignore`; usar `.env.example` completo; secrets no CI/hosting; rotacionar chaves se já commitado. |
| **Arquivos prováveis** | `.gitignore`, `.env`, `.env.example` |

---

## Riscos Altos

### A-01 — Perfil `users/{id}` legível por qualquer um (inclui e-mail)

| Campo | Valor |
|--------|--------|
| **Categoria** | Firestore Rules / LGPD |
| **Gravidade** | Alto |
| **Rota afetada** | `/share/project/:id`, `/u/:slug` |
| **Descrição** | `allow get: if isOwner(userId) \|\| true` em `users`. `getPublicUserById` mapeia `email` no modelo. UI pública não exibe e-mail, mas SDK anônimo lê o documento completo. |
| **Impacto** | Exposição de PII; não conformidade com expectativa de “só dados de escritório”. |
| **Sugestão** | ~~Subcoleção `users/{id}/public/profile`~~ **Implementado:** coleção top-level `publicProfiles/{uid}` + `users/{uid}` owner-only. Ver [public-profile-model.md](./public-profile-model.md). |
| **Arquivos prováveis** | `firestore.rules` (L117), `src/services/users/userService.js` |

---

### A-02 — Google no cadastro sem checkbox de termos na UI

| Campo | Valor |
|--------|--------|
| **Categoria** | Auth / Legal |
| **Gravidade** | Alto |
| **Rota afetada** | `/register` |
| **Descrição** | Cadastro e-mail exige `LegalConsentCheckbox`; botão Google em `SignUp` não verifica aceite antes do popup. Mitigação: `LegalConsentGate` após login. |
| **Impacto** | Lacuna de consentimento no fluxo de cadastro Google; risco jurídico se gate falhar ou for contornado. |
| **Sugestão** | Exigir checkbox também para Google; ou `signInWithGoogle` só após aceite; registrar `acceptedSource` no primeiro profile. |
| **Arquivos prováveis** | `src/pages/SignUp.js`, `src/components/legal/LegalConsentGate.jsx` |

---

### A-03 — Exclusão de conta prometida na política, não implementada

| Campo | Valor |
|--------|--------|
| **Categoria** | Auth / Legal |
| **Gravidade** | Alto |
| **Rota afetada** | `/settings`, `/privacidade` |
| **Descrição** | Política de privacidade menciona exclusão em Configurações “quando disponível”. Não há fluxo em `Settings.js`. |
| **Impacto** | LGPD: direito de eliminação não atendido; divergência documentação × produto. |
| **Sugestão** | Implementar exclusão (Auth + Firestore + Storage + slugs) via Callable Function com confirmação. |
| **Arquivos prováveis** | `src/pages/Settings.js`, `src/pages/PrivacyPolicy.jsx` |

---

### A-04 — URLs legadas sem redirect no Hosting

| Campo | Valor |
|--------|--------|
| **Categoria** | Rotas / Deploy |
| **Gravidade** | Alto |
| **Rota afetada** | `/viewer/:projectId/:imageId`, `/share/image/:projectId/:imageId` |
| **Descrição** | README e auditorias antigas documentam padrões com `:projectId` extra. App atual: `/viewer/:imageId`, `/share/image/:imageId`. Apenas `/pricing` → `/plan` existe. |
| **Impacto** | Links bookmarkados e e-mails antigos retornam 404 após deploy v2. |
| **Sugestão** | Redirects 301 no Hosting ou rotas compat no React Router. |
| **Arquivos prováveis** | `firebase.json`, `src/App.js`, `README.md` |

---

### A-05 — Demo da landing com placeholder

| Campo | Valor |
|--------|--------|
| **Categoria** | Landing |
| **Gravidade** | Alto |
| **Rota afetada** | `/` (seção `#demo`) |
| **Descrição** | `LANDING_DEMO.projectId = "COLOCAR_ID_DO_PROJETO_AQUI"`. `useLandingDemo` trata como indisponível. |
| **Impacto** | CTA “Ver Demonstração” sem experiência real na landing de produção. |
| **Sugestão** | Configurar ID de projeto demo `shared` em produção; documentar em runbook. |
| **Arquivos prováveis** | `src/config/landingDemo.js`, `src/hooks/useLandingDemo.js` |

---

### A-06 — Storage: escrita em `projects/{projectId}/**` para qualquer autenticado

| Campo | Valor |
|--------|--------|
| **Categoria** | Storage Rules |
| **Gravidade** | Alto |
| **Rota afetada** | Uploads (se path legado usado) |
| **Descrição** | `match /projects/{projectId}/{allPaths=**}` permite `write: if isSignedIn()` sem ownership. App usa `users/{userId}/...`, mas regra permanece aberta. |
| **Impacto** | Poluição de bucket, overwrite, custo de storage. |
| **Sugestão** | Remover match legado ou amarrar a `request.auth.uid` + metadados. |
| **Arquivos prováveis** | `storage.rules` |

---

### A-07 — Variáveis Firebase ausentes no `.env.example`

| Campo | Valor |
|--------|--------|
| **Categoria** | Build / Deploy |
| **Gravidade** | Alto |
| **Rota afetada** | Global |
| **Descrição** | `.env.example` só lista billing; não documenta `REACT_APP_FIREBASE_*` nem flag de emulador. |
| **Impacto** | Deploy incorreto por novos ambientes; `initializeApp` com `undefined` sem validação. |
| **Sugestão** | Expandir `.env.example`; validar config em `firebase.js` e falhar cedo com mensagem clara. |
| **Arquivos prováveis** | `.env.example`, `src/config/firebase.js`, `docs/firebase-foundation.md` |

---

### A-08 — Página pública lista todas as imagens do projeto

| Campo | Valor |
|--------|--------|
| **Categoria** | Compartilhamento |
| **Gravidade** | Alto (se modelo misto for requisito) |
| **Rota afetada** | `/share/project/:id` |
| **Descrição** | `getImagesByProjectIdPublic` não filtra `visibility` por imagem. Projeto `shared` exibe todas as imagens no grid; regras de `get` permitem leitura de imagem privada dentro de projeto shared/public. |
| **Impacto** | Comportamento pode ser intencional (“compartilhar projeto = todas as fotos”). Se produto exigir imagem privada dentro de projeto compartilhado, há vazamento. |
| **Sugestão** | Documentar regra de negócio; ou filtrar no front + rules por `image.visibility`. |
| **Arquivos prováveis** | `src/pages/PublicProject.js`, `firestore.rules`, `docs/business-rules.md` |

---

## Riscos Médios

### M-01 — `console.log` de emulador e deletes em produção

| Campo | Valor |
|--------|--------|
| **Categoria** | Observabilidade / Segurança |
| **Gravidade** | Médio |
| **Rota afetada** | Global |
| **Descrição** | Logs em `firebase.js` e `imageService`/`storageService` (paths de storage). |
| **Impacto** | Ruído em console; paths sensíveis em ferramentas de suporte do cliente. |
| **Sugestão** | Remover ou guardar com `if (process.env.NODE_ENV === 'development')`. |
| **Arquivos prováveis** | `src/config/firebase.js`, `src/services/images/imageService.js` |

---

### M-02 — SEO limitado (SPA + OG image ausente)

| Campo | Valor |
|--------|--------|
| **Categoria** | Landing / SEO |
| **Gravidade** | Médio |
| **Rota afetada** | `/`, `/termos`, `/privacidade` |
| **Descrição** | `index.html` tem meta description e OG básicos; `og:image` comentado; sem `robots.txt`/`sitemap`; conteúdo dinâmico não indexável por rota. |
| **Impacto** | Prévia pobre em redes sociais; SEO dependente de prerender futuro. |
| **Sugestão** | Adicionar `og-image.png`, favicon real, `robots.txt`; considerar prerender para landing. |
| **Arquivos prováveis** | `public/index.html`, `public/` |

---

### M-03 — Favicon referenciado mas ausente em `public/`

| Campo | Valor |
|--------|--------|
| **Categoria** | Landing |
| **Gravidade** | Médio |
| **Rota afetada** | Todas |
| **Descrição** | `index.html` referencia `%PUBLIC_URL%/favicon.ico`; pasta `public/` só tem `index.html`. |
| **Impacto** | 404 de favicon; aparência amadora em abas. |
| **Sugestão** | Adicionar `favicon.ico` ou SVG. |
| **Arquivos prováveis** | `public/index.html`, `public/` |

---

### M-04 — Billing / upgrade sem pagamento real

| Campo | Valor |
|--------|--------|
| **Categoria** | Planos |
| **Gravidade** | Médio |
| **Rota afetada** | `/plan`, `/register?plan=`, landing `#precos` |
| **Descrição** | `PAYMENTS_COMING_SOON_MESSAGE`; IDs MP vazios no `.env.example`. Upgrade altera UX mas não há cobrança. |
| **Impacto** | Expectativa de plano pago sem receita; suporte manual se `plan` for editado no console. |
| **Sugestão** | Deixar explícito “em breve”; bloquear `plan !== starter` exceto via admin até billing. |
| **Arquivos prováveis** | `src/config/billing.js`, `src/pages/Plan.js`, `src/services/billing/billingService.js` |

---

### M-05 — `/help` exige login

| Campo | Valor |
|--------|--------|
| **Categoria** | Rotas |
| **Gravidade** | Médio |
| **Rota afetada** | `/help` |
| **Descrição** | Rota sob `ProtectedRoute`. Visitantes não acessam FAQ/ajuda. |
| **Impacto** | Suporte pré-venda depende de landing FAQ apenas. |
| **Sugestão** | Tornar pública ou duplicar conteúdo essencial na landing. |
| **Arquivos prováveis** | `src/App.js`, `src/pages/Help.js` |

---

### M-06 — README desatualizado (MongoDB, rotas antigas)

| Campo | Valor |
|--------|--------|
| **Categoria** | Documentação |
| **Gravidade** | Médio |
| **Rota afetada** | — |
| **Descrição** | README cita FastAPI/MongoDB e rotas de viewer/share antigas. |
| **Impacto** | Onboarding errado; deploy de integrações inexistentes. |
| **Sugestão** | Atualizar README para stack Firebase atual. |
| **Arquivos prováveis** | `README.md` |

---

### M-07 — Usuários antigos sem aceite legal

| Campo | Valor |
|--------|--------|
| **Categoria** | Auth / Legal |
| **Gravidade** | Médio |
| **Rota afetada** | Rotas autenticadas |
| **Descrição** | `LegalConsentGate` bloqueia até `legalConsent` com versões atuais. Usuários legados sem campo passam pelo modal. |
| **Impacto** | Fricção no primeiro login pós-deploy; positivo para conformidade. |
| **Sugestão** | Comunicar release note; garantir que Google primeiro login cria profile com gate. |
| **Arquivos prováveis** | `src/components/legal/LegalConsentGate.jsx`, `src/utils/legalConsent.js` |

---

### M-08 — Logo em Configurações não funcional

| Campo | Valor |
|--------|--------|
| **Categoria** | Settings |
| **Gravidade** | Médio |
| **Rota afetada** | `/settings` |
| **Descrição** | Botão “Fazer upload” de logo sem handler. |
| **Impacto** | Expectativa quebrada em beta. |
| **Sugestão** | Implementar upload ou ocultar até estar pronto. |
| **Arquivos prováveis** | `src/pages/Settings.js` |

---

## Riscos Baixos

### B-01 — Bundle principal ~331 KB gzip

| Campo | Valor |
|--------|--------|
| **Categoria** | Build |
| **Gravidade** | Baixo |
| **Rota afetada** | Global |
| **Descrição** | Build OK; chunk principal `331.48 kB` gzip (Firebase + Pannellum + app). |
| **Impacto** | LCP em mobile 3G. |
| **Sugestão** | Code-splitting de rotas públicas vs app autenticado. |
| **Arquivos prováveis** | `src/App.js`, `package.json` |

---

### B-06 — Warning ESLint no build (`Viewer.js`)

| Campo | Valor |
|--------|--------|
| **Categoria** | Build |
| **Gravidade** | Baixo |
| **Rota afetada** | `/viewer/:imageId` |
| **Descrição** | `react-hooks/exhaustive-deps`: `useCallback` na L178 inclui dependência desnecessária `closeContextMenu`. |
| **Impacto** | Não bloqueia deploy; CI pode falhar se warnings forem tratados como erro. |
| **Sugestão** | Ajustar array de dependências ou desabilitar regra pontualmente. |
| **Arquivos prováveis** | `src/pages/Viewer.js` |

---

### B-02 — `AuthLoadingScreen` reutilizado em portfólio público

| Campo | Valor |
|--------|--------|
| **Categoria** | UX |
| **Gravidade** | Baixo |
| **Rota afetada** | `/u/:slug` |
| **Descrição** | `PublicPortfolio` usa tela de loading de auth. |
| **Impacto** | Confusão visual (“carregando sessão” implícito). |
| **Sugestão** | Spinner neutro público. |
| **Arquivos prováveis** | `src/pages/PublicPortfolio.js` |

---

### B-03 — Cross-doc reads nas rules (custo/latência)

| Campo | Valor |
|--------|--------|
| **Categoria** | Firestore Rules |
| **Gravidade** | Baixo |
| **Rota afetada** | `/share/image/:imageId` |
| **Descrição** | `get` de imagem e hotspots usa `get()` de projeto pai. |
| **Impacto** | Custo extra por leitura; limites de regras em escala. |
| **Sugestão** | Desnormalizar `projectVisibility` no doc da imagem. |
| **Arquivos prováveis** | `firestore.rules` |

---

### B-04 — Hotspot manager em mobile

| Campo | Valor |
|--------|--------|
| **Categoria** | Mobile |
| **Gravidade** | Baixo |
| **Rota afetada** | `/viewer/:imageId` |
| **Descrição** | Header do viewer esconde rótulos em `md` breakpoint; painel de hotspots pode competir com área do panorama em telas pequenas. |
| **Impacto** | UX apertada, não bloqueante. |
| **Sugestão** | Testar em 375px; drawer full-screen para hotspots. |
| **Arquivos prováveis** | `src/pages/Viewer.js`, `src/components/viewer/ViewerPageHeader.jsx` |

---

### B-05 — `firebase.json` sem headers de segurança

| Campo | Valor |
|--------|--------|
| **Categoria** | Deploy |
| **Gravidade** | Baixo |
| **Rota afetada** | Global |
| **Descrição** | Sem CSP, HSTS, `X-Frame-Options` no hosting. |
| **Impacto** | Superfície XSS/clickjacking marginal em SPA estática. |
| **Sugestão** | Adicionar `headers` no `firebase.json`. |
| **Arquivos prováveis** | `firebase.json` |

---

## Detalhamento por área de auditoria

### 1. Rotas e guards

- **ProtectedRoute:** redireciona para `/login`; envolve **LegalConsentGate** (bloqueio modal até aceite).
- **PublicRoute:** usuário logado → `/dashboard`.
- **LandingRoute:** logado → `/dashboard`; visitante vê landing.
- **Rotas públicas sem auth:** share, portfólio, termos, privacidade — corretas.
- **404:** `NotFound` com links contextuais — OK.
- **Gap:** URLs antigas sem redirect (A-04).

### 2. Firebase

| Item | Status |
|------|--------|
| Auth (email, Google, reset, logout) | Implementado |
| Firestore | Em uso (users, projects, images, hotspots, slugs) |
| Storage | Paths em `users/{uid}/...` |
| Emulators | Suportados via env; **risco em prod** (C-04) |
| Fallback config | Não valida campos vazios |
| Console logs em prod | Presentes (M-01) |

### 3. Firestore Rules (resumo)

> **Atualizado (Sprint Public Profile Cleanup 2):** ver [public-profile-model.md](./public-profile-model.md) e [security-rules-notes.md](./security-rules-notes.md). Tabela abaixo reflete o estado **no momento da auditoria**.

| Coleção | Owner | Público shared/public | Gap |
|---------|--------|------------------------|-----|
| users | CRUD owner | `get` aberto; `list` só com `publicSlug` | E-mail exposto (A-01) — **corrigido:** `get` owner-only |
| publicProfiles | — | — | **adicionado** — fonte pública canônica |
| slugs | create/delete owner | `get` aberto | OK |
| projects | CRUD owner | `get`/`list` se shared/public | OK no get |
| images | CRUD owner | `get` com cascata projeto | **list anônimo por projectId** (C-02) |
| hotspots | owner | leitura se imagem pública | Sem checagem de plano (C-03) |

### 4. Storage Rules (resumo)

- Leitura global (C-01).
- Escrita `users/{userId}` só owner — OK.
- Paths `projects/` e `images/` legados — leitura pública + escrita autenticada fraca (A-06).

### 5. Auth / Legal

| Fluxo | Status |
|-------|--------|
| Cadastro email + termos | OK (checkbox) |
| Cadastro Google | Sem checkbox na página (A-02); gate pós-login |
| Login / reset / logout | OK |
| Aceite usuários antigos | Modal `LegalConsentGate` |
| Exclusão de conta | Não implementada (A-03) |

### 6. Planos e limites

| Plano | Projetos | Imagens | Storage | Hotspots | Portfólio | Public visibility |
|-------|----------|---------|---------|----------|-----------|-------------------|
| Starter | 3 | 10 | 50 MB | Não | Não | Não (`public` oculto na UI) |
| Professional | ∞ | ∞ | 500 MB | Sim | Sim | Sim |
| Enterprise | ∞ | ∞ | 5 GB | Sim | Sim | Sim |

- UI: `PlanLimitButton`, toasts, modais premium — OK.
- Server-side enforcement em services — OK para uso honesto.
- **Rules não enforce** — C-03.
- Rotas diretas `/plan`, `/viewer` — protegidas por auth; limites de feature no service ao mutar dados.

### 7. Compartilhamento

| Cenário | Comportamento |
|---------|----------------|
| Projeto private | Página pública: “não disponível” |
| Projeto shared/public | `/share/project/:id` OK |
| Imagem solta shared | `/share/image/:id` via `canAccessPublicImage` |
| Imagem em projeto shared | Acesso via visibilidade do projeto |
| Imagem private em projeto shared | **Acessível** (regra + listagem) — ver A-08 |
| Viewer público + hotspots | Hotspots carregados se imagem pública |
| Portfólio `/u/:slug` | Requer slug + `portfolioEnabled`; projetos `visibility == public` |

### 8. Landing

| Item | Status |
|------|--------|
| CTAs `/register`, `#demo` | OK / demo placeholder (A-05) |
| `/register?plan=professional\|enterprise` | `billingPlanFlow` OK |
| `/plan?upgrade=` | Após auth OK |
| Links `/termos`, `/privacidade` | Footer OK |
| SEO / OG / favicon | Parcial (M-02, M-03) |

### 9. Build e Deploy

- **Build:** sucesso com 1 warning ESLint (`Viewer.js` L178 — ver B-06).
- **Tamanhos (gzip):** `main.js` 331,48 KB; CSS 15,33 KB; chunk `771` 17,61 KB.
- **Hosting:** SPA rewrite OK.
- **Env:** riscos C-04, C-05, A-07.
- **Site antigo:** sem redirects de rotas v1 (A-04).
- **Deploy script:** `npm run deploy` → `firebase deploy --only hosting` (não executado nesta auditoria).

### 10. Mobile

| Área | Responsivo | Notas |
|------|------------|-------|
| Dashboard / imagens / projetos | `p-8 md:p-12`, grids | Sidebar drawer OK |
| Viewer | Header compacto `md:` | B-04 |
| Hotspots | Painel lateral | Testar touch |
| Legais / landing | breakpoints `sm/md/lg` | OK |
| Páginas públicas share/portfólio | grids responsivos | OK |

---

## Checklist Go/No-Go

### Bloqueadores (No-Go)

- [ ] **C-01** — Restringir leitura Storage
- [ ] **C-02** — Corrigir `list` de imagens anônimas
- [ ] **C-03** — Enforce de plano/limites no backend (rules ou Functions)
- [ ] **C-04** — Garantir `REACT_APP_USE_FIREBASE_EMULATORS=false` no build de produção
- [ ] **C-05** — `.env` fora do repositório + rotação de chaves se vazou

### Altos (resolver antes de beta público)

- [ ] **A-01** — Exposição de e-mail em `users`
- [ ] **A-02** — Consentimento Google no cadastro
- [ ] **A-03** — Exclusão de conta ou ajustar política
- [ ] **A-04** — Redirects de URLs legadas
- [ ] **A-05** — Projeto demo da landing configurado
- [ ] **A-06** — Limpar rules Storage legadas
- [ ] **A-07** — `.env.example` completo + validação de config
- [ ] **A-08** — Decisão/documentação visibilidade imagem vs projeto

### Médios (aceitável em beta fechado com ressalvas)

- [ ] M-01 a M-08 conforme prioridade de produto

### Verificações positivas (Go)

- [x] Guards auth/landing/public coerentes
- [x] Rewrite SPA Firebase Hosting
- [x] Build de produção compila (1 warning ESLint não bloqueante)
- [x] Fluxo legal para usuários existentes (gate)
- [x] Compartilhamento público com validação no front
- [x] Redirect `/pricing` → `/plan`
- [x] Limites Starter refletidos na UI e services

---

## Plano de correção recomendado

### Fase 0 — Imediato (pré-deploy, 0,5–1 dia)

1. Criar `.env.production` com emuladores **desligados** e todas `REACT_APP_FIREBASE_*`.
2. Adicionar `.env` ao `.gitignore`; auditar histórico git por secrets (manual).
3. Publicar `firestore.rules` e `storage.rules` no projeto **`fivi360`** de produção após correções da Fase 1.

### Fase 1 — Segurança backend (2–4 dias)

1. Reescrever `storage.rules`: read owner-only + caminho público explícito; remover matches `projects/` e `images/` raiz se não usados.
2. Ajustar `firestore.rules`:
   - Remover `list` anônimo amplo em `images`.
   - Restringir `get` em `users` para campos públicos (subdoc ou Cloud Function).
   - Validar `plan` / quotas em `create` de projects/images (via Function recomendado).
3. Testes manuais com SDK anônimo: tentar listar imagens de projeto privado e baixar URL Storage.

### Fase 2 — Produto e compliance (2–3 dias)

1. Checkbox legal no Google Sign-Up; revisar textos.
2. Implementar exclusão de conta (Function + UI Settings) ou atualizar política.
3. Configurar `LANDING_DEMO.projectId` em produção.
4. Redirects Hosting para rotas v1.

### Fase 3 — Polish beta (1–2 dias)

1. Favicon + `og-image.png`; `robots.txt`.
2. Remover `console.log` de produção.
3. Atualizar README; expandir `.env.example`.
4. Teste mobile viewer/hotspots em dispositivo real.

### Fase 4 — Monetização (pós-beta)

1. Integrar Mercado Pago; sincronizar `users.plan` apenas via webhook/admin.
2. Bloquear alteração direta do campo `plan` nas rules.

---

## Referências de código

Guards de rota:

```24:35:src/components/auth/ProtectedRoute.jsx
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // ...
  return <LegalConsentGate>{children}</LegalConsentGate>;
}
```

Emulador condicional:

```36:64:src/config/firebase.js
const useEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true";
// ...
if (useEmulator && !globalThis.__FIVI360_FIREBASE_EMULATORS_CONNECTED__) {
  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  // ...
}
```

Storage read público:

```12:24:storage.rules
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if isOwner(userId);
    }
```

Listagem de imagens (regra + service):

```198:200:firestore.rules
      allow list: if
        (isSignedIn() && resource.data.userId == request.auth.uid)
        || resource.data.projectId != null;
```

---

*Relatório gerado por auditoria estática do repositório `fivi360` (Sprint 13). Nenhum arquivo de código foi modificado durante esta sprint. Build de produção executado em 10/06/2026.*
