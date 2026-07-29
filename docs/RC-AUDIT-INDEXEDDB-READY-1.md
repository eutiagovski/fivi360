# RC-AUDIT-INDEXEDDB-READY-1 — Preparação arquitetural para IndexedDB

**Data:** 29 de julho de 2026  
**Escopo:** auditoria somente leitura — nenhum IndexedDB, Dexie, biblioteca nova, alteração de comportamento ou deploy  
**Objetivo:** avaliar se a arquitetura atual permite adotar armazenamento local no futuro com o mínimo de refatoração  

---

## 1. Resumo executivo

A arquitetura do FIVI360 está **parcialmente preparada** para IndexedDB.

**Pontos positivos:** a UI (páginas e componentes) **não** importa o SDK do Firestore. Todo acesso a dados passa por uma camada de **services** por domínio (`projects`, `images`, `hotspots`, `users`, etc.). Não há `onSnapshot` — as leituras são one-shot via `getDoc` / `getDocs`, o que simplifica um futuro cache local.

**Pontos que ainda travam:** os DTOs de domínio ainda carregam tipos do Firebase (`Timestamp`, `QueryDocumentSnapshot` como cursor de paginação); não existe camada Repository / interface de persistência; não há metadados de sincronização (`version`, `lastSyncedAt`, fila offline); uploads e blobs de panoramas vivem no Storage, fora do modelo Firestore.

**Veredito:** 🟡 **Parcialmente preparada.** Trocar a origem de dados **não** exigiria alterar dezenas de componentes — bastaria evoluir os services. Porém, implementar sync/offline completo na arquitetura atual ainda exigiria trabalho significativo nos serviços, mappers e hooks de paginação.

| Pergunta | Resposta curta |
|----------|----------------|
| Firestore está desacoplado? | **Sim na UI; parcialmente nos services.** |
| O que dificulta IndexedDB? | `Timestamp`, cursors Firestore, `serverTimestamp`, batches/transactions, Storage. |
| Esforço futuro de sync? | **Alto sem ajustes; médio após pequenos ajustes.** |
| Ajustes agora? | Sim — normalizar timestamps, abstrair cursores, helpers em `services/firebase`. |

---

## 2. Arquitetura atual

### 2.1 Camadas observadas

```text
Pages / Components
        ↓
   Hooks (useProjects, useProjectImages, useHotspots, …)
        ↓
   Services (projectService, imageService, hotspotService, …)
        ↓
   Firebase SDK (Firestore / Auth / Storage) via config/firebase.js
```

| Camada | Existe? | Observação |
|--------|---------|------------|
| **Repository** | Não | Não há pasta/interfaces `repositories/`. |
| **Service** | Sim | Camada madura por domínio sob `src/services/`. |
| **UI → Firestore direto** | Não | Páginas/componentes/contextos **não** importam `firebase/firestore`. |
| **UI → Services** | Sim | Padrão dominante; alinhado a `docs/firebase-foundation.md`. |
| **Helpers Firebase compartilhados** | Esqueleto vazio | `src/services/firebase/index.js` exporta `{}`. |

### 2.2 Acesso ao Firestore — inventário

| Operação SDK | Usado? | Onde (services) |
|--------------|--------|-----------------|
| `getDoc` | Sim | users, images, hotspots, projects, slugs, workspaces, stats |
| `getDocs` | Sim | projects, images, hotspots, plans, invoices, stats |
| `setDoc` | Sim | images, hotspots, publicStats |
| `addDoc` | Sim | projects, emailQueue |
| `updateDoc` | Sim | users, images, hotspots, projects |
| `deleteDoc` | Sim | images, hotspots, projects |
| `writeBatch` | Sim | users/ensureUserStructure, images (delete/move) |
| `runTransaction` | Sim | users (slug / welcome / consent) |
| `onSnapshot` | **Não** | — |
| Queries (`query`/`where`/`orderBy`/`limit`/`startAfter`) | Sim | projects, images, plans, invoices |

**Contagem aproximada de chamadas SDK (código de produção, não-teste):** ~100+ usos concentrados em **12 módulos** de serviço.

### 2.3 Quem acessa Firestore?

| Tipo | Quantidade | Detalhe |
|------|------------|---------|
| **Componentes/páginas com Firestore direto** | **0** | Nenhum import de `firebase/firestore` em `pages/`, `components/`, `contexts/`. |
| **Hooks com SDK Firestore** | **3** | `useProjectImages`, `useLooseImages`, `useLooseImagesPage` — apenas `Timestamp.now()` para otimismo local. |
| **Módulos service com Firestore** | **12** | `userService`, `ensureUserStructure`, `imageService`, `hotspotService`, `projectService`, `workspaceService`, `slugService`, `planService`, `invoiceService`, `statsService`, `publicStatsService`, `emailQueueService`. |
| **Services sem Firestore (Auth/Storage/HTTP)** | Vários | `authService`, `storageService`, `billingService` (Functions), `analyticsService`, etc. |

### 2.4 Abstração por entidade

| Entidade | Service / módulo | Mapper / DTO | Depende do SDK na UI? |
|----------|------------------|--------------|------------------------|
| User / PublicProfile | `userService`, `userMappers`, `ensureUserStructure` | `mapUserDoc`, `mapToPublicUser` | Não |
| Workspace | `workspaceService` | payloads + utils | Não |
| Project | `projectService` | `mapProjectDoc`, `mapProjectToCard` | Não (cursor `lastDoc` vaza para hooks) |
| Panorama / Image | `imageService` | `mapImageDoc`, `mapImageToCard` | Hooks usam `Timestamp` |
| Hotspot | `hotspotService` | `mapHotspotDoc` | Não |
| Billing | `billing` config + `billingService` + nested em user | `normalizeBilling` | Não |
| Plan | `planLimits` (config) + `planService` (usage) | `normalizeUserPlan` | Não |
| Invoice | `invoiceService` | `mapInvoiceDoc` | Não |
| Slug | `slugService` | registry docs | Não |
| Stats | `statsService`, `publicStatsService` | mapeamento inline | Não |

**Conclusão do mapeamento:** entidades principais **já têm service**. Não há Repository. A UI depende dos services/hooks, não do SDK — exceto o vazamento pontual de `Timestamp` e de `QueryDocumentSnapshot` na paginação.

---

## 3. Pontos fortes

1. **UI desacoplada do Firestore** — princípio da fundação Firebase respeitado na prática.
2. **Services por domínio** — ponto único de troca para cache/IndexedDB futuro.
3. **IDs estáveis** — document IDs de projects/images/hotspots/users; links públicos `/share/*` e storage paths dependem desses IDs.
4. **Timestamps de auditoria** — `createdAt` / `updatedAt` gravados com `serverTimestamp()` nas entidades principais.
5. **Mappers já existem** — `mapProjectDoc`, `mapImageDoc`, `mapHotspotDoc`, `mapUserDoc`, `normalizeBilling`.
6. **Sem listeners realtime** — ausência de `onSnapshot` reduz complexidade de sync (modelo pull/push mais simples).
7. **Hooks com estado local** — listas já fazem cache em memória + eventos (`dataSyncEvents`) para invalidação leve.
8. **Testabilidade parcial** — vários services já mockam `firebase/firestore` em Jest.
9. **Utils de tempo já tolerantes** — `toMillis` / `formatBillingDate` aceitam Timestamp, Date, string e `{ seconds }`.

---

## 4. Pontos fracos

1. **Sem Repository / porta de persistência** — services importam Firestore diretamente; IndexedDB teria que ser embutido nos mesmos arquivos ou exigir extração posterior.
2. **`Timestamp` no domínio** — typedefs e mappers preservam `firebase/firestore.Timestamp`; UI/hooks às vezes recriam com `Timestamp.now()`.
3. **Paginação acoplada ao cursor Firestore** — `lastDoc: QueryDocumentSnapshot` exposto a `useProjectsPage` / `useLooseImagesPage`.
4. **`serverTimestamp()`** — writes offline precisam de estratégia local + reconciliação; hoje assume servidor online.
5. **Batches e transactions** — slug, delete de imagem+hotspots, ensure structure: atomicidade Firestore não mapeia 1:1 para IndexedDB.
6. **Hotspots em subcoleção** — `images/{id}/hotspots` complica espelhamento local (store composta ou denormalização).
7. **Sem metadados de sync** — não há `version`, `etag`, `clientUpdatedAt`, `syncStatus`, fila de mutações.
8. **Panoramas = Storage + URLs** — IndexedDB de metadados ≠ cache de blobs; `originalUrl`/`previewUrl` são URLs remotas.
9. **`services/firebase/index.js` vazio** — helpers de serialização/timestamp previstos na fundação não foram preenchidos.
10. **Billing/Plan misturam formatos** — Timestamp | Date | string; serialização local possível, mas inconsistente sem normalização única.

---

## 5. Grau de preparação

### 5.1 Modelos (auditoria detalhada)

| Entidade | ID estável? | createdAt? | updatedAt? | Tipos Firebase na UI? | Serializável para local? |
|----------|-------------|------------|------------|------------------------|---------------------------|
| **User** | Sim (`uid`) | Sim (doc); DTO `UserProfile` não expõe | Sim no doc; DTO não expõe | Billing pode trazer Timestamp; UI usa `normalizeBilling` / formatters | Parcial — normalizar datas |
| **Workspace** | Sim (`uid` pessoal) | Sim | Sim | Não na UI | Sim (payloads simples) |
| **Project** | Sim (doc id) | Sim | Sim | Timestamp no objeto; cards usam campos string | Quase — converter Timestamp→ISO/ms |
| **Image / Panorama** | Sim | Sim | Sim | Timestamp + hooks com `Timestamp.now()` | Quase — URLs remotas; blob à parte |
| **Hotspot** | Sim (subdoc) | Sim | Sim | Ordenação usa `.toMillis?.()` | Quase — chave composta imageId+id |
| **Billing** | Nested / Stripe IDs | `updatedAt` | Sim | Aceita Timestamp na tipagem | Sim após normalização |
| **Plan** | IDs string (`starter`…) | Config estática | `updatedAt` opcional no objeto plan | Tipagem Timestamp | Sim — config em código + entitlement no user |

### 5.2 Capacidade futura de sincronização (avaliação, sem implementar)

| Capacidade | Suporte atual | Comentário |
|------------|---------------|------------|
| Cache local | Parcial | Hooks em memória; sem persistência. Services são o gancho certo. |
| Modo offline | Fraco | Sem persistence Firestore habilitada; writes usam `serverTimestamp`/transactions. |
| Sync posterior | Fraco | Sem fila de outbox nem campos de versão. |
| Resolução de conflitos | Fraco | Só `updatedAt`; sem LWW explícito nem merge policy. |
| Fila de uploads | Fraco | Upload acoplado a Storage + `setDoc` no mesmo fluxo online. |
| Cache de panoramas | Fraco | Depende de Storage URLs; precisa Cache API / IDB blobs separado. |

### 5.3 Notas (0–5)

| Critério | Nota | Justificativa |
|----------|------|---------------|
| **Desacoplamento do Firestore** | **4** | UI limpa; services ainda acoplados ao SDK, mas concentrados. |
| **Serialização dos modelos** | **3** | Objetos planos com IDs; Timestamps e cursors impedem `JSON.stringify` confiável. |
| **Facilidade para IndexedDB** | **3** | Boundary de services ajuda; falta interface + normalização de datas/cursores. |
| **Facilidade para cache** | **3** | Cache em memória já existe; persistir exigiria política read-through nos services/hooks. |
| **Facilidade para sincronização** | **2** | Sem outbox, versão, offline writes ou reconciliação. |
| **Facilidade para testes** | **4** | Services mockáveis; DTOs serializáveis melhorariam ainda mais. |

**Média ponderada aproximada:** ~3.2 / 5 → preparação **média-alta para cache**, **baixa-média para sync offline completo**.

---

## 6. Estimativa de esforço sem preparação (Cenário A)

**Premissa:** implementar IndexedDB (metadados de projects/images/hotspots/user) + cache read-through + rascunho de sync, **sem** refatorar a arquitetura antes.

| Item | Estimativa |
|------|------------|
| **Esforço** | **80–120 h** |
| **Risco** | **Alto** |
| **Arquivos impactados** | **~35–50** (12 services + ~8 hooks + mappers + testes + store IDB) |
| **Principais dificuldades** | Converter Timestamps em runtime; reescrever paginação (`lastDoc`); emular batches/transactions; fila de upload Storage; hotspots em subcoleção; regressões em testes que mockam SDK. |

Escopo típico neste cenário: Dexie/IDB store, wrapper em cada service, serialização ad hoc, sync best-effort, cache de listas. Offline writes completos e conflict UI elevariam para o topo da faixa (ou acima).

---

## 7. Estimativa de esforço após pequenos ajustes (Cenário B)

**Premissa:** antes (ou como fase 0), aplicar as recomendações da §8 (normalizar timestamps nos mappers, abstrair cursor de paginação, helpers em `services/firebase`, opcionalmente esboçar porta Repository). Comportamento do produto permanece igual.

| Item | Estimativa |
|------|------------|
| **Esforço (implementação IndexedDB futura)** | **40–70 h** |
| **Risco** | **Médio** |
| **Arquivos impactados (fase IndexedDB)** | **~15–25** (stores + adapters nos services + poucos hooks) |
| **Principais dificuldades remanescentes** | Outbox/sync; uploads; Storage blob cache; atomicidade de deletes em cascata. |

| Fase | Esforço | Risco |
|------|---------|-------|
| Ajustes preparatórios (§8) | **6–12 h** | Baixo |
| IndexedDB cache read-only | **16–24 h** | Baixo–médio |
| Sync + outbox + conflitos | **24–40 h** | Médio–alto |
| Cache de blobs de panoramas | **12–20 h** | Médio (quota, eviction) |

**Economia estimada vs Cenário A:** ~30–50% no caminho crítico, com risco bem menor de espalhar Firebase types pela UI.

---

## 8. Recomendações

Melhorias **pequenas**, baixo risco, sem mudar comportamento — **não implementadas nesta sprint**.

### R1 — Normalizar timestamps nos mappers (ISO string ou epoch ms)

| Campo | Valor |
|-------|--------|
| **Benefício** | DTOs `JSON`-serializáveis; IndexedDB e testes sem `Timestamp`. |
| **Impacto** | `mapProjectDoc`, `mapImageDoc`, `mapHotspotDoc`, invoice/stats mappers; utils já usam `toMillis`. |
| **Risco** | Baixo — formatters já aceitam number/string. |
| **Tempo** | 3–5 h |
| **Prioridade** | **P0** |

### R2 — Remover `Timestamp` dos hooks de imagens

| Campo | Valor |
|-------|--------|
| **Benefício** | Elimina últimos imports de `firebase/firestore` fora de services. |
| **Impacto** | `useProjectImages`, `useLooseImages`, `useLooseImagesPage` — usar `Date.now()` ou helper. |
| **Risco** | Muito baixo |
| **Tempo** | 0.5–1 h |
| **Prioridade** | **P0** |

### R3 — Abstrair cursor de paginação (`lastDoc` → `{ updatedAt, id }` ou opaque token)

| Campo | Valor |
|-------|--------|
| **Benefício** | Hooks deixam de depender de `QueryDocumentSnapshot`; IDB pode paginar por índice local. |
| **Impacto** | `projectService`, `imageService`, `useProjectsPage`, `useLooseImagesPage`. |
| **Risco** | Baixo–médio (regressão de “load more”). |
| **Tempo** | 2–4 h |
| **Prioridade** | **P0** |

### R4 — Preencher `services/firebase` com helpers (`toMillis`, `serializeTimestamp`, erros)

| Campo | Valor |
|-------|--------|
| **Benefício** | Ponto único previsto na fundação; reduz duplicação. |
| **Impacto** | `services/firebase/index.js` + imports opcionais. |
| **Risco** | Muito baixo |
| **Tempo** | 1–2 h |
| **Prioridade** | **P1** |

### R5 — Documentar contrato de porta de persistência (sem criar IDB)

| Campo | Valor |
|-------|--------|
| **Benefício** | Guia futuro: `getById` / `listByUser` / `upsert` / `delete` por entidade. |
| **Impacto** | Só docs (ex.: extensão deste audit ou `docs/persistence-port.md`). |
| **Risco** | Nenhum |
| **Tempo** | 1–2 h |
| **Prioridade** | **P1** |

### R6 — (Opcional) Extrair interfaces Repository sem mudar implementação

| Campo | Valor |
|-------|--------|
| **Benefício** | Troca Firestore↔IDB por adapter; Cenário B mais barato. |
| **Impacto** | Novos arquivos + reexport dos services atuais. |
| **Risco** | Médio se feito em massa; baixo se só Project/Image. |
| **Tempo** | 4–8 h (Project + Image primeiro) |
| **Prioridade** | **P2** (pode esperar até o sprint IndexedDB) |

**Não recomendado agora:** habilitar Firestore offline persistence nativa como “substituto” de IndexedDB de domínio — mascara o problema de DTOs e não cobre fila de uploads nem cache de blobs da aplicação.

---

## 9. Roadmap sugerido para implementação futura

Ordem recomendada **após** a Beta, quando houver interesse real em storage local:

```text
Fase 0 — Preparação (6–12 h)
  R1 + R2 + R3 (+ R4)
  Sem IndexedDB; comportamento idêntico

Fase 1 — Cache local read-through (16–24 h)
  Store IDB: projects, images, hotspots, user profile
  Services: ler rede → gravar IDB → retornar DTO
  Fallback: servir IDB se rede falhar (read-only)

Fase 2 — Invalidação e freshness (8–12 h)
  Usar updatedAt + TTL
  Integrar dataSyncEvents / refetch hooks

Fase 3 — Outbox de mutações (24–40 h)
  Fila local create/update/delete
  Replay online; política LWW por updatedAt
  Tratar batches (delete imagem+hotspots) como jobs compostos

Fase 4 — Uploads e cache de panoramas (12–20 h+)
  Fila de upload Storage
  Cache de blobs (Cache API ou IDB) com eviction por quota
```

**Fora de escopo inicial sugerido:** invoices/billing sync (dados sensíveis, origem Stripe/Functions); email queue; stats de views (melhor eventual consistency online).

---

## 10. Conclusão

### Classificação final

🟡 **Parcialmente preparada.**

### Justificativa técnica

1. O acesso ao Firestore **está suficientemente desacoplado da UI** (0 componentes com SDK; services concentrados). Isso evita a refatoração “dezenas de componentes” temida no objetivo.
2. **Não** está pronta para plugar IndexedDB sem atrito: DTOs ainda carregam `Timestamp`, a paginação vaza `QueryDocumentSnapshot`, writes dependem de `serverTimestamp`/transactions/batches, e não há modelo de sync/outbox.
3. Com os **pequenos ajustes P0** (serialização de datas + cursor opaco + remoção de `Timestamp` nos hooks), o caminho para um cache local futuro fica **claramente mais barato e seguro** (Cenário B), sem alterar funcionalidades agora.
4. Sync offline completo, fila de uploads e cache de panoramas continuam sendo **projetos próprios** — a arquitetura atual **não bloqueia**, mas também **não entrega** essas capacidades de graça.

### Respostas diretas aos objetivos

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Firestore desacoplado? | **Sim na UI; parcialmente nos services (nota 4/5).** |
| 2 | O que dificulta IndexedDB? | Timestamps, cursors, serverTimestamp, batches/transactions, Storage, ausência de porta Repository. |
| 3 | Esforço de sync futuro? | **80–120 h** hoje; **40–70 h** após ajustes + fases incrementais. |
| 4 | Ajustes pequenos agora? | Sim — lista na §8 (P0: R1–R3). **Não implementados neste sprint.** |

---

## Apêndice A — Módulos Firestore (produção)

```text
src/services/users/userService.js
src/services/users/ensureUserStructure.js
src/services/projects/projectService.js
src/services/images/imageService.js
src/services/hotspots/hotspotService.js
src/services/workspaces/workspaceService.js
src/services/slugs/slugService.js
src/services/plans/planService.js
src/services/billing/invoiceService.js
src/services/stats/statsService.js
src/services/stats/publicStatsService.js
src/services/email/emailQueueService.js
```

## Apêndice B — Vazamentos Firebase fora de services

```text
src/hooks/useProjectImages.js      → Timestamp
src/hooks/useLooseImages.js        → Timestamp
src/hooks/useLooseImagesPage.js    → Timestamp + lastDoc (via service)
src/hooks/useProjectsPage.js       → lastDoc (QueryDocumentSnapshot via service)
```

## Apêndice C — Restrições desta auditoria (cumpridas)

- [x] Não implementar IndexedDB  
- [x] Não instalar Dexie nem outras libs  
- [x] Não alterar lógica de negócio  
- [x] Não executar deploy  
- [x] Entrega apenas documental: `docs/RC-AUDIT-INDEXEDDB-READY-1.md`  
