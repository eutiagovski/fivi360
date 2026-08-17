# AUDIT-COOKIES-PRIVACY-1 — Cookies, storage, tracking e tecnologias de terceiros

**Data:** 17 de agosto de 2026  
**Escopo:** somente leitura (repositório, configs, SDK utilizado)  
**Versão analisada:** `fivi360@1.0.2`  
**Restrição:** nenhum código, política, ENV, Firebase, Analytics ou dependência foi alterado nesta auditoria  

> Classificações (`STRICTLY_NECESSARY`, `ANALYTICS`, etc.) e a coluna “Exige avaliação de consentimento?” são **recomendações técnicas**, não parecer jurídico.

---

## 1. Resumo executivo

O FIVI360 **não define cookies próprios no código** (`document.cookie` / `Cookie` / `browserCookiePersistence` não são usados). O armazenamento de sessão de login é **IndexedDB** (com fallback `localStorage` / `sessionStorage`) via Firebase Auth. Há **dois usos explícitos de `sessionStorage`** no app (e-mail pós-cadastro e dica do viewer). **Não há `localStorage` direto** no `src/`. Firestore **não** ativa persistência IndexedDB. Não há pixels de marketing (Meta, TikTok, Hotjar, GTM próprio, etc.).

O ponto material desta auditoria é **Firebase Analytics (GA4)**:

- Está **implementado** (`getAnalytics` + `logEvent`) e **inicializa automaticamente** no carregamento de **qualquer rota**, inclusive Home, LP, login, share, embed e portfólio, **sem consentimento prévio**.
- A inicialização ocorre **somente se** `REACT_APP_FIREBASE_MEASUREMENT_ID` estiver presente no bundle **e** emuladores estiverem desligados.
- O SDK injeta `https://www.googletagmanager.com/gtag/js`. Cookies GA4 (`_ga`, etc.) **não estão nomeados no código FIVI360**; são **prováveis** quando o gtag carrega.
- A Política de Privacidade atual (3 de junho de 2026) afirma não usar analytics de marketing nem cookies de publicidade, e descreve cookies apenas como “estritamente necessários”. **Não menciona GA4, gtag, formulário de pré-lançamento, UTMs, Stripe, Resend nem Google Fonts.**

**YouTube:** hoje `videoUrl` está vazio → placeholder, **sem iframe**. Quando `videoUrl` for preenchido, o iframe carrega com `loading="lazy"` (próximo ao viewport), **não** após clique, e **não** usa `youtube-nocookie.com`.

**Stripe / Resend:** Stripe no frontend é **redirect** para Checkout (sem `stripe-js`). Com pagamentos desligados, o backend rejeita checkout **antes** de chamar Stripe. Resend é **somente backend**.

**Recomendação mínima para o primeiro go-live:**  
**não incluir `REACT_APP_FIREBASE_MEASUREMENT_ID` no build de produção** (desliga Analytics sem mudar código) **e atualizar a Política de Privacidade** para refletir Auth/storage, formulário de pré-lançamento, atribuição UTM, Google Fonts, Stripe/Resend. **Banner/CMP não é tecnicamente necessário nesse cenário.** Se Analytics for ao ar no go-live, passa a ser **CENÁRIO B** (consentimento simples antes de `getAnalytics`).

**P0 de privacidade/segurança nesta auditoria:** nenhum.

---

## 2. Metodologia

Pesquisa em `src/`, `public/`, `functions/`, `firebase.json`, `package.json` / lockfiles, `.env.example`, `functions/.env.example`, `.env.production` e presença (sem valores) de variáveis em arquivos locais de ambiente.

Padrões buscados: `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`, `getAuth`, `setPersistence`, `getAnalytics`, `gtag`, `measurementId`, YouTube, Stripe, Resend, pixels de marketing, UTMs, `submitPrelaunchLead`, CDNs, iframes, `https://`.

SDK inspecionado (sem assumir comportamento):

- `firebase` ^12.14.0 — Auth `getAuth` default persistence; Analytics `GTAG_URL`; Installations IndexedDB; Firestore APIs de persistence **não** chamadas pelo app.
- `pannellum` 2.5.7 — bundle local; sem `cookie`/`localStorage`/`telemetry` no pacote.

Valores de secrets **não** são reproduzidos neste relatório.

Limitações: esta auditoria **não** inspecionou o navegador em runtime (DevTools Application). Cookies GA4 e identificadores Firebase Installations são inferidos do SDK quando Analytics inicializa, e estão na seção “prováveis”, não “confirmados pelo código FIVI360”.

---

## 3. Inventário de cookies

### 3.1 Cookies confirmados

**Nenhum cookie de primeira parte é criado pelo código FIVI360.**

Evidência:

- Não há `document.cookie` em `src/`.
- Não há `setPersistence(..., browserCookiePersistence)`.
- `getAuth()` usa a cadeia padrão do SDK web (IndexedDB → localStorage → sessionStorage), **sem** cookies.
- `browserCookiePersistence` existe no SDK, mas exige `initializeAuth` + middleware (ex.: Next.js); **não é usado**.
- Troca experimental de cookie Auth (`authTokenSyncURL`) **não está configurada**.
- `public/index.html` não carrega gtag/GTM/pixels.
- Hosting (`firebase.json`) não define `Set-Cookie`.

### 3.2 Cookies prováveis gerados por SDK/terceiros

Listados **somente** quando há evidência de script/SDK que, na documentação/implementação do fornecedor, costuma gravar cookies. **Nomes não aparecem no código FIVI360.**

| Origem | Quando | Nomes típicos (não confirmados no código) | Observação |
|--------|--------|-------------------------------------------|------------|
| Firebase Analytics → gtag.js (`www.googletagmanager.com/gtag/js`) | Se `measurementId` estiver no bundle e Analytics inicializar | Cookies GA4 de primeira parte no domínio do app (família `_ga` / `_ga_*` na documentação Google) | Injetado por `@firebase/analytics` em `getAnalytics()`. O projeto **não** chama `initializeAnalytics` com `allow_google_signals: false`. |
| Google Identity (login Google) | Somente ao usar “Entrar com Google” (`signInWithPopup`) | Cookies no domínio Google (`accounts.google.com`), não no FIVI360 | Terceiro; fluxo autenticado. |
| YouTube iframe | **Somente se** `ACCESS_EARLY_CONFIG.videoUrl` for uma URL `youtube.com/embed/...` | Cookies YouTube/Google no domínio YouTube | Hoje `videoUrl === ""` → iframe **não** monta. |
| Stripe Checkout | Somente após redirect para `checkout.stripe.com` | Cookies Stripe no domínio Stripe | Não há `loadStripe` / `js.stripe.com` no FIVI360. Com `PAID_CHECKOUT_ENABLED=false`, o backend não cria sessão. |

**Não inventar** `_ga` / `_gid` como “confirmados”. Tratar como prováveis **se** Analytics estiver ativo no bundle.

### 3.3 Não confirmado

- Cookies de Firebase Hosting.
- Cookies de Firestore.
- Cookies de Pannellum.
- Cookies de Resend no navegador.
- `_fbp`, `_gcl_au`, Hotjar, Clarity, TikTok, LinkedIn Insight, GTM container próprio.
- Cookie `ref` / UTM.
- Cookie de preferência de consentimento (não existe CMP).

---

## 4. Browser storage

### 4.1 SESSION_STORAGE (código FIVI360)

| Chave | Arquivo | Finalidade | Dados | Duração | Essencial? | Antes de consentimento? |
|-------|---------|------------|-------|---------|------------|-------------------------|
| `fivi360.verifyEmailSent` | `src/utils/verifyEmailSentState.js` | Sobreviver refresh em `/verify-email-sent` sem sessão Auth | e-mail, flag se o e-mail de verificação foi enfileirado, `savedAt` | Sessão da aba | Sim, para essa tela pós-cadastro | Após cadastro por e-mail (não no visitante anônimo da Home/LP) |
| `fivi360_viewer_hint_seen` | `src/utils/viewerInteractionHint.js` | Não repetir dica de interação 360° na mesma sessão | `"1"` | Sessão da aba | Funcional (UX) | Sim, se o viewer com hint for montado (inclui embed, `mode="embed"` mantém `showInteractionHint: true`) |

Não há outros `sessionStorage` em `src/` além de testes.

### 4.2 LOCAL_STORAGE (código FIVI360)

**Nenhum uso direto** de `localStorage` em `src/`.

**Fallback indireto (SDK Auth):** se IndexedDB falhar, `getAuth()` inclui `browserLocalPersistence`. Chaves típicas do SDK (não hardcoded no app): `firebase:authUser:<apiKey>:[DEFAULT]` — **provável**, não confirmado por string no repositório.

`next-themes` aparece em `src/components/ui/sonner.jsx`, mas o `Toaster` ativo em `App.js` é `@/components/ui/toaster`. **Não há `ThemeProvider`.** Sem evidência de `localStorage` de tema em produção.

### 4.3 INDEXED_DB

| Base (SDK) | Quando | Dados | Tracking? |
|------------|--------|-------|-----------|
| `firebaseLocalStorageDb` (Auth) | `getAuth(app)` no load de `src/config/firebase.js`, via `AuthProvider` em **todas** as rotas | Estado de sessão Auth (uid, tokens, providers) após login; DB pode ser criada antes do login | Cache/sessão técnica, **não** analytics |
| `firebase-installations-database` | Quando Analytics chama Installations para obter FID | Firebase Installation ID | Identificador técnico usado pelo Analytics |

Firestore: `getFirestore(app)` **sem** `enableIndexedDbPersistence` / `persistentLocalCache` / `initializeFirestore`. Persistência offline **não** está habilitada no projeto. Cache Firestore = **memória (técnico)**, não IndexedDB.

### 4.4 OTHER_BROWSER_STORAGE

| Tipo | Evidência |
|------|-----------|
| Cache Storage / Service Worker | `index.js` **não** registra SW. `workbox-google-analytics` é transitivo de `react-scripts`, **não** ativo. |
| Dedup de views públicas | `src/utils/recordViewOnce.js` usa `Map` **em memória** (3s). Não é cookie/storage. |
| Estado de formulário LP | React state apenas; UTMs **não** são gravados no browser. |

---

## 5. Firebase Auth

**Inicialização:** `src/config/firebase.js` — `export const auth = getAuth(app)`. Sem `setPersistence`, sem `initializeAuth`.

**Default do SDK web (firebase 12, `@firebase/auth`):**

```text
persistence: [
  indexedDBLocalPersistence,   // firebaseLocalStorageDb
  browserLocalPersistence,     // localStorage fallback
  browserSessionPersistence    // sessionStorage fallback
]
```

**Onde a sessão vive:** IndexedDB no domínio do app (persistente entre visitas), até logout ou limpeza do site.

**Identificadores possíveis:** `uid`, e-mail, `displayName`, `photoURL`, tokens ID/refresh, providers (`password`, `google.com`).

**Necessário para autenticação:** sim, para manter login entre reloads.

**Antes vs depois do login:**

- `getAuth` + `onAuthStateChanged` rodam em **todas** as páginas (incluindo `/`, LP, `/share/*`, `/embed/*`, `/u/*`), porque `AuthProvider` envolve o app inteiro (`src/index.js`).
- Persistência de **usuário autenticado** só após login/cadastro.
- Visitante anônimo: o SDK ainda inicializa Auth (possível criação do IndexedDB vazio / listener). Isso **não** é tracking de campanha; é bootstrap da SPA.

**Login Google:** `signInWithPopup` + `GoogleAuthProvider` (`src/services/auth/authService.js`). Cookies Google ficam no domínio Google, no momento do popup.

**Cookie Auth:** não usado.

---

## 6. Firestore

**Inicialização:** `getFirestore(app)` em `src/config/firebase.js`.

**Não encontrado no projeto:** `enableIndexedDbPersistence`, `enableMultiTabIndexedDbPersistence`, `persistentLocalCache`, `memoryLocalCache`, `initializeFirestore` com cache customizado.

**Conclusão:** cache local do Firestore é **técnico em memória**, não persistente. **Não é tracking.**

Leituras/escritas no servidor Google (Firestore) ocorrem quando a UI busca dados (projetos, imagens, perfil, leads via Functions). Isso transmite dados à infraestrutura Firebase; não cria cookies no cliente.

---

## 7. Firebase Analytics

### 7.1 Está realmente habilitado?

**No código: sim, de forma condicional.**

`src/services/analytics/analyticsService.js`:

```text
isAnalyticsEnabled = browser && Boolean(measurementId) && !useEmulator
```

Inicialização lazy: o primeiro `trackEvent` / `trackPageView` / `setAnalyticsUser` chama `getAnalytics(app)` após `isSupported()`.

Não há segunda inicialização (sem gtag no HTML, sem GTM, sem `initializeAnalytics` paralelo).

### 7.2 Ambientes

| Ambiente | Emuladores | measurementId | Analytics no cliente |
|----------|------------|---------------|----------------------|
| Dev local típico (`.env.local` com emuladores `true`) | Sim | Presente no arquivo local | **NÃO** (`!useEmulator` falha) |
| Build produção (`.env.production` força emuladores `false`) | Não | **Não** declarado em `.env.production` / `.env.production.local` | **SIM se** a variável estiver no ambiente de build (CRA também lê `.env.local` fora de test) |
| Emulador + measurementId | Sim | Irrelevante | **NÃO** |

`.env.example` documenta `REACT_APP_FIREBASE_MEASUREMENT_ID=` (vazio).  
O valor concreto **não** é reproduzido aqui.

**Risco operacional de go-live:** um `yarn build` feito em máquina que tenha `.env.local` com measurementId **pode embutir Analytics no bundle de produção**. CI limpo sem essa variável **não** embute. Verificar o bundle/CI antes do deploy.

### 7.3 Páginas / inicialização automática / consentimento

`AnalyticsRouteTracker` está em `App.js` **acima de todas as rotas**. No mount e a cada mudança de rota dispara `trackPageView` → `resolveAnalyticsInstance()` → `getAnalytics`.

**Sim: inicializa no carregamento, em todas as rotas, antes de qualquer consentimento de cookies.** Não existe CMP, Consent Mode (`gtag('consent', ...)`) nem flag de opt-in no serviço.

`AuthProvider` chama `setAnalyticsUser({ uid })` em todo `onAuthStateChanged` (também dispara init).

Firebase `getAnalytics` **não** passa `send_page_view: false`. O SDK gtag pode emitir page_view nativo **além** do evento customizado `page_view` do app.

### 7.4 Eventos encontrados

**Automáticos / infraestrutura**

| Evento | Origem |
|--------|--------|
| `page_view` | `AnalyticsRouteTracker` (pathname + search + hash, `document.title`) |
| page_view nativo gtag | SDK Firebase Analytics (não desligado) |
| `setUserId(uid)` / `setUserProperties({ plan_id })` | `setAnalyticsUser` (plan_id só se passado; hoje o AuthContext passa só `uid`) |

**Customizados (código)**

| Evento | Onde | Params (após sanitize) |
|--------|------|-------------------------|
| `view_landing` | `src/pages/Landing.jsx` | — |
| `click_cta_start` | Header / Hero / Final CTA | `cta_location`: header, hero, final |
| `click_pricing_pro` | `LandingPricing.jsx` | — |
| `login` | `AuthContext` | `method`: email \| google |
| `sign_up` | `AuthContext` | `method`: email \| google |
| `create_project` | `CreateProjectDialog` | `has_description` |
| `upload_image` | `UploadImageDialog` | `source`, `has_project` |
| `create_hotspot` | `Viewer.js` | `hotspot_type`: scene \| info |
| `view_360_image` | Viewer privado + `PublicImageViewer` | `source`: private \| public \| shared |
| `share_project` | `ShareProjectDialog` | `visibility`: public \| private \| link |
| `share_image` | `ShareImageDialog` | idem |
| `publish_portfolio` | `Settings.js` | `enabled: true` |
| `begin_checkout` | `Plan.js` | `plan_id` |
| `subscription_success` | `useCheckoutSuccessSync.js` | — |
| `portfolio_view` | `publicViewTracking.js` | `authenticated` |
| `public_project_view` | idem | `source: portfolio` |
| `public_360_view` | idem | `source: portfolio` |

**Preparados, não disparados:** comentários em `SocialFollowActions.jsx` (`prelaunch_instagram_click`, `prelaunch_youtube_click`, `prelaunch_whatsapp_group_click`).

Sanitize: remove e-mail, telefone, tokens, CPF, etc.; strings com `@` são descartadas. `page_path` inclui querystring (UTMs na URL **podem** ir para o GA4 via `page_view` se Analytics estiver ativo).

### 7.5 Analytics também roda em…?

Assumindo measurementId no bundle e emuladores off:

| Superfície | `page_view` automático | Eventos extras |
|------------|------------------------|----------------|
| Home `/` | Sim | `view_landing`, CTAs, pricing |
| LP `/lp/acesso-antecipado` | Sim | Nenhum evento LP específico |
| LP sucesso | Sim | — |
| Login / register | Sim | `login` / `sign_up` após sucesso |
| App autenticado | Sim | CRUD, viewer, share, checkout |
| Share `/share/*` | Sim | `view_360_image` (shared) |
| Embed `/embed/*` | Sim (`AnalyticsRouteTracker`) | PanoramaViewer `mode="embed"` **não** dispara eventos de viewer; **page_view global permanece** |
| Portfólio `/u/*` | Sim | `portfolio_view`, `public_project_view`, `public_360_view`, `view_360_image` (public) |
| `/termos`, `/privacidade` | Sim | — |

---

## 8. YouTube

**Estado atual:** `ACCESS_EARLY_CONFIG.videoUrl === ""` (`src/landing-pages/access-early/config.js`). `AccessEarlyVideo` renderiza placeholder; testes confirmam **iframe ausente**.

**Quando `videoUrl` for configurado:**

- O iframe é montado **imediatamente** na seção (com `loading="lazy"`: o browser pode adiar até perto do viewport).
- **Não** há clique-para-carregar.
- `src` é a URL crua (testes usam `https://www.youtube.com/embed/...`).
- **Não** há `youtube-nocookie.com` no repositório.
- CTAs sociais `youtubeUrl` também estão vazios; quando preenchidos são `<a href>` (navegação, não embed).

**Recomendação (não implementar agora):**

1. Preferir `https://www.youtube-nocookie.com/embed/{id}` (Privacy Enhanced Mode).
2. Ainda melhor: poster + botão “Assistir”; só então montar o iframe.
3. Limitação do nocookie: ainda há contato com Google ao reproduzir; reduz cookies de tracking **antes** da reprodução, não elimina YouTube como terceiro.

---

## 9. Stripe

| Modelo | Presente? |
|--------|-----------|
| A) Redirect para Stripe Checkout | **Sim** — Cloud Function devolve `checkoutUrl`; `Plan.js` faz `window.location.assign` |
| B) Stripe.js no FIVI360 | **Não** — zero `loadStripe`, `@stripe/stripe-js`, `js.stripe.com` |
| C) Chamadas backend | **Sim** — `createStripeCheckoutSession`, `cancelStripeSubscription`, cliente Stripe nas Functions |
| D) Webhooks | **Sim** — `functions/src/stripeWebhook.js` |

**Script Stripe no visitante?** Não. Nada é carregado ao abrir o FIVI360.

**Go-live com pagamentos off:**

- Frontend: `REACT_APP_PAID_CHECKOUT_ENABLED=false` (`.env.example`); `isPaidCheckoutEnabled()` é true **a menos que** a env seja a string `"false"`. `.env.production` **não** define essa variável — a UI pode mostrar CTAs de checkout, mas…
- Backend: `PAID_CHECKOUT_ENABLED=false` é a autoridade; `createStripeCheckoutSession` rejeita **antes** de `getStripeClient()`.

Portal de billing no cliente: stub `NOT_ACTIVE` (`createBillingPortalSession`).

Cookies Stripe: só no domínio Stripe **depois** do redirect, quando pagamentos estiverem ligados.

---

## 10. Resend

**Somente backend.** Dependência `resend` em `functions/package.json`. Cliente em `functions/src/email/resendClient.js`; envio via `processEmailQueue`.

Nenhum script Resend no frontend. **Não aplicável a cookies/storage do navegador.**

Dados de e-mail transacional (verificação, billing, welcome) saem do servidor para a API Resend — tratar na Política como operador de e-mail, não como cookie.

---

## 11. LP / Attribution

Rota: `/lp/acesso-antecipado` (`PublicAlwaysRoute`).  
Implementação: `src/landing-pages/access-early/utils/getPrelaunchAttribution.js`.

| Campo URL / documento | Persistido no browser? | Enviado |
|-----------------------|------------------------|---------|
| `utm_source` → `attribution.source` | Não | No submit |
| `utm_medium` → `medium` | Não | No submit |
| `utm_campaign` → `utmCampaign` | Não | No submit; **não** vira `campaignId` |
| `utm_content` → `content` | Não | No submit |
| `utm_term` → `term` | Não | No submit |
| `ref` | **Não lido** | — |
| `document.referrer` → `referrer` | Não | No submit |
| `location.pathname` → `landingPath` | Não | No submit (obrigatório no backend) |

Querystring **permanece na URL** (não é apagada). Não há cookie UTM.

**UTM attribution ≠ cookie tracking.** Captura pontual no submit.

`campaignId` interno: `prelaunch_2026` (`ACCESS_EARLY_CAMPAIGN.id`).

**Se Analytics estiver ativo:** `page_view` inclui `location.search` → UTMs podem ir ao GA4 **antes** do cadastro, só por visitar a LP com querystring.

### Formulário `submitPrelaunchLead`

Cliente (`prelaunchLeadService.js` + `useAccessEarlyForm.js`) envia:

- nome, e-mail, WhatsApp (`phone`), profissão, `marketingConsent` (boolean), `campaignId`, `attribution`.

Backend (`validateAndNormalizePrelaunchLead` + `submitPrelaunchLeadCore`) grava em `prelaunchLeads/{id}` os mesmos campos + normalizações (`emailNormalized`, `phoneNormalized`) + `status`, timestamps.

**Não encontrado no payload/aplicação:** IP, user-agent, device fingerprint, geolocation, Firebase UID (callable pública; comentário: “não vincula auth.uid”), analytics client ID.

Infra Google/Cloud Functions **pode** logar IP em nível de plataforma; **não** é persistido no documento do lead pelo código auditado.

Checkbox de marketing é **opt-in de comunicação**, desmarcado por padrão. Nota de privacidade no form aponta `/privacidade`, **sem** checkbox de Termos (diferente do SignUp).

Página de sucesso **não** reenvia lead; não grava storage.

---

## 12. Share / Embed / Portfolio

Todas passam por `AuthProvider` + `AnalyticsRouteTracker`.

| Rota | Auth SDK | Firestore / Functions | Analytics | Terceiros de mídia | Storage browser |
|------|----------|----------------------|-----------|--------------------|-----------------|
| `/share/project/:projectId` (+ image, standalone) | Init global | Leitura pública Firestore | `page_view` + `view_360_image` | Fonts Google; imagens Storage | Hint viewer (sessionStorage) se o viewer montar |
| `/embed/:id` (+ `/image/:imageId`) | Init global | HTTP `getPublicEmbeddedProject` (`*.cloudfunctions.net`) | `page_view` **sim**; eventos de viewer **não** | Fonts; Storage URLs no panorama | Hint sessionStorage possível |
| `/u/:slug` (+ project/image) | Init global | Firestore público + incrementos de stats | `page_view` + portfolio/project/360 events | Fonts; Storage | Hint se viewer |

**Embed:** `frame-ancestors *` em `firebase.json`. O iframe herda o **mesmo bundle SPA**. Se Analytics estiver no bundle, o site de terceiros carrega gtag **dentro** do iframe (origem = app FIVI360). Isso é o maior agravante de Analytics no go-live.

Pannellum: import dinâmico `pannellum/build/pannellum.js` + CSS local. Sem CDN Pannellum, sem telemetry no pacote.

---

## 13. Dependências e terceiros

### 13.1 Serviços que podem receber dados do navegador

| Serviço | Finalidade | Frontend? | Quando | Dados potenciais | Cookie/storage possível? | Necessário? | Observações |
|---------|------------|-----------|--------|------------------|--------------------------|-------------|-------------|
| Firebase Auth / Identity Toolkit | Login | Sim (SDK) | Load de qualquer rota; tokens após login | Credenciais, uid, tokens | IndexedDB / fallback storage | Sim (app) | Sem cookie 1P |
| Cloud Firestore | Dados | Sim (SDK) | Ao ler/escrever | Perfil, projetos, leads via Functions | Memória; sem IDB persistence | Sim | Técnico |
| Firebase Storage | Imagens | Sim (URLs/SDK) | Upload e view 360 | Arquivos, URLs | Não (cookies app) | Sim | `firebasestorage.googleapis.com` típico |
| Cloud Functions | Callables + embed HTTP | Sim | Submit LP, billing, verify-email, embed fetch | Payload da função; auth se logado | Não | Sim | Região `southamerica-east1` |
| Firebase Analytics / GA4 / gtag | Métricas de produto | Sim | Load se measurementId | Eventos, uid, path, FID | Cookies GA4 **prováveis** + IDB Installations | Não (produto funciona sem) | Principal não essencial |
| Firebase Installations | FID para Analytics | Indireto | Com Analytics | FID | IndexedDB | Só com Analytics | |
| Google Fonts | Tipografia | Sim | Toda página (`index.css` + preconnect em `index.html`) | IP, User-Agent para Google | Cookies de fonte: **não confirmados**; transferência a Google sim | Visual | Outfit + Manrope |
| Google Sign-In | OAuth | Sim | Clique no botão | Conta Google | Cookies Google.com | Só se o usuário escolher | Popup |
| YouTube | Vídeo LP | Iframe futuro | Se `videoUrl` setado | IP, comportamento no player | Cookies YT **prováveis** | Não no go-live atual | Vazio hoje |
| Stripe Checkout | Pagamento | Redirect | Upgrade (quando gate on) | E-mail/plano via sessão server-side | Cookies Stripe no domínio Stripe | Não no go-live pago-off | Sem Stripe.js |
| Resend | E-mail | Não | Fila server-side | Destinatário, conteúdo | N/A no browser | Transacional | Backend only |
| axios | HTTP | **Não usado** em `src/` | — | — | — | Não | Só `package.json` |

### 13.2 Recursos externos estáticos vs serviços

| Recurso | Tipo |
|---------|------|
| `fonts.googleapis.com` / `fonts.gstatic.com` | Fonte (terceiro que recebe request do visitante) |
| `www.googletagmanager.com/gtag/js` | **Serviço de analytics** (se Analytics init) |
| `*.cloudfunctions.net` | API própria (Google Cloud) |
| Firebase/Google APIs | Backend do produto |
| Unsplash em `src/fixtures/*` | **Não importado** por páginas de produção (fixtures órfãos) |
| `@emergentbase/visual-edits` | Só `craco` em `NODE_ENV !== production` |

Não há GTM container, Meta Pixel, Ads tag, Sentry, Mixpanel, PostHog, Hotjar, Clarity.

---

## 14. Política atual × implementação

Arquivo: `src/pages/PrivacyPolicy.jsx` — última atualização **3 de junho de 2026**.  
Termos: `src/pages/TermsOfUse.jsx` — mesma data.  
Versões de aceite: `LEGAL_VERSIONS` terms/privacy `1.0`.

### Lacunas (implementação real vs texto)

| Tema | Política hoje | Código |
|------|---------------|--------|
| Analytics | “Não utilizamos ferramentas de analytics de marketing…” | Firebase Analytics/GA4 implementado; eventos de produto + possível page_view com querystring |
| Cookies | Apenas “estritamente necessários”; “não utilizamos cookies de marketing/publicidade” | Nenhum cookie 1P no código; **gtag pode criar cookies de analytics** se measurementId no bundle. `allow_google_signals` não foi desligado |
| Storage | Não detalha IndexedDB Auth nem `sessionStorage` | Auth IDB + 2 chaves sessionStorage (uma com e-mail) |
| Pré-lançamento | Não menciona nome, e-mail, WhatsApp, profissão, marketingConsent, UTMs, referrer | Coleção `prelaunchLeads` |
| Google Fonts | Não mencionado | Carregado em todas as rotas |
| Stripe | Não mencionado | Checkout redirect (gate off no go-live) |
| Resend | Não mencionado | E-mail transacional |
| Embed | Projetos públicos descritos de forma genérica | Embed em site de terceiros + mesmo SPA/Analytics |
| Base legal marketing | Consentimento genérico | `marketingConsent` / `marketingPreferences` no cadastro e LP |

Isto **não** é parecer jurídico. É desalinhamento documentação ↔ produto.

### Consentimento legal vs cookies

| Mecanismo | O que é | O que **não** é |
|-----------|---------|-----------------|
| `LegalConsentCheckbox` (SignUp) + `LegalConsentGate` (app autenticado) | Aceite de Termos + Política, versionado no Firestore | Consentimento de cookies/analytics |
| Checkbox marketing (SignUp, modal Google, LP) | Opt-in de e-mail/comunicação | Consentimento de cookies |
| Nenhum banner / CMP | — | Não há recusa de Analytics |

Os dois eixos são independentes. Aceitar Termos **não** substitui opt-in de cookies não essenciais.

---

## 15. Matriz por tecnologia

| Tecnologia | Tipo de storage | Fornecedor | Finalidade | Página/rota | Quando inicia | Dados | Persistência | Terceiro? | Classificação | Antes de consentimento? | Recomendação |
|------------|-----------------|------------|------------|-------------|---------------|-------|--------------|-----------|---------------|-------------------------|--------------|
| Firebase Auth | INDEXED_DB (+ LOCAL/SESSION fallback) | Google | Sessão | Todas (bootstrap) | Load do app; dados de user após login | uid, tokens, e-mail | Até logout / limpar site | Sim (operador) | STRICTLY_NECESSARY | Init sim; PII de sessão após login | Documentar; não bloquear com banner |
| Firestore | Memória (SDK) | Google | Dados do produto | Onde houver fetch | Uso | Docs do usuário/público | Sessão de página | Sim | STRICTLY_NECESSARY | Sim (necessário) | Documentar como infraestrutura |
| Firebase Storage | N/A (URLs) | Google | Mídia | Viewer, share, embed | Ao exibir/upload | Arquivos | Servidor | Sim | STRICTLY_NECESSARY | Sim | Documentar |
| Firebase Analytics / gtag | COOKIE (provável) + INDEXED_DB (FID) | Google | Métricas | Todas se enabled | Primeiro page_view / setUserId | Eventos, uid, path | Cookies GA4 ~longa duração (docs Google) | Sim | ANALYTICS | **Sim, sem opt-in** | Desligar no go-live **ou** init após aceite |
| Firebase Installations | INDEXED_DB | Google | FID | Com Analytics | Com Analytics | FID | Persistente | Sim | ANALYTICS | Com Analytics | Segue Analytics |
| `fivi360.verifyEmailSent` | SESSION_STORAGE | FIVI360 | UX pós-signup | `/verify-email-sent` | Após cadastro e-mail | e-mail | Aba | Não | STRICTLY_NECESSARY | Após signup | Documentar (PII em sessionStorage) |
| `fivi360_viewer_hint_seen` | SESSION_STORAGE | FIVI360 | UX viewer | Viewer / embed / público | Primeira interação/hint | flag `"1"` | Aba | Não | FUNCTIONAL | Sim | Documentar; baixo risco |
| Google Fonts | Request HTTP | Google | Fonte | Todas | Parse CSS | IP/UA | N/A (não confirmado cookie) | Sim | FUNCTIONAL | Sim | Documentar; opcional self-host (P2) |
| YouTube embed | COOKIE (provável, domínio YT) | Google | Vídeo LP | LP | Se `videoUrl` setado | IP, player | Cookies YT | Sim | MARKETING / mídia | Sim, se ativado | nocookie + click-to-load |
| Stripe Checkout | COOKIE no domínio Stripe | Stripe | Pagamento | `/plan` → redirect | Só checkout | Dados de pagamento no Stripe | Stripe | Sim | STRICTLY_NECESSARY (pagamento) | Não no FIVI360; no Stripe após redirect | Fora do go-live pago-off |
| Resend | N/A browser | Resend | E-mail | Backend | Envio | Destinatário | Servidor Resend | Sim | STRICTLY_NECESSARY (transacional) | N/A | Documentar operador |
| UTM / referrer LP | Nenhum (URL + submit) | FIVI360 | Atribuição campanha | LP | Submit | UTMs, referrer, path | Firestore lead | Não (até o submit) | FUNCTIONAL | Dados só após envio do form* | Documentar; ≠ cookie. *GA4 pode ver query antes se Analytics on |
| marketingConsent | Firestore | FIVI360 | E-mail marketing | SignUp / LP / gate Google | Submit / aceite | boolean + metadados | Conta / lead | Não | MARKETING (comunicação) | Opt-in explícito | Já separado de cookies |
| Pannellum | Nenhum encontrado | OSS local | Viewer 360 | Viewer/share/embed/demo | Mount | — | — | Não (bundle) | STRICTLY_NECESSARY | Sim | OK |

**Exige avaliação de consentimento?** ver secção 17.

---

## 16. Matriz por rota

Auth/Firestore/Analytics = SDK global, não o guard da rota.  
Analytics = “sim” **se** measurementId no bundle.

| Rota | Auth SDK | Firestore / Functions | Analytics | Terceiros extra | Storage | Consent concern |
|------|----------|----------------------|-----------|-----------------|---------|-----------------|
| `/` | Sim | Demo pública se `projectId` real | Sim + `view_landing` | Fonts | Hint se demo viewer | Analytics |
| `/lp/acesso-antecipado` | Sim | Callable no submit | Sim (`page_view`) | Fonts; YT se videoUrl | Não (UTM na URL) | Analytics; form PII no submit |
| `/lp/acesso-antecipado/sucesso` | Sim | Não | Sim | Fonts; links sociais se config | Não | Analytics |
| `/login` | Sim | Perfil pós-login | Sim; `login` | Fonts; Google OAuth se clicado | Auth IDB | Analytics; OAuth |
| `/register` | Sim | Cria perfil | Sim; `sign_up` | Fonts | sessionStorage e-mail após fluxo | Analytics; marketingConsent ≠ cookies |
| `/forgot-password` | Sim | Callable reset | Sim | Fonts | — | Analytics |
| `/verify-email` / `.../action` / reset | Sim | Auth actions | Sim | Fonts | — | Analytics |
| `/verify-email-sent` | Sim | — | Sim | Fonts | sessionStorage e-mail | Analytics + PII session |
| `/share/project/:id` (+ image, standalone, legacy) | Sim | Leitura pública | Sim + view_360 | Fonts, Storage | Hint | Analytics em página pública |
| `/embed/:id` (+ image) | Sim | Function HTTP | **page_view sim** | Fonts, Storage | Hint | **Alto se Analytics on** (site terceiro) |
| `/u/:slug` (+ project/image) | Sim | Público + stats | Sim + portfolio events | Fonts, Storage | Hint | Analytics |
| `/termos` `/privacidade` | Sim | — | Sim | Fonts | — | Analytics em páginas legais |
| `/dashboard` `/projects` `/projects/:id` `/images` `/viewer/:imageId` `/settings` `/plan` `/help` | Sim + LegalConsentGate | Sim | Sim + eventos de produto | Fonts; Stripe só no checkout | Auth IDB; hint no viewer | Analytics pós-login; aceite legal ≠ cookies |

Outras rotas reais: `/projects/new`, `/pricing` → `/plan`, `/share/image/:imageId` (redirect).

---

## 17. Classificação técnica

| Tecnologia | Classe | Exige avaliação de consentimento? |
|------------|--------|-----------------------------------|
| Firebase Auth persistence | STRICTLY_NECESSARY | NÃO |
| Firestore / Storage / Functions de produto | STRICTLY_NECESSARY | NÃO |
| sessionStorage verify-email | STRICTLY_NECESSARY | NÃO (documentar PII) |
| sessionStorage hint viewer | FUNCTIONAL | NÃO |
| Google Fonts | FUNCTIONAL | REVISAR (transferência a Google; sem evidência de cookie de ads) |
| Firebase Analytics / gtag / FID | ANALYTICS | **SIM** |
| UTMs no submit do lead | FUNCTIONAL | NÃO (informar na política) |
| UTMs via `page_view` GA4 | ANALYTICS | SIM (só se Analytics on) |
| marketingConsent e-mail | MARKETING (comunicação) | SIM (já coletado como opt-in; **não** é cookie) |
| YouTube embed (quando houver) | MARKETING / mídia terceira | **SIM** |
| Stripe Checkout (quando houver) | STRICTLY_NECESSARY (pagamento) | NÃO no FIVI360; Stripe na página deles |
| Resend | STRICTLY_NECESSARY (e-mail) | NÃO (browser) |
| Pannellum | STRICTLY_NECESSARY | NÃO |
| Pixels Meta/TikTok/GTM/etc. | — | N/A (não existem) |

---

## 18. Necessidade de consentimento

### Cenário escolhido

**CENÁRIO B** se o build de produção contiver `REACT_APP_FIREBASE_MEASUREMENT_ID`.  
**CENÁRIO A** (só documentação) se Analytics **não** for embutido no go-live e YouTube permanecer desligado.

Não é **CENÁRIO C**: não há múltiplos trackers de marketing.

Tecnologias que puxam B: **único tracker não essencial confirmado no código = Firebase Analytics (GA4/gtag)**, em **todas** as rotas, **incluindo embed**.

### Preferência de cookies (conceitual — sem schema definitivo)

Se no futuro houver consentimento de analytics:

- **localStorage** (SPA): não viaja em todo request HTTP; suficiente para gate de `getAnalytics`. Auth já usa IDB; mais uma chave 1P é coerente.
- **Cookie 1P:** útil se algum dia o servidor precisar ler a preferência; hoje o gate seria 100% cliente.

Não definir schema nesta auditoria. `necessary` sempre true; `analytics` default false até aceite.

Aceite de Termos **não** deve ser reutilizado como aceite de analytics.

---

## 19. Riscos

### P0

Nenhum. Não há vazamento de secrets no HTML, pixel oculto de ads, keylogger, ou cookie de marketing próprio.

### P1

1. **Analytics automático sem consentimento** se measurementId entrar no bundle de produção — inclusive `/embed/*`.
2. **Política de Privacidade desatualizada** vs GA4, storage, LP, Fonts, operadores Stripe/Resend.
3. **Build local** pode vazar measurementId para produção via `.env.local` (CRA).

### P2

4. Google Fonts (terceiro Google em todas as páginas).
5. Auth SDK inicializado em rotas 100% públicas/embed (IDB possível sem login).
6. `page_view` envia querystring (UTMs) ao GA4.
7. YouTube, quando ativado, sem nocookie / sem click-to-load.
8. gtag defaults de advertising signals não desligados no código.

### P3

9. CMP completa / Consent Mode v2.
10. Self-host de fontes.
11. Separar bundle embed sem Analytics/Auth.
12. Eventos LP sociais ainda não instrumentados (quando o forem, reavaliar).

---

## 20. Recomendação para go-live

**Solução mais simples compatível com o código atual:**

1. **Não embutir `REACT_APP_FIREBASE_MEASUREMENT_ID` no build de produção** (CI/env de release). O serviço já no-op sem a variável. Auth/Firestore/Storage seguem iguais.
2. **Atualizar Política de Privacidade** (e, se couber, Termos) **depois** desta auditoria — fora do escopo deste documento — cobrindo: Firebase Auth IndexedDB, sessionStorage, Google Fonts, formulário de pré-lançamento, atribuição UTM/referrer, Analytics **desligado nesta versão** (ou ligado com consentimento, se mudarem a decisão), Stripe/Resend como operadores.
3. **Não implementar banner** no primeiro go-live se o passo 1 for cumprido.
4. Manter YouTube desligado até haver nocookie e/ou clique-para-carregar.
5. Pagamentos já gateados: Stripe não entra no navegador.

Se o time **quiser Analytics no dia 1:** consentimento simples (Aceitar / Recusar analytics) **antes** de `getAnalytics`. Não precisa CMP de categorias múltiplas agora.

---

## 21. Arquivos que precisariam mudar

**Nada foi alterado agora.** Lista para um ciclo futuro:

### Desligar Analytics (ops, sem código)

- Ambiente de **build de produção** / CI: omitir `REACT_APP_FIREBASE_MEASUREMENT_ID`
- Conferir que o bundle não contém o measurementId nem `googletagmanager.com/gtag`

### Consent-gate de Analytics (se mantiverem GA4)

- `src/services/analytics/analyticsService.js` — não chamar `getAnalytics` sem opt-in; opcional `initializeAnalytics` com `send_page_view: false` e signals off
- `src/components/analytics/AnalyticsRouteTracker.jsx`
- `src/contexts/AuthContext.jsx` (`setAnalyticsUser`)
- Novo ponto de UI (banner) + persistência da preferência — **não criado**
- Opcional: `src/index.js` / `App.js` para Consent Mode default `denied`

Call sites de `trackEvent` podem permanecer: o serviço já falha em silêncio.

### YouTube (quando houver vídeo)

- `src/landing-pages/access-early/config.js` (URL)
- `src/landing-pages/access-early/sections/AccessEarlyVideo.jsx`

### Política / Termos (conteúdo legal, outro ciclo)

- `src/pages/PrivacyPolicy.jsx`
- `src/pages/TermsOfUse.jsx` (se mencionar operadores)
- `src/config/legal.js` (bump de versão se o aceite autenticado precisar ser refeito)

**Não** é necessário mudar Firebase console, `firebase.json`, `package.json`, Functions, ou Stripe para o caminho mínimo.

---

## 22. Pendências futuras

- [ ] Confirmar no pipeline de deploy se measurementId entra no bundle
- [ ] Decidir: Analytics off no go-live **vs** consent simples
- [ ] Redigir Política alinhada a esta matriz (jurídico + produto)
- [ ] YouTube: nocookie + interação
- [ ] Opcional: self-host fontes
- [ ] Opcional: não inicializar Analytics/Auth no shell de `/embed`
- [ ] Quando `PAID_CHECKOUT_ENABLED=true`, mencionar Stripe na política
- [ ] Não tratar `marketingConsent` como consentimento de cookies
- [ ] Reauditoria se GTM, Ads ou pixels forem adicionados

---

## 23. Respostas objetivas (go-live)

1. **O FIVI360 usa cookies hoje?** Não no código próprio. Cookies **prováveis** só via gtag (se Analytics ativo), Google OAuth, YouTube (se embed) ou Stripe (se checkout).
2. **Quais estão confirmados?** Nenhum nome de cookie no repositório.
3. **Usa browser storage além de cookies?** Sim: IndexedDB Auth (SDK); sessionStorage (`fivi360.verifyEmailSent`, `fivi360_viewer_hint_seen`); IndexedDB Installations se Analytics ligar.
4. **Firebase Analytics está ativo?** Implementado: **SIM**. Runtime: **somente com measurementId no bundle e emuladores off**. Dev com emuladores: **NÃO**.
5. **Analytics inicia antes de consentimento?** **SIM**, quando enabled — não há consentimento de cookies.
6. **Trackers de marketing?** **NÃO** (pixels/GTM/Ads). Analytics de produto ≠ pixel de ads; gtag advertising defaults **não** foram desligados (REVISAR se GA4 for ao ar).
7. **YouTube é preocupação quando ativarmos o vídeo?** **SIM** (iframe imediato + youtube.com, sem nocookie).
8. **Stripe cria algo no navegador antes do checkout?** **NÃO**. Com pagamentos off, nem chega a criar sessão.
9. **A LP usa cookies para UTM?** **NÃO**. URL + `document.referrer` no submit → Firestore.
10. **Precisamos tecnicamente de banner no primeiro go-live?** **DEPENDE.** Não, se Analytics ficar fora do bundle. Sim (simples), se GA4 for publicado.
11. **Podemos lançar sem Analytics temporariamente?** **SIM.** Basta não definir measurementId no build; o código já no-op.
12. **A Política está coerente com a implementação?** **NÃO** (lacunas na secção 14).
13. **P0 de privacidade?** **Nenhum.**

---

*Fim da auditoria AUDIT-COOKIES-PRIVACY-1. Somente leitura.*
