# Auditoria Pré-Deploy Beta — FIVI360

**Data:** 18 de julho de 2026  
**Versão analisada:** `fivi360@1.0.2`  
**Escopo:** leitura apenas — nenhum arquivo de aplicação foi alterado nesta auditoria  
**Projeto Firebase:** `fivi360` (`.firebaserc`)  
**Stack real:** React 19 + CRA/Craco + Firebase (Auth, Firestore, Storage, Hosting, Functions) + Stripe + Resend  

> **Nota:** A auditoria anterior em `docs/pre-production-audit.md` (jun/2026) está parcialmente desatualizada. Storage rules e o split `users` / `publicProfiles` já foram corrigidos. Este documento reflete o código atual.

---

## 1. Resumo executivo

O FIVI360 v2 está **funcionalmente maduro** para um beta controlado: rotas SPA com guards, compartilhamento público por ID de documento, portfólio `/u/:slug`, viewer 360°, hotspots (info/scene), planos com enforcement em services, Stripe checkout/cancel/webhook e e-mails via fila.

Os principais riscos para deploy em produção concentraram-se em:

1. **Limites de plano e entitlements pagáveis apenas no cliente** — rules permitem ao owner gravar `users.plan`, `billing` e `publicProfiles.portfolioAvailable`.
2. **`APP_BASE_URL` das Cloud Functions com fallback `http://localhost:3000`** — checkout e links de e-mail quebram se a variável não estiver definida em produção.
3. **Recriação do único usuário** — links `/share/project/{projectId}` sobrevivem **somente** se os document IDs de `projects` e `images` forem preservados; paths de Storage e URLs de download dependem do UID e precisam ser migrados.
4. **`deleteImage` não remove hotspots** — gera órfãos e navegação quebrada no viewer público.

**Recomendação:** **No-Go para beta público aberto.** **Go condicional para beta fechado** (usuários de confiança), desde que: (a) `APP_BASE_URL` e secrets Stripe/Resend estejam corretos; (b) rules/indexes/functions/hosting sejam deployados juntos; (c) a recriação do usuário siga o procedimento de preservação de IDs deste relatório.

---

## 2. Status geral do projeto

| Área | Status | Comentário |
|------|--------|------------|
| Arquitetura frontend | Bom | Services → hooks → pages; AuthContext único |
| Firestore model | Bom | Top-level `projects` / `images`; `publicProfiles` + `slugs` |
| Links públicos `/share/*` | Bom | Baseados em document ID — estáveis se IDs forem preservados |
| Portfólio `/u/:slug` | Bom | Depende de `slugs.uid` + `portfolioAvailable` |
| Storage rules | Bom | Owner-only em `users/{uid}/**` |
| Firestore rules (isolamento) | Bom | Owner + visibility; invoices/subscriptions client-deny |
| Firestore rules (planos) | Crítico | Sem proteção de campos administrativos |
| Stripe | Bom (servidor) | Auth + signature; portal do cliente ainda stub |
| Limites de plano | Frágil | Só `planService` no cliente |
| Auth / consentimento | Bom | Verify email + `LegalConsentGate` |
| Deploy pipeline | Parcial | `yarn deploy` = só Hosting; Functions/rules separados |
| Testes | Parcial | Vários unit tests; sem E2E |
| README | Desatualizado | Ainda fala Mongo/FastAPI/Vite |

---

## 3. Bloqueadores de deploy

| # | Bloqueador | Severidade | Bloqueia beta público? | Bloqueia beta fechado? |
|---|------------|------------|----------------------|------------------------|
| B1 | Owner pode gravar `plan` / `billing` / `portfolioAvailable` via SDK | Crítico | Sim | Não* |
| B2 | Limites (projetos/imagens/storage/hotspots/public) só no cliente | Crítico | Sim | Não* |
| B3 | `APP_BASE_URL` default localhost nas Functions | Crítico | Sim | Sim |
| B4 | `.env.production` não contém `REACT_APP_FIREBASE_*` — dependência total do ambiente de build | Alto | Sim (se omitidos) | Sim (se omitidos) |
| B5 | Procedimento de recriação sem preservação de `projectId`/`imageId` quebra links já enviados a clientes | Crítico (ops) | Sim** | Sim** |

\*Aceitável em beta fechado com um único usuário de confiança.  
\*\*Só se houver links já compartilhados — neste caso é bloqueador operacional até a migração correta.

---

## 4. Riscos críticos

### C-01 — Manipulação de plano e billing pelo cliente

| Campo | Valor |
|--------|--------|
| **Severidade** | Crítico |
| **Descrição** | `firestore.rules` permite `allow update: if isOwner(userId)` em `users/{userId}` sem restrição de campos. O mesmo ocorre em `publicProfiles` para `portfolioAvailable`. |
| **Impacto** | Usuário autenticado pode setar `plan: { id: "studio", status: "active" }` ou `portfolioAvailable: true` e liberar hotspots, portfólio e quotas sem pagar. |
| **Cenário** | Console do navegador / REST Firestore com token Auth válido. |
| **Arquivo** | `firestore.rules` L363–370, L271–272; leitura efetiva em `src/services/plans/planService.js` L119–130 |
| **Recomendação** | Proibir updates de `plan`/`billing` no cliente; gravar só via Admin SDK (webhook/callable). Validar `portfolioAvailable` server-side ou recalcular apenas nas Functions. |
| **Bloqueia deploy?** | Beta público: **sim**. Beta fechado: **não** (risco residual baixo). |

### C-02 — Limites de plano só no frontend/services

| Campo | Valor |
|--------|--------|
| **Severidade** | Crítico |
| **Descrição** | `assertCanCreateProject`, `assertCanUploadImage`, `assertHotspotsEnabled`, `assertPublicVisibilityEnabled` rodam apenas em services. Rules de `projects`/`images`/`hotspots` não consultam plano nem contadores. |
| **Impacto** | Bypass de quotas e features premium via writes diretos. |
| **Cenário** | Cliente SDK cria N projetos/imagens ou hotspots além do Starter. |
| **Arquivo** | `src/services/plans/planService.js`; `src/config/planLimits.js`; `firestore.rules` L387–520 |
| **Recomendação** | Cloud Functions callable para mutações sensíveis **ou** rules com `get(users/$(uid)).data.plan` + contadores. Storage: limites de tamanho nas rules. |
| **Bloqueia deploy?** | Beta público: **sim**. Beta fechado: **não**. |

### C-03 — `APP_BASE_URL` com fallback localhost

| Campo | Valor |
|--------|--------|
| **Severidade** | Crítico |
| **Descrição** | `functions/src/config/app.js` usa `process.env.APP_BASE_URL \|\| "http://localhost:3000"`. Checkout success/cancel e links de e-mail dependem disso. |
| **Impacto** | Após pagamento, Stripe redireciona para localhost; e-mails de verificação/reset apontam para URL errada. |
| **Cenário** | Deploy de Functions sem definir `APP_BASE_URL=https://fivi360.com.br` (ou domínio oficial). |
| **Arquivo** | `functions/src/config/app.js` L8–9; `functions/src/createStripeCheckoutSession.js` |
| **Recomendação** | Definir `APP_BASE_URL` em produção **antes** do deploy das Functions; idealmente falhar o boot se ausente em produção. |
| **Bloqueia deploy?** | **Sim** (qualquer beta que use Stripe ou e-mail). |

### C-04 — Recriação do usuário sem preservar document IDs

| Campo | Valor |
|--------|--------|
| **Severidade** | Crítico (operacional) |
| **Descrição** | Links públicos usam `projectId` / `imageId` (document IDs do Firestore), gerados via `addDoc` / `doc(collection())`. Não há `shareId`/`token`. |
| **Impacto** | Se projetos forem recriados com `addDoc`, **todos** os links já enviados a clientes externos quebram. |
| **Cenário** | Excluir usuário → signup → criar projetos de novo pela UI. |
| **Arquivo** | `src/utils/publicAccess.js` L126–153; `src/services/projects/projectService.js` L199–212; `src/services/images/imageService.js` L480–521 |
| **Recomendação** | Seguir §17: exportar IDs, recriar com `setDoc` nos mesmos IDs, atualizar `userId`/`workspaceId`, migrar Storage. |
| **Bloqueia deploy?** | **Sim**, se existirem links externos ativos e a migração não for feita corretamente. |

### C-05 — Tokens de download URL sobrevivem à revogação de visibilidade

| Campo | Valor |
|--------|--------|
| **Severidade** | Crítico (privacidade) / documentado |
| **Descrição** | `previewUrl`/`originalUrl` são `getDownloadURL()` com token de longa duração. Storage rules owner-only **não** invalidam esses tokens. |
| **Impacto** | Quem guardou a URL continua baixando o panorama após tornar o projeto privado. |
| **Cenário** | Share → cliente copia URL do Storage → owner volta para private. |
| **Arquivo** | `storage.rules` L13–17; `src/services/images/imageService.js` (upload); `docs/security-rules-notes.md` |
| **Recomendação** | Aceitar como trade-off do beta **ou** migrar para signed URLs curtas / proxy via Function. Ao recriar usuário, tokens antigos deixam de apontar se o arquivo for movido/regenerado. |
| **Bloqueia deploy?** | Beta fechado: **não** (consciente). Beta público amplo: **avaliar**. |

---

## 5. Riscos altos

### A-01 — Visibilidade `public`/`shared` sem gate de plano nas rules

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto |
| **Descrição** | Services checam plano para `visibility: public`; rules aceitam qualquer `isValidVisibility`. `shared` é permitido no Starter por design. |
| **Impacto** | Bypass de portfólio público via update direto. |
| **Arquivo** | `firestore.rules` L387–399; `projectService.js` L193–195 |
| **Recomendação** | Rules condicionarem `public` ao plano (via `get(users)`) ou Functions. |
| **Bloqueia deploy?** | Público: sim (junto com C-01/C-02). Fechado: não. |

### A-02 — Checkout success sync só reconhece Professional

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto |
| **Descrição** | `useCheckoutSuccessSync` só trata sucesso quando `planId === "professional"`. Studio nunca passa → timeout de 20s e mensagem ambígua. |
| **Impacto** | UX quebrada após upgrade Studio; plano pode já estar ativo no Firestore. |
| **Arquivo** | `src/hooks/useCheckoutSuccessSync.js` L85 |
| **Recomendação** | Aceitar qualquer plano pago ativo (`professional` \| `studio`) ou o `planId` esperado do checkout. |
| **Bloqueia deploy?** | Se Studio estiver habilitado (`REACT_APP_STRIPE_STUDIO_CHECKOUT=true`): **sim** para qualidade. Caso contrário: médio. |

### A-03 — Storage path e download URLs dependem do UID

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto (ops) |
| **Descrição** | Path: `users/{userId}/images/{imageId}.webp`. Após novo UID, arquivos no path antigo ficam inacessíveis ao app (rules owner-only) e URLs antigas no Firestore apontam para o path/UID antigo. |
| **Impacto** | Viewer quebrado se só atualizar Firestore sem migrar Storage e regenerar URLs. |
| **Arquivo** | `imageService.js` `getImageStoragePath`; `docs/storage-architecture.md` |
| **Recomendação** | No procedimento de recriação: copiar objetos para `users/{newUid}/images/{sameImageId}.webp`, atualizar `storagePath`/`originalUrl`/`previewUrl`/`coverImage`. |
| **Bloqueia deploy?** | Só se a migração for feita de forma incompleta. |

### A-04 — `deleteImage` não remove hotspots

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto |
| **Descrição** | `deleteImage` remove Storage + doc da imagem; **não** chama `deleteAllHotspotsForImage` nem limpa scene hotspots incoming. `deleteProjectCascade` e `moveImageToUnassigned` fazem o contrário. |
| **Impacto** | Subcoleção órfã; hotspots scene no viewer público levam a destino inexistente. |
| **Arquivo** | `imageService.js` ~L395–456; contraste `projectService.js` cascade; `hotspotService.js` |
| **Recomendação** | Espelhar cascade do move/delete projeto em `deleteImage`. Filtrar hotspots com target ausente no viewer. |
| **Bloqueia deploy?** | Não (bug conhecido; mitigar em hotfixes do beta). |

### A-05 — Workspace `planId` atualizável sem vínculo ao billing

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto |
| **Descrição** | Update de workspace exige `planId is string` sem amarrar ao plano real do usuário. |
| **Impacto** | Baixo hoje (limites leem `users.plan`); risco futuro se gates migrarem para workspace. |
| **Arquivo** | `firestore.rules` L327–332 |
| **Recomendação** | Congelar `planId` no update ou sincronizar só via Admin. |
| **Bloqueia deploy?** | Não. |

### A-06 — Deploy Hosting-only vs Functions/rules

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto (ops) |
| **Descrição** | Script `deploy` = `firebase deploy --only hosting`. Rules/Functions/indexes precisam de deploy separado. |
| **Impacto** | Front novo com rules/functions antigas (ou o inverso). |
| **Arquivo** | `package.json` L64; `firebase.json` |
| **Recomendação** | Checklist de deploy: `firestore:rules`, `firestore:indexes`, `storage`, `functions`, `hosting` nesta ordem lógica. |
| **Bloqueia deploy?** | Não se o checklist for seguido. |

### A-07 — Stripe Customer Portal e `subscription.updated` ausentes

| Campo | Valor |
|--------|--------|
| **Severidade** | Alto (produto) / Médio (técnico) |
| **Descrição** | `createBillingPortalSession` retorna stub. Webhook não trata `customer.subscription.updated`. |
| **Impacto** | Mudanças mid-cycle no Stripe Dashboard podem dessincronizar; gestão de cartão limitada ao cancel callable. |
| **Arquivo** | `billingService.js`; `stripeWebhook.js` |
| **Recomendação** | Documentar no beta; implementar portal + event `updated` antes de escala. |
| **Bloqueia deploy?** | Não para beta fechado. |

---

## 6. Riscos médios

| ID | Problema | Impacto | Arquivo | Bloqueia? |
|----|----------|---------|---------|-----------|
| M-01 | `LegalConsentGate`: falha em `getUserFirestoreData` sem try/catch → loading infinito | Usuário preso na tela de loading | `LegalConsentGate.jsx` | Não |
| M-02 | Google signup sem checkbox de termos no formulário (mitigado pelo gate) | Lacuna jurídica se gate falhar | `SignUp.js` | Não |
| M-03 | Cliente pode enfileirar e-mails (`emailQueue`) dos tipos permitidos | Custo Resend / spam a si mesmo | `firestore.rules` L227–237 | Não |
| M-04 | Password reset callable unauth + throttle 60s | Abuse leve de e-mail | `requestPasswordResetEmail` | Não |
| M-05 | Storage sem limite de tamanho/content-type nas rules | Abuse de quota | `storage.rules` L34–36 | Não |
| M-06 | Inflação de `stats` (incrementos anônimos) | Métricas distorcidas | `firestore.rules` stats | Não |
| M-07 | Hotspot placement só com mouse (`mousedown`/`mouseup`) | Editor frágil em mobile/touch | `PanoramaViewer.jsx` | Não |
| M-08 | Sem lazy loading de rotas; `recharts` não usado no `src` | Bundle maior | `App.js`; `package.json` | Não |
| M-09 | README / docs desatualizados (Mongo, Vite, rotas antigas) | Confusão operacional | `README.md` | Não |
| M-10 | `.env.production` versionável (só emulators=false) — risco se alguém colocar secrets | Vazamento | `.gitignore` não ignora `.env.production` | Não* |
| M-11 | Sem exclusão de conta (LGPD self-serve) | Compliance | — | Não (documentar) |
| M-12 | ~~Mercado Pago ainda em config~~ **Resolvido em RC-CLEANUP-LEGACY-1** — Stripe único provider; sem `REACT_APP_MP_*` | — | `billing.js`, `.env.example` | Sim (limpo) |
| M-13 | `slugs` update negado — troca de slug exige delete+create (já tratado no service) | OK se service correto | `firestore.rules` L253 | Não |
| M-14 | Índice composto ausente para `projects` `userId`+`visibility` (query portfólio) | Pode falhar com `failed-precondition` se Firestore exigir | `projectService.js` L365–369; `firestore.indexes.json` | Validar em prod |

\*Adicionar `.env.production` ao gitignore se for conter secrets; hoje só tem flag de emulador.

---

## 7. Melhorias não bloqueadoras

1. Lazy `React.lazy` nas páginas de `App.js`.
2. Remover `recharts` e `axios` se não usados.
3. Remover `src/fixtures/` (código morto).
4. Touch handlers no modo criação de hotspot.
5. Filtrar scene hotspots com `targetImageId` inexistente no viewer público/privado.
6. Tratar falhas de load do portfólio como `load_failed` (hoje mapeia tudo para `not_found`).
7. App Check no Firebase.
8. Customer Portal Stripe.
9. Atualizar README para refletir Firebase-only.
10. Script único de deploy full (hosting + functions + rules).
11. Conta: fluxo de exclusão com cascade documentado.
12. Testes E2E dos fluxos públicos `/share/*`.

---

## 8. Mapa da estrutura do Firestore

### 8.1 Coleções

| Caminho | Finalidade | Campos principais | Obrigatórios (prática) | Depende de UID? | Depende de projectId? | Depende de imageId? |
|---------|------------|-------------------|------------------------|-----------------|----------------------|---------------------|
| `users/{uid}` | Perfil privado, plano, billing, legal | `displayName`, `email`, `plan`, `billing`, `legalConsent`, `defaultWorkspaceId`, `activeWorkspaceId`, `welcomeEmailQueuedAt`, timestamps | create: owner | **Doc ID = UID** | Não | Não |
| `publicProfiles/{uid}` | Perfil público portfólio | `uid`, `slug`, `portfolioEnabled`, `portfolioAvailable`, `displayName`, `companyName`, `companyLogo`, `bio`, `socialLinks` | `uid` | **Doc ID = UID** | Não | Não |
| `slugs/{slug}` | Resolução `/u/:slug` | `uid`, `type: "user"`, timestamps | `uid`, `type` | Via campo `uid` | Não | Não |
| `workspaces/{uid}` | Workspace pessoal | `ownerId`, `name`, `type`, `planId` | create: `workspaceId == uid` | **Doc ID = UID** | Não | Não |
| `workspaces/{uid}/members/{uid}` | Membership | `userId`, `role`, `status` | bootstrap owner | Sim | Não | Não |
| `projects/{projectId}` | Projetos | `userId`, `workspaceId`, `title`, `description`, `clientName`, `visibility`, `coverImage`, `imageCount`, timestamps | `userId`, `title`, `visibility`, … | Campo `userId` | **Doc ID = link público** | Não |
| `images/{imageId}` | Panoramas | `userId`, `workspaceId`, `projectId`, `title`, URLs, `storagePath`, `sizeBytes`, `visibility`, `projectVisibility`, dims, timestamps | vários | Campo `userId` | Campo | **Doc ID = link / hotspot target** |
| `images/{imageId}/hotspots/{hotspotId}` | Hotspots | `type`, `pitch`, `yaw`, `userId`, `imageId`, `projectId`, + `title`/`description` ou `targetImageId` | tipo + coords | Campo `userId` | Campo | Parent + `targetImageId` |
| `stats/{uid}` | Views portfólio | `portfolioViews`, `updatedAt` | — | Path | — | — |
| `stats/{uid}/projects/{projectId}` | Views projeto | `views` | — | Path | Path | — |
| `stats/{uid}/images/{imageId}` | Views imagem | `views` | — | Path | — | Path |
| `invoices/{stripeInvoiceId}` | Faturas | Stripe fields + `userId` | Admin write | Campo | Não | Não |
| `subscriptions/{uid}` | Espelho Stripe | `planId`, `status`, customer/sub IDs | Admin only | **Doc ID = UID** | Não | Não |
| `emailQueue/{id}` | Fila Resend | `type`, `to`, `userId`, `payload`, `status` | create client restrito | Campo | Não | Não |
| `passwordResetThrottle/{email}` | Throttle reset | `lastRequestedAt` | Admin | Indireto | Não | Não |

### 8.2 Leitores / escritores principais

| Coleção | Writers | Readers |
|---------|---------|---------|
| `users` | `userService`, Stripe Functions | Auth, plan, settings, billing |
| `publicProfiles` | `userService`, Stripe sync | `/u/:slug`, share header, settings |
| `slugs` | `slugService` via settings | `getPublicUserBySlug` |
| `projects` | `projectService` | dashboard, share, portfolio |
| `images` | `imageService` | viewer, share, portfolio |
| `hotspots` | `hotspotService` | Viewer + PublicImageViewer |
| `subscriptions` | Admin (Stripe) | Functions only |
| `invoices` | Admin (Stripe) | `invoiceService` (owner read) |

### 8.3 Compatibilidade estrutura antiga × atual

| Aspecto | Situação |
|---------|----------|
| Firestore projects/images | **Uma** estrutura top-level (não há `users/{uid}/projects`) |
| Perfil público | Migrado de campos em `users` → `publicProfiles` + `slugs` |
| Storage | Dual: novo `users/{uid}/images/{id}.webp` + legado `users/{uid}/projects/{pid}/images/{id}.webp` |
| Rotas share | Legacy `/share/image/:imageId` → redirect |
| Plano | String legada `"starter"` **ou** objeto `{ id, status, source }` |

### 8.4 Índices

Arquivo: `firestore.indexes.json`

- `projects`: `userId` ASC + `updatedAt` DESC  
- `images`: `userId` ASC + `projectId` ASC + `updatedAt` DESC  

**Atenção:** `getPublicProjectsByUserId` usa `userId` + `visibility == public` — validar em produção se o índice composto é exigido; se `failed-precondition`, adicionar índice antes do go-live.

### 8.5 Consultas que podem falhar silenciosamente / com pouco feedback

- Índice ausente: `getProjectsPageByUserId` loga `console.error` e rethrow.  
- Portfólio: catch genérico → `not_found`.  
- Owner no share: `getPublicUserById(...).catch(() => null)` — página funciona sem header do escritório.

---

## 9. Mapa do Storage

| Tipo | Path | Depende UID | Depende projectId | Depende imageId |
|------|------|-------------|-------------------|-----------------|
| Panorama (atual) | `users/{userId}/images/{imageId}.webp` | Sim | Não | Sim |
| Panorama (legado) | `users/{userId}/projects/{projectId}/images/{imageId}.webp` | Sim | Sim | Sim |
| Thumbnail | Não existe separado — mesmo WebP | — | — | — |
| Capa | Não é arquivo separado — `projects.coverImage` = download URL | Indireto | Indireto | Indireto |
| Avatar / logo | Campo `companyLogo` sem upload implementado | — | — | — |

**Rules:** `allow read, write: if isOwner(userId)` em `users/{userId}/{allPaths=**}`; resto negado.

**Riscos:** arquivos órfãos se Firestore for apagado sem Storage; sobrescrita controlada por `imageId`; upload interrompido pode deixar blob sem doc (e vice-versa em falha pós-upload); exclusão individual incompleta vs cascade de projeto.

**Impacto recriar usuário:** é **obrigatório** copiar/mover blobs para o novo UID (ou regenerar URLs com o mesmo arquivo no novo path) e atualizar campos URL no Firestore.

---

## 10. Mapa das rotas

| Rota | Tipo | Guard | Página |
|------|------|-------|--------|
| `/` | Marketing | `LandingRoute` | Landing |
| `/login` | Pública | `PublicRoute` | Login |
| `/register` | Pública | `PublicRoute` | SignUp |
| `/forgot-password` | Pública | `PublicRoute` | ForgotPassword |
| `/verify-email` | Auth parcial | `VerifyEmailRoute` | VerifyEmail |
| `/verify-email/action` | Pública | — | VerifyEmailAction |
| `/reset-password/action` | Pública | — | ResetPasswordAction |
| `/termos`, `/privacidade` | Pública | — | Legal |
| `/u/:slug` | Pública | — | PublicPortfolio |
| `/u/:slug/project/:projectId` | Pública | — | PublicPortfolioProject |
| `/u/:slug/project/:projectId/image/:imageId` | Pública | — | PublicPortfolioImage |
| `/share/project/:projectId` | Pública | — | PublicSharedProject |
| `/share/project/:projectId/image/:imageId` | Pública | — | PublicSharedProjectImage |
| `/share/standalone/:imageId` | Pública | — | PublicStandaloneImage |
| `/share/image/:imageId` | Legacy | — | LegacyShareImageRedirect |
| `/dashboard`, `/projects`, `/projects/new`, `/projects/:id`, `/images`, `/plan`, `/settings`, `/help` | Privada | `ProtectedRoute` + Layout (+ LegalConsentGate) | App |
| `/viewer/:imageId` | Privada | `ProtectedRoute` (sem Layout) | Viewer |
| `/pricing` | Redirect | — | → `/plan` |
| `*` | — | — | NotFound |

**Hosting:** rewrite SPA `**` → `/index.html` — refresh OK.  
**Guards:** auth loading → email verified (password) → legal consent.  
**Flash privado:** mitigado por `AuthLoadingScreen` / ProtectedRoute.

---

## 11. IDs que precisam ser preservados

Para manter links já compartilhados com clientes:

| ID | Onde aparece na URL / dados | Preservar? | Motivo |
|----|----------------------------|------------|--------|
| **`projectId`** (doc ID `projects`) | `/share/project/{projectId}`, `/u/.../project/{projectId}` | **Obrigatório** | É o identificador do link público do projeto |
| **`imageId`** (doc ID `images`) | `/share/.../image/{imageId}`, `/share/standalone/{imageId}`, hotspots `targetImageId` | **Obrigatório** | Links de imagem + navegação entre panoramas |
| **`hotspotId`** | Subcoleção (não está na URL pública típica) | Recomendado | Menos crítico para URL; útil para fidelidade do editor |
| **`slug`** (doc ID `slugs` + campo em `publicProfiles`) | `/u/{slug}` | **Obrigatório** se portfólio já divulgado | Retarget `slugs/{slug}.uid` → novo UID |
| **UID antigo** | Paths Storage, `userId` fields, `stats/{uid}`, `subscriptions/{uid}` | **Não preservar** (Auth gera novo) | Atualizar referências para o novo UID |
| **Stripe `customerId` / `subscriptionId`** | `users.billing`, `subscriptions` | Preservar vínculo se assinatura ativa | Reassociar ao novo UID ou cancelar/recriar no Stripe |
| **Download URL tokens** | `originalUrl`, `previewUrl`, `coverImage` | Não — **regenerar** após migrate Storage | Tokens antigos apontam path/UID antigo |

**Não existem:** `shareId`, `shareToken`, slug de projeto.

**Geração atual:** IDs de projeto/imagem/hotspot são **auto-gerados**. A UI normal **não** permite escolher ID — a preservação exige `setDoc(doc(db, "projects", oldId), …)` (Admin SDK ou script).

---

## 12. Impactos da recriação do usuário

| Área | Efeito |
|------|--------|
| Auth | Novo UID; e-mail pode ser reutilizado após delete |
| `users` / `publicProfiles` / `workspaces` | Docs com ID = UID precisam ser recriados |
| `projects` / `images` | Podem manter IDs se regravados com `setDoc`; atualizar `userId` e `workspaceId` |
| Hotspots | Atualizar `userId`; manter `targetImageId` se imageIds preservados |
| Storage | Paths sob UID antigo inacessíveis ao novo user → migrar arquivos |
| URLs Firestore | Regenerar `getDownloadURL` após migrate |
| Stats | Path `stats/{oldUid}` órfão; pode recomeçar ou migrar |
| Slug | `slugs/{slug}.uid` deve apontar para novo UID |
| Stripe | Customer fica no UID antigo no metadata; reassociar ou limpar |
| E-mail queue / invoices | Histórico antigo amarrado ao UID antigo |
| Links `/share/*` | **OK** se projectId/imageId preservados |
| Links `/u/:slug` | **OK** se slug retargeted e `portfolioAvailable` correto |
| Sessões / tokens Auth | Invalidam com delete |

Efeitos colaterais além do UID: perda de `subscriptions`/`invoices` se não migrados; perda de métricas; necessidade de reconsentimento legal; verificação de e-mail de novo (fluxo password).

---

## 13. Checklist de backup

Antes de qualquer exclusão:

- [ ] Export Auth: UID, e-mail, providers, `emailVerified`
- [ ] Export Firestore: `users/{uid}`, `publicProfiles/{uid}`, `slugs/{slug}`, `workspaces/{uid}` (+ members), **todos** `projects` onde `userId == uid`, **todas** `images` (+ subcoleção `hotspots`), `stats/{uid}` (+ subcols), `subscriptions/{uid}`, `invoices` do user
- [ ] Planilha de IDs: `projectId`, `imageId`, `visibility`, `slug`, lista de URLs `/share/...` já enviadas
- [ ] Export Storage: prefixo `users/{oldUid}/` (legado e novo)
- [ ] Anotar Stripe `customerId` / `subscriptionId` / mode (test/live)
- [ ] Snapshot das rules/indexes deployadas
- [ ] Confirmar `APP_BASE_URL` e secrets no ambiente Functions
- [ ] Guardar JSON de backup versionado **fora** do repo git (sem secrets)

---

## 14. Checklist de testes (ordem sugerida)

### A. Pré-deploy / ambiente

1. Build com `REACT_APP_USE_FIREBASE_EMULATORS=false` e todos `REACT_APP_FIREBASE_*` de produção.  
2. Confirmar que o bundle **não** aponta para `127.0.0.1`.  
3. Deploy: rules → indexes → storage rules → functions → hosting.  
4. Confirmar `APP_BASE_URL` = domínio público.  
5. Stripe webhook endpoint + secret de produção; price IDs corretos.

### B. Auth

6. Cadastro e-mail → verify → login.  
7. Google → LegalConsentGate → perfil criado.  
8. Forgot password → e-mail com link no domínio certo.  
9. Logout / refresh em rota privada.

### C. Recriação / preservação de IDs (crítico)

10. Com backup: recriar user → obter novo UID.  
11. Restaurar projetos com **mesmos** `projectId`.  
12. Restaurar imagens com **mesmos** `imageId` + hotspots.  
13. Migrar Storage + regenerar URLs.  
14. Abrir URL antiga `/share/project/{oldProjectId}` anônimo → OK.  
15. Abrir imagem `/share/project/.../image/{oldImageId}` → OK.  
16. Scene hotspot navega para panorama destino → OK.  
17. Portfólio `/u/{slug}` se aplicável → OK.

### D. Produto

18. Criar projeto / upload / viewer autenticado.  
19. Criar hotspot info + scene.  
20. Share project (shared) + copy link.  
21. Projeto private → mensagem “não disponível”.  
22. Standalone share.  
23. Legacy `/share/image/:id` redirect.  
24. Limites Starter (2 projetos / 10 imagens / 25MB) na UI.  
25. Upgrade Stripe test → plano atualiza (Professional **e** Studio se habilitado).  
26. Cancel at period end.  
27. Excluir projeto (cascade) e imagem (observar hotspots — bug conhecido).  
28. Mobile: menu, upload, viewer pan/zoom; editor hotspot (limitação touch).  
29. Dois usuários (se possível): A não lê projetos private de B.  
30. Tentar write direto de `plan` (beta público: deve falhar após fix; hoje: demonstra C-01).

### E. Pós-migração cleanup

31. Só após validar links: apagar dados órfãos do UID antigo no Firestore/Storage.  
32. Confirmar que nenhum link externo 404.

---

## 15. Plano recomendado para o deploy

### Fase 0 — Decisão

- **Beta fechado (1 usuário real):** Go condicional após B3/B4 e migração de IDs.  
- **Beta público:** No-Go até C-01/C-02 (rules/Functions).

### Fase 1 — Configuração

1. Definir `APP_BASE_URL` nas Functions.  
2. Configurar secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`.  
3. Params: `STRIPE_PRICE_PROFESSIONAL` (+ Studio se usado).  
4. Build frontend com env de produção completo.  
5. Domínios Auth authorized + Hosting custom domain.

### Fase 2 — Migração do usuário (se necessária)

Seguir §17 **antes** de apagar dados antigos definitivamente.

### Fase 3 — Deploy

```
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
yarn build && firebase deploy --only hosting
```

### Fase 4 — Validação smoke

Checklist §14 itens 6–17 e 25.

### Fase 5 — Monitoramento

- Functions logs (webhook, e-mail)  
- Stripe Dashboard  
- Links compartilhados conhecidos  

---

## 16. Lista de arquivos relevantes por problema

| Problema | Arquivos |
|----------|----------|
| Bypass de plano | `firestore.rules`, `planService.js`, `planLimits.js`, `userService.js` |
| APP_BASE_URL | `functions/src/config/app.js`, `createStripeCheckoutSession.js`, e-mail templates |
| Links públicos | `publicAccess.js`, `App.js`, `ShareProjectDialog.jsx`, `ShareImageDialog.jsx`, páginas `Public*` |
| Hotspots | `hotspotService.js`, `PublicImageViewer.jsx`, `Viewer.js`, `PanoramaViewer.jsx` |
| Storage | `imageService.js`, `storageService.js`, `storage.rules`, `docs/storage-architecture.md` |
| Auth | `AuthContext.jsx`, `authService.js`, `ProtectedRoute.jsx`, `LegalConsentGate.jsx` |
| Stripe | `functions/src/stripeWebhook.js`, `createStripeCheckoutSession.js`, `cancelStripeSubscription.js`, `billingService.js`, `useCheckoutSuccessSync.js` |
| Deploy/env | `firebase.json`, `.env.example`, `.env.production`, `src/config/firebase.js`, `package.json` |
| Cascade delete | `projectService.js`, `imageService.js`, `hotspotService.js` |
| Modelo público | `docs/public-profile-model.md`, `slugService.js`, `userMappers.js` |

---

## 17. Plano de recriação do único usuário (procedimento — sem script)

Baseado na implementação atual (`addDoc`/`setDoc` auto-ID, share por document ID, Storage sob `users/{uid}/...`).

### Passo 1 — Exportar dados atuais

1. Anotar UID antigo (`oldUid`) e e-mail.  
2. Exportar documentos listados no §13.  
3. Listar objetos Storage sob `users/{oldUid}/`.  
4. Exportar assinatura Stripe se existir.

### Passo 2 — Registrar IDs importantes

Montar inventário:

- Cada `projectId` + `visibility` + título + URL `/share/project/{id}`  
- Cada `imageId` + `projectId` + `storagePath` + URLs  
- Cada hotspot: `imageId`, `type`, `targetImageId`, pitch/yaw  
- `slug` do portfólio  

### Passo 3 — Não apagar ainda o Storage/Firestore de conteúdo

Manter projetos/imagens no Firestore **ou** ter backup JSON completo. Preferível: **não** deletar projects/images até validação — só trocar ownership após novo Auth.

### Passo 4 — Estratégia recomendada (preferencial)

**Opção A (mais segura para links):**  
1. Criar novo usuário Auth (ou delete+recreate Auth).  
2. Obter `newUid`.  
3. Criar `users`/`publicProfiles`/`workspaces`/`members` para `newUid` (equivalente a `createUserProfile`).  
4. Para cada projeto/imagem/hotspot do backup: **`setDoc` com o mesmo ID**, campos `userId`/`workspaceId` = `newUid`.  
5. Migrar Storage `users/{oldUid}/...` → `users/{newUid}/images/{imageId}.webp` (ou path legado equivalente).  
6. Regenerar `originalUrl`/`previewUrl`/`coverImage`.  
7. Atualizar `slugs/{slug}.uid` = `newUid` (delete+create se rules impedem update).  
8. Reassociar Stripe (`metadata.userId`, docs `subscriptions`/`billing`) ou cancelar e re-checkout.  
9. Validar links.  
10. Só então apagar docs órfãos do `oldUid` e arquivos Storage antigos.

**Opção B (perigosa):** apagar tudo e recriar pela UI → **quebra todos os links** (novos auto-IDs). **Não usar** se houver clientes externos.

### Passo 5 — Excluir usuário antigo no Auth

Somente após:

- Novo perfil funcional, **ou**  
- Backup completo + plano de restore com IDs fixos.

Se Auth for deletado antes do restore, projetos ainda existem com `userId: oldUid` — ficam órfãos até rewrite.

### Passo 6 — Criar usuário novamente / obter novo UID

Signup normal (e-mail ou Google) → completar verify + legal consent → anotar `newUid`.

### Passo 7–9 — Recriar documentos na estrutura atual

Estrutura alvo (atual):

```
users/{newUid}
publicProfiles/{newUid}
workspaces/{newUid} + members/{newUid}
slugs/{slug} → uid: newUid
projects/{SAME_PROJECT_ID} → userId: newUid, workspaceId: newUid
images/{SAME_IMAGE_ID} → userId: newUid, projectId: SAME...
images/{SAME_IMAGE_ID}/hotspots/{id} → userId: newUid, targetImageId: SAME...
```

Usar Admin SDK (`set` com merge conforme necessário) porque:

- Cliente autenticado como `newUid` pode criar projects, mas **não** escolhe o ID via UI.  
- Rules de `slugs` negam `update` — usar delete+create com o mesmo slug.

### Passo 10 — Restaurar Storage

1. Copiar cada arquivo para path sob `newUid`.  
2. Preferir path unificado `users/{newUid}/images/{imageId}.webp`.  
3. `getDownloadURL` → gravar no doc da imagem e em `coverImage` do projeto se aplicável.  
4. Não depender das URLs antigas (tokens do path antigo).

### Passo 11 — Validar links antigos

- Anônimo: cada URL da planilha §13.  
- Hotspots scene.  
- Portfólio se `portfolioAvailable`.  
- Login como novo user: editar/projetos listados.

### Passo 12 — Remover dados antigos

Após validação:

- `users/{oldUid}`, `publicProfiles/{oldUid}`, `workspaces/{oldUid}`, `stats/{oldUid}`, `subscriptions/{oldUid}`  
- Prefixo Storage `users/{oldUid}/`  
- Não apagar `projects`/`images` se já reescritos in-place com mesmos IDs  

---

## Apêndice A — Stripe e planos (síntese)

| Fluxo | Implementação | Segurança |
|-------|---------------|-----------|
| Checkout | Callable auth → Stripe session | OK |
| Webhook | Signature `constructEvent` | OK |
| Cancel | Callable + `cancel_at_period_end` | OK |
| Portal | Stub | Gap produto |
| Plano no Firestore | Webhook escreve `users.plan` + `subscriptions` | Cliente ainda pode sobrescrever (C-01) |
| Limites | `planLimits.js` + `planService` | Só cliente (C-02) |
| Starter | 2 projetos, 10 imagens, 25MB, share OK, sem hotspots/portfólio público | — |

**Exclusão de usuário com Stripe:** preservar `customerId` no novo `users.billing` **ou** cancelar subscription no Stripe antes; evitar dois customers para o mesmo e-mail sem limpeza.

---

## Apêndice B — Arquitetura geral (síntese)

```
src/
  pages/          → UI por rota
  components/     → UI reutilizável (viewer, public, plans, ui/)
  hooks/          → dados + UX
  contexts/       → AuthContext apenas
  services/       → Firestore/Storage/Functions
  config/         → firebase, plans, billing
  utils/          → publicAccess, visibility, slug
functions/        → e-mail, Stripe, verification
firestore.rules / storage.rules / firebase.json
```

Sem Redux/Zustand. Sem backend Mongo/FastAPI (README mentiroso). Fixtures não usados. Dual Storage path documentado. Workspaces são fundação multiuser (ID = uid pessoal).

---

## Apêndice C — Problemas detalhados (formato pedido)

Cada item crítico/alto já inclui: severidade, descrição, impacto, cenário, arquivo, recomendação, bloqueia deploy. Itens médios estão na tabela da §6.

---

**Fim do relatório.**  
Arquivo gerado para suporte à decisão de deploy beta; nenhuma correção de código foi aplicada nesta auditoria.
