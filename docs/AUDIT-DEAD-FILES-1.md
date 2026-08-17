# AUDIT-DEAD-FILES-1

Auditoria somente leitura — arquivos não utilizados, obsoletos ou órfãos (pré-go-live).

**Escopo:** inventário e classificação multi-sinal de `src/`, `functions/`, `tests/`, `scripts/`, `docs/`, `public/`, configs raiz e assets.

**Fora de escopo desta auditoria:** apagar, mover, renomear, alterar imports, `package.json`, configs, código, autofix, build completo e deploy.

**Data:** 2026-08-11  
**Produto:** FIVI360  
**Contexto:** revisão organizacional do repositório antes de limpeza/refatoração futura; go-live iminente.

---

## Sumário executivo

| Pergunta | Resposta curta |
|----------|----------------|
| Há P0 de arquivo morto para go-live? | **Não** |
| Órfãos interferem no bundle/runtime/deploy? | **Não** de forma material (módulos não importados não entram no grafo CRA; Functions `src/` está limpo) |
| Candidatos de limpeza futura (confiança ALTA)? | **Sim** — diags, stub de docs, logs de debug versionados, hooks/services/UI sem consumidor, fixtures |
| Design system shadcn tem sobras? | **Sim** — ~29 de 46 arquivos em `components/ui/` sem import fora de `ui/` |
| Functions `src/` tem módulos órfãos? | **Não** — grafo require a partir de `index.js` cobre todos |
| Docs históricos devem ser apagados? | **Não automaticamente** — classificados como `HISTORICAL_KEEP` |
| Dual lockfile (`yarn.lock` + `package-lock.json`)? | **Sim** — `CONFIG_DUPLICATE` (P1 higiene; `packageManager` aponta yarn) |

---

## 1. Resumo executivo

O repositório está **saudável para go-live** do ponto de vista de arquivos órfãos: nenhum candidato identificado entra no runtime de hosting/Functions por engano, nem exporta Cloud Function fantasma, nem bloqueia bootstrap.

Há **higiene de repositório** (logs de emulator versionados, dual lockfile, scripts de diagnóstico temporários) e **código/app UI sem consumidor** (hooks/services/componentes e kit shadcn não usado). Remoções futuras devem ser feitas em RC dedicada **após** go-live, com testes pontuais — não nesta auditoria.

**Aviso global:** “Sem referência encontrada” ≠ “seguro remover”. A shortlist de remoção futura contém **apenas confiança ALTA**.

---

## 2. Metodologia

### 2.1 Inventário

Arquivos contados sob `src/`, `functions/` (exceto `node_modules`), `tests/`, `scripts/`, `docs/`, `public/` e configs raiz.

**Excluídos da análise de “arquivo morto”:** `node_modules`, `build`, `dist`, `firebase-data`, `coverage`, caches, `.git`. Valores de secrets/env **não** foram impressos.

### 2.2 Sinais de uso (multi-sinal)

Para cada suspeito, cruzaram-se:

- import estático / `require()` / `import()` / `lazy()`
- React Router (`src/App.js`)
- `package.json` / `functions/package.json` scripts
- `firebase.json`, rules, indexes
- exports em `functions/src/index.js`
- testes (`src/**/*.test.*`, `tests/`)
- docs / RCs / runbooks
- strings de path/URL (HTML, CSS, public)
- convenções CRA/Firebase/shadcn (`components.json`)

### 2.3 Grafos de entrada

```text
Frontend:
  public/index.html → src/index.js → App.js (rotas)
    → pages / landing-pages / components / hooks / services / utils / config

Functions:
  functions/src/index.js (10 exports)
    → processEmailQueue, requestPasswordResetEmail, completeEmailVerification,
      createStripeCheckoutSession, cancelStripeSubscription, stripeWebhook,
      syncPublicPortfolioAvailability, repairUserWorkspaceFields,
      getPublicEmbeddedProject, submitPrelaunchLead
    → billing/, config/, email/, emailTemplates/, embed/, portfolio/,
      prelaunch/, services/, stripe/
```

### 2.4 Confiança

| Nível | Critério |
|-------|----------|
| **ALTA** | Sem referências + sem script/config/convenção + (quando aplicável) substituto confirmado ou marcado temporário |
| **MÉDIA** | Sem referência de código, mas uso manual/ops/dinâmico possível |
| **BAIXA** | Suspeita por naming / histórico / indireção |

Remoção automática **não** é recomendada para MÉDIA/BAIXA.

---

## 3. Métricas

| Métrica | Contagem |
|---------|----------|
| Arquivos analisados (subdirs + root configs/artifacts) | **~529** (`src` 361 + `functions` 73 + `docs` 57 + `tests` 13 + `scripts` 3 + `public` 3 + root ~19) |
| Suspeitos / candidatos classificados (linhas de inventário) | **~75** |
| `UNUSED` confiança ALTA (arquivos de código/UI/fixtures/diag) | **~40** |
| `POSSIBLY_UNUSED` | **4** |
| `LEGACY` (ainda com papel) | **5** |
| `HISTORICAL_KEEP` (docs) | **~45+** (RCs/auditorias/planos) |
| `DUPLICATE` / stub | **1** (`archtecture.md`) |
| `CONFIG_DUPLICATE` | **1** (par yarn/npm lock na raiz) |
| `ORPHAN_SCRIPT` (sem npm script) | **4** |
| `ORPHAN_TEST` | **0** |
| `UNREFERENCED_ASSET` | **1** (`public/email/fivi360-logo.png`) |
| P0 | **0** |

---

## 4. Arquivos sem referência

Lista de itens **sem referência de código/app** encontrada.  
**Aviso:** isto **não** significa “seguro remover”.

| Arquivo | Nota rápida |
|---------|-------------|
| `functions/_diag_cold_load.js` | Diagnóstico local; não no `main` |
| `functions/_diag_discovery.js` | Comentário: apagar após RC-DIAG |
| `src/hooks/usePortfolioStats.js` | Sem consumidor |
| `src/services/stats/statsService.js` | Só usado pelo hook acima |
| `src/services/auth/emailVerificationService.js` | Wrapper cliente não chamado; fluxo usa `applyEmailVerificationCode` |
| `src/hooks/useLooseImages.js` | Substituído por `useLooseImagesPage` |
| `src/components/plans/PlanUsageCard.jsx` | Sem import |
| `src/fixtures/images.js` | Sem import |
| `src/fixtures/project.js` | Sem import |
| `src/fixtures/projects.js` | Sem import |
| `src/components/ui/{alert,aspect-ratio,breadcrumb,calendar,card,carousel,command,context-menu,drawer,form,hover-card,input,input-otp,label,menubar,navigation-menu,pagination,popover,progress,radio-group,resizable,scroll-area,separator,skeleton,slider,sonner,textarea,toggle,toggle-group}.jsx` | Kit shadcn sem import fora de `ui/` (ou só peer unused) |
| `public/email/fivi360-logo.png` | Sem referência de runtime; docs como asset futuro |
| `emulator-functions-debug.txt` | Artefato de emulator versionado |
| `firestore-debug.log` | Log de emulator versionado |
| `docs/archtecture.md` | Stub tipográfico → `architecture.md` |
| `src/components/dashboard/` | Pasta vazia |

---

## 5. Alta confiança

| Arquivo | Categoria | Evidência | Confiança | Risco ao remover | Recomendação |
|---------|-----------|-----------|-----------|------------------|--------------|
| `functions/_diag_discovery.js` | UNUSED / OBSOLETE | Header: “Delete after RC-DIAG-FUNCTIONS-LOAD-1”; não em `package.json`/`index.js` | ALTA | Baixo | Remover em RC de higiene |
| `functions/_diag_cold_load.js` | UNUSED | Só faz `require("./src/index.js")` e mede tempo; sem docs/scripts | ALTA | Baixo | Remover em RC de higiene |
| `docs/archtecture.md` | DUPLICATE / OBSOLETE | Stub “renomeado → architecture.md”; links usam `architecture.md` | ALTA | Baixo (confusão) | Remover stub |
| `emulator-functions-debug.txt` | OBSOLETE | Tracked; não coberto por `.gitignore` | ALTA | Baixo–médio (ruído) | Untrack + gitignore |
| `firestore-debug.log` | OBSOLETE | Tracked; `.gitignore` só cobre `npm/yarn-*-debug.log*` | ALTA | Baixo–médio | Untrack + gitignore |
| `src/hooks/usePortfolioStats.js` | UNUSED | Zero imports | ALTA | Baixo | Remover com `statsService` |
| `src/services/stats/statsService.js` | UNUSED | Só referenciado pelo hook morto | ALTA | Baixo | Remover com o hook |
| `src/services/auth/emailVerificationService.js` | UNUSED | Nenhum import; `VerifyEmailAction` usa `applyEmailVerificationCode` | ALTA | Baixo* | Remover wrapper; **não** tocar na CF `completeEmailVerification` |
| `src/hooks/useLooseImages.js` | UNUSED | App usa `useLooseImagesPage` | ALTA | Baixo | Remover |
| `src/components/plans/PlanUsageCard.jsx` | UNUSED | Zero imports | ALTA | Baixo | Remover |
| `src/fixtures/*.js` (3) | UNUSED | Zero imports/requires no repo | ALTA | Baixo | Remover ou mover para docs/demo |
| `src/components/dashboard/` | UNUSED | Diretório vazio | ALTA | Nenhum | Remover pasta |
| `src/components/ui/*` (~29 não usados) | UNUSED | Sem import fora de `ui/` (exceto peers também mortos) | ALTA | Baixo (tree-shake já os exclui do bundle) | Limpeza opcional de design system (P2) |

\*Confirmar que nenhum fluxo futuro depende do callable cliente; a Function exportada permanece viva.

---

## 6. Possivelmente não usados

| Arquivo | Categoria | Evidência | Confiança | Risco ao remover | Recomendação |
|---------|-----------|-----------|-----------|------------------|--------------|
| `src/components/plans/CurrentPlanBanner.jsx` | LEGACY / POSSIBLY_UNUSED | Importado em `Plan.js`, JSX **comentado** | ALTA (não renderizado) / MÉDIA (intenção de reativar) | Médio (UX Plan) | Manter até decisão de produto; ou reativar/remover em RC de Plan UI |
| `public/email/fivi360-logo.png` | UNREFERENCED_ASSET | Tracked; templates usam wordmark textual; citado em `RC-EMAIL-TEMPLATE-1` como futuro | MÉDIA | Baixo | **KEEP** até wiring HTTPS/CDN do logo de e-mail |
| `src/utils/orphanSceneHotspotAudit.js` | POSSIBLY_UNUSED | Só testes + espelho em `scripts/lib/` | MÉDIA | Médio (ops/audit) | **KEEP** — contrato de auditoria / testes |
| `scripts/validate-public-stats-rules.mjs` | ORPHAN_SCRIPT | Sem npm script; sem docs | MÉDIA | Baixo | Documentar ou integrar a `test:rules`; não apagar às cegas |
| `package-lock.json` (raiz) | CONFIG_DUPLICATE | Coexiste com `yarn.lock`; `packageManager: yarn@1.22.22` | MÉDIA | Médio (drift de install) | Escolher gerenciador canônico (yarn) e dropar o outro lock |

---

## 7. Legado

| Arquivo | Categoria | Evidência | Confiança | Risco ao remover | Recomendação |
|---------|-----------|-----------|-----------|------------------|--------------|
| `src/pages/NewProject.js` | LEGACY → KEEP | Rota `/projects/new` → `<Navigate to="/projects" />`; criação via modal | ALTA | Alto (links antigos) | **Manter** redirect de compatibilidade |
| `src/pages/LegacyShareImageRedirect.js` | LEGACY → KEEP | Rota `/share/image/:imageId` | ALTA | Alto (shares antigos) | **Manter** |
| `src/App.js` `/pricing` → `/plan` | LEGACY → KEEP | Redirect | ALTA | Médio | **Manter** |
| `src/components/auth/PublicRoute.jsx` | LEGACY | Alias de `GuestRoute`; App usa `GuestRoute`; coberto por testes/docs | ALTA | Médio (docs/tests) | Manter alias ou consolidar em RC de auth |
| `src/components/auth/LandingRoute.jsx` | LEGACY | Alias de `PublicAlwaysRoute`; App usa `PublicAlwaysRoute` | ALTA | Médio | Idem |
| Mercado Pago (código) | — | **Ausente** em `src/` e `functions/` | ALTA | — | Nada a limpar no runtime; docs históricos KEEP |
| Testes negativos `mercado_pago` | KEEP | Assertem rejeição | ALTA | Alto se removidos | **Manter** como guardrail |

Não existe página `/projects/:id/edit` — edição é `EditProjectDialog` (modal). Não há arquivo de página edit órfão.

---

## 8. Duplicações

| Item | Categoria | Evidência | Confiança | Recomendação |
|------|-----------|-----------|-----------|--------------|
| `docs/archtecture.md` vs `docs/architecture.md` | DUPLICATE | Stub tipográfico | ALTA | Remover stub |
| `yarn.lock` + `package-lock.json` (raiz) | CONFIG_DUPLICATE | Ambos tracked; `packageManager` = yarn | ALTA | Unificar em yarn |
| `emailTemplates/*` vs `email/templates/*` | KEEP (não duplicate morto) | Wrappers intencionais (RC-EMAIL) | ALTA | **Manter** |
| `scripts/lib/orphanSceneHotspotAuditCore.cjs` vs `src/utils/orphanSceneHotspotAudit.js` | DUPLICATE parcial | Core ops vs util testável | MÉDIA | Aceitável; documentar relação |
| `sonner` (dep + `ui/sonner.jsx`) vs `toaster`/`toast` | POSSIBLY_UNUSED | App usa `Toaster` em `App.js`; `sonner.jsx` sem import | MÉDIA | Avaliar remoção do componente/dep em limpeza de UI |
| Auditorias pre-prod (`pre-production-audit.md` vs `AUDITORIA_PRE_DEPLOY_BETA.md`) | HISTORICAL | Segunda declara a primeira parcialmente desatualizada | ALTA | KEEP ambas; preferir beta como snapshot |

---

## 9. Scripts

| Script | npm? | Docs/runbook? | Categoria | Confiança | Recomendação |
|--------|------|---------------|-----------|-----------|--------------|
| `scripts/audit-orphan-scene-hotspots.mjs` | Não | `docs/security-rules-notes.md` | ORPHAN_SCRIPT → KEEP | ALTA | Manter (ops) |
| `scripts/lib/orphanSceneHotspotAuditCore.cjs` | (via script acima) | Implícito | KEEP | ALTA | Manter |
| `scripts/validate-public-stats-rules.mjs` | Não | Não encontrado | ORPHAN_SCRIPT | MÉDIA | Documentar ou acoplar a CI |
| `functions/scripts/preview-emails.js` | Não | `RC-EMAIL-TEMPLATE-1` | ORPHAN_SCRIPT → KEEP | ALTA | Manter; opcional npm script |
| Root: `start/build/test/test:rules/test:portfolio-entitlement/emulators/deploy` | Sim | README/docs | KEEP | ALTA | Ativos |
| Functions: `serve/deploy/logs` | Sim | — | KEEP | ALTA | Ativos |

---

## 10. Tests

| Item | Categoria | Evidência | Recomendação |
|------|-----------|-----------|--------------|
| `tests/functions/*.test.js` (11 suites) | KEEP | Alvos existem sob `functions/src/` | Manter |
| `tests/firestore-rules/` | KEEP | `test:rules` + `firebase.rules-test.json` | Manter |
| `src/**/*.test.*` (~76) | KEEP | Colocados com código vivo | Manter |
| Testes de aliases `PublicRoute` / `LandingRoute` | KEEP | Validam contrato de alias | Manter até consolidar aliases |
| `ORPHAN_TEST` (alvo inexistente) | — | **Nenhum encontrado** | — |
| Testes negativos Mercado Pago | KEEP | Contrato de rejeição | Não remover |

---

## 11. Assets

| Arquivo | Categoria | Evidência | Confiança | Recomendação |
|---------|-----------|-----------|-----------|--------------|
| `public/index.html` | KEEP | Shell CRA | ALTA | Manter |
| `public/favicon.ico` | KEEP | Linkado no HTML | ALTA | Manter |
| `public/email/fivi360-logo.png` | UNREFERENCED_ASSET | Sem uso runtime; docs futuro | MÉDIA | Manter até integrar e-mail |
| `src/assets/img/fivi360_logo.png` | KEEP | `BrandLogo.jsx` | ALTA | Manter |
| CSS (`index.css`, `App.css`, `panorama-viewer.css`) | KEEP | Todos importados | ALTA | Manter |
| `functions/email-previews/*` | KEEP (gerado) | gitignored (`functions/.gitignore`); gerado por `preview-emails.js` | ALTA | Não versionar; regenerar localmente |

---

## 12. Config

| Item | Categoria | Evidência | Recomendação |
|------|-----------|-----------|--------------|
| `firebase.json`, `.firebaserc`, rules, indexes, storage.rules | KEEP | Deploy/emulators | Manter |
| `firebase.rules-test.json` | KEEP | `test:rules` | Manter |
| `craco.config.js`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json` | KEEP | Build frontend | Manter |
| `components.json` | KEEP | shadcn | Manter |
| `.env.example`, `functions/.env.example` | KEEP | Contratos de env (valores não auditados) | Manter |
| `yarn.lock` + `package-lock.json` | CONFIG_DUPLICATE | Dual lock; yarn canônico via `packageManager` | Unificar (P1) |
| `emulator-functions-debug.txt`, `firestore-debug.log` | OBSOLETE (artifact) | Tracked sem ignore adequado | Untrack + gitignore (P1) |
| Sem `.eslintrc*` / `eslint.config.*` na raiz | Observação | ESLint via deps CRA | Fora de escopo de remoção |

Secrets (`.env*`, `.secret.local`) **não** foram abertos nem impressos.

---

## 13. Functions

### 13.1 Exports (`functions/src/index.js`)

| Export | Tipo de uso | Frontend / webhook / trigger | Status |
|--------|-------------|------------------------------|--------|
| `processEmailQueue` | Trigger fila e-mail | Pipeline Resend | KEEP |
| `requestPasswordResetEmail` | Callable | Auth/forgot password | KEEP |
| `completeEmailVerification` | Callable | Fluxo verificação (servidor); wrapper cliente órfão | KEEP export |
| `createStripeCheckoutSession` | Callable | Plan/checkout + gate pagamentos | KEEP |
| `cancelStripeSubscription` | Callable | Plan | KEEP |
| `stripeWebhook` | HTTP webhook | Stripe | KEEP |
| `syncPublicPortfolioAvailability` | Callable | Settings / userService | KEEP |
| `repairUserWorkspaceFields` | Callable | ensureUserStructure | KEEP |
| `getPublicEmbeddedProject` | Callable | Embed público | KEEP |
| `submitPrelaunchLead` | Callable | LP acesso antecipado | KEEP |

### 13.2 Arquivos Functions fora do grafo de deploy

| Arquivo | Categoria | Confiança | Recomendação |
|---------|-----------|-----------|--------------|
| `_diag_cold_load.js` | UNUSED | ALTA | Remover (P1 higiene) |
| `_diag_discovery.js` | OBSOLETE | ALTA | Remover (P1) |
| `scripts/preview-emails.js` | KEEP (dev) | ALTA | Manter |
| `email-previews/` | Gerado / gitignored | ALTA | Não commitar |

**Mercado Pago em `functions/`:** nenhum remanescente de implementação.

**Módulos `functions/src/` não alcançados por `index.js`:** nenhum.

---

## 14. Docs históricos

| Cluster | Arquivos (exemplos) | Categoria | Recomendação |
|---------|---------------------|-----------|--------------|
| Stub | `archtecture.md` | OBSOLETE / DUPLICATE | Remover |
| MP obsoleto | `mercado-pago-billing-plan.md` | HISTORICAL_KEEP | Manter rotulado |
| Auditorias protótipo | `audit-report-v1.md`, `audit-report.md` | HISTORICAL_KEEP | Manter |
| Pre-prod | `pre-production-audit.md`, `AUDITORIA_PRE_DEPLOY_BETA.md` | HISTORICAL_KEEP | Preferir beta como snapshot; não apagar |
| UX sprints | `ux-audit-sprint-11*.md` | HISTORICAL_KEEP | Manter |
| RCs recentes | `RC-*`, `AUDIT-MANUAL-*`, `RUNBOOK-*`, `RC-EMAIL-*` | HISTORICAL_KEEP / operacional | **Não** tratar como lixo |
| Planos de rebuild | `LANDING_REBUILD.md`, `rebuild-plan-v2.md`, `foundation-step-01.md` | HISTORICAL_KEEP | Manter |
| Living docs | `product.md`, `business-rules.md`, `architecture.md`, etc. | KEEP | Manter (alguns podem estar parcialmente defasados — fora do escopo “dead file”) |

Documentação marcada como histórica **não** é recomendada para apagar só por não ser operacional.

---

## 15. Arquivos que devem ser mantidos

Lista explícita anti-limpeza excessiva:

1. Todos os 10 exports de Cloud Functions e dependências sob `functions/src/`
2. Rotas de compatibilidade: `NewProject.js`, `LegacyShareImageRedirect.js`, `/pricing` redirect
3. Aliases `PublicRoute` / `LandingRoute` (até RC de consolidação + update de testes/docs)
4. `functions/scripts/preview-emails.js` e política de `email-previews/` gerados
5. `scripts/audit-orphan-scene-hotspots.mjs` + core
6. `public/email/fivi360-logo.png` (asset futuro de e-mail)
7. `src/assets/img/fivi360_logo.png`
8. Docs `HISTORICAL_KEEP` / RCs / runbooks / AUDIT-*
9. Testes negativos Mercado Pago e suites em `tests/functions/`
10. Dual layer de e-mail (`emailTemplates` + `email/templates`) — intencional
11. Firebase configs, rules, indexes, `firebase.rules-test.json`
12. Embed, billing Stripe, LP `/lp/*`, signup `/register` — fluxos **ativos**

---

## 16. Riscos pré-go-live

| Pergunta | Resposta |
|----------|----------|
| Arquivo morto no bundle? | **Não material** — CRA só empacota grafo a partir de `index.js`; UI/hooks não importados não entram |
| Carregado em runtime? | Diags **não** são `main` das Functions; não sobem no deploy como entry |
| Risco de segurança? | Logs de emulator versionados são higiene (podem conter ruído); **não** classificado P0 sem evidência de segredo — valores não inspecionados aqui |
| Exportado por engano? | **Não** — exports de `index.js` são os 10 vivos |
| Timeout/bootstrap? | **Não** atribuível a órfãos |
| Confusão de deploy? | Dual lockfile pode confundir install (P1), não o artefato de hosting em si |

### Veredito

**Nenhum arquivo órfão identificado representa risco para o go-live.**

Prioridades reais de higiene pós-go-live: P1 (diags, debug logs, dual lockfile), P2 (UI shadcn morta, fixtures, hooks órfãos).

---

## 17. Shortlist para limpeza futura

Somente **confiança ALTA**. **NÃO apagar nesta auditoria.**

### 1. `functions/_diag_discovery.js`
- **Motivo:** diagnóstico temporário explícito  
- **Evidência:** comentário “Delete after RC-DIAG-FUNCTIONS-LOAD-1”; sem refs  
- **Substituto:** nenhum (RC concluída)  
- **Impacto:** nenhum em runtime  
- **Testes pós-remoção:** `npm run test:portfolio-entitlement`; smoke emulator functions

### 2. `functions/_diag_cold_load.js`
- **Motivo:** script local de timing  
- **Evidência:** não referenciado  
- **Substituto:** nenhum  
- **Impacto:** nenhum  
- **Testes:** idem

### 3. `docs/archtecture.md`
- **Motivo:** stub tipográfico  
- **Evidência:** aponta para `architecture.md`  
- **Substituto:** `docs/architecture.md`  
- **Impacto:** nenhum  
- **Testes:** n/a (docs)

### 4–5. `emulator-functions-debug.txt`, `firestore-debug.log`
- **Motivo:** artefatos de emulator versionados  
- **Evidência:** tracked; ignore incompleto  
- **Substituto:** gitignore  
- **Impacto:** reduz ruído no git  
- **Testes:** `firebase emulators` smoke; confirmar que novos logs não voltam ao git

### 6–7. `src/hooks/usePortfolioStats.js` + `src/services/stats/statsService.js`
- **Motivo:** cadeia sem consumidor  
- **Evidência:** zero imports externos  
- **Substituto:** nenhum no app atual  
- **Impacto:** nenhum UI  
- **Testes:** `npm test` (suite stats se existir); smoke Dashboard/Plan

### 8. `src/services/auth/emailVerificationService.js`
- **Motivo:** wrapper cliente não usado  
- **Evidência:** fluxo usa `applyEmailVerificationCode`  
- **Substituto:** path Auth action atual  
- **Impacto:** nenhum se CF permanecer  
- **Testes:** fluxo verify-email E2E / unitários auth

### 9. `src/hooks/useLooseImages.js`
- **Motivo:** substituído por `useLooseImagesPage`  
- **Evidência:** `Images.js` importa só o Page hook  
- **Substituto:** `useLooseImagesPage.js`  
- **Impacto:** nenhum  
- **Testes:** página `/images`

### 10. `src/components/plans/PlanUsageCard.jsx`
- **Motivo:** componente sem import  
- **Evidência:** grep zero  
- **Substituto:** UI de uso em Plan (outros componentes)  
- **Impacto:** nenhum  
- **Testes:** `/plan`

### 11. `src/fixtures/{images,project,projects}.js`
- **Motivo:** mocks sem consumidor  
- **Evidência:** zero imports  
- **Substituto:** nenhum  
- **Impacto:** nenhum  
- **Testes:** n/a

### 12. Pasta vazia `src/components/dashboard/`
- **Motivo:** diretório vazio  
- **Impacto:** nenhum  
- **Testes:** n/a

### 13. (Opcional P2) `src/components/ui/*` não usados (~29)
- **Motivo:** kit shadcn sem consumidor de app  
- **Evidência:** imports só de peers também mortos ou inexistentes  
- **Substituto:** componentes já usados (`button`, `dialog`, etc.)  
- **Impacto:** bundle já tree-shakeados; limpeza cosmético/repo  
- **Testes:** smoke UI + `npm test` amplo

---

## 18. Recomendações para futura refatoração / monorepo

### Priorização

| Prioridade | Itens | Notas |
|------------|-------|-------|
| **P0** | — | Nenhum inventado |
| **P1** | Remover `_diag_*`; untrack debug logs + gitignore; unificar lockfile (yarn) | Higiene pré/pós go-live sem tocar produto |
| **P1** | Remover cadeia stats morta, `useLooseImages`, `emailVerificationService` cliente, `PlanUsageCard`, fixtures | RC pequena pós-go-live |
| **P2** | Limpar shadcn não usado; decidir `CurrentPlanBanner`; documentar scripts órfãos no npm | Organização |
| **P3** | Índice de docs históricos; opcional archive de RCs antigas | Cosmético; **não** apagar RCs |

### Monorepo / organização futura

1. Separar claramente `apps/web`, `functions`, `packages/shared` se o monorepo avançar — hoje o acoplamento via paths `@/` e `functions/src` é flat mas legível.
2. Tratar `components/ui` como **kit opcional**: ou podar o não usado, ou documentar “kit completo intencional”.
3. Scripts ops (`scripts/`) merecem entradas `package.json` (`audit:hotspots`, `validate:stats-rules`) para deixarem de parecer órfãos.
4. Gerados (`email-previews/`) já estão gitignored — manter essa política.
5. Não misturar limpeza de docs históricos com limpeza de código na mesma RC.

### Import graph (simplificado)

```text
index.js
  └─ App.js
       ├─ routes → pages/* + landing-pages/access-early/*
       ├─ auth guards (GuestRoute, PublicAlwaysRoute, ProtectedRoute, VerifyEmailRoute)
       ├─ Layout → AppHeader, …
       └─ ui: toaster (+ toast)

functions/src/index.js
  └─ 10 exports → billing/email/embed/portfolio/prelaunch/stripe/config/services
```

Folhas órfãs confirmadas ficam **fora** desses grafos (seção 5).

---

## Recomendação final

- **Go-live:** não bloqueado por arquivos mortos.  
- **Próxima RC de higiene (P1):** diags Functions, debug logs, dual lockfile, depois dead code app (stats/loose images/fixtures/PlanUsageCard).  
- **Não apagar** docs `HISTORICAL_KEEP`, scripts ops documentados, redirects de compatibilidade, asset de e-mail futuro, nem exports de Functions.

*Fim da auditoria AUDIT-DEAD-FILES-1. Nenhuma alteração de código, imports, package ou configs foi feita — apenas este relatório foi criado.*
