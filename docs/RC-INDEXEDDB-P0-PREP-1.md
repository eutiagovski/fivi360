# RC-INDEXEDDB-P0-PREP-1 — Preparação mínima para armazenamento local futuro

**Data:** 29 de julho de 2026  
**Referência:** [RC-AUDIT-INDEXEDDB-READY-1.md](./RC-AUDIT-INDEXEDDB-READY-1.md)  
**Escopo:** apenas P0 (timestamps + cursor) — sem IndexedDB, Dexie, cache, sync ou deploy  

---

## 1. Resumo

Sprint **executado com sucesso**. A arquitetura passou a expor datas como `Date | null` nos DTOs públicos e a paginação usa cursor serializável `{ id, sortValue }`, sem vazar `QueryDocumentSnapshot` para hooks/UI.

| Item | Resultado |
|------|-----------|
| Decisão gate | **GO** (~14 h, risco médio-baixo) |
| Timestamp na UI/hooks | Removido |
| Cursor público | `PaginationCursor` |
| Schema Firestore | Inalterado |
| IndexedDB / Dexie | Não introduzidos |
| Deploy | Não executado |
| Testes | 31 suites / 263 testes — PASS |
| Build | PASS (warnings ESLint pré-existentes) |

---

## 2. Análise de impacto

### 2.1 Firebase Timestamp — recebimento / retorno

| Área | Arquivos |
|------|----------|
| Mappers / DTOs | `projectService`, `imageService`, `hotspotService`, `invoiceService`, `statsService` |
| Billing | `config/billing.js` (`UserBilling`, `normalizeBilling`, `formatBillingDate`) |
| Plan typedef | `config/planLimits.js` (`UserPlan.updatedAt`) |
| Ordenação | `utils/recencySort.js`, `utils/imageRecencySort.js` (via `toMillis`) |
| Writes internos | `serverTimestamp()` permanece nos services (inalterado semanticamente) |

### 2.2 Hooks que expunham / usavam Timestamp

| Hook | Antes | Depois |
|------|-------|--------|
| `useProjectImages` | `Timestamp.now()` | `new Date()` |
| `useLooseImages` | `Timestamp.now()` | `new Date()` |
| `useLooseImagesPage` | `Timestamp` + `lastDoc` | `new Date()` + `cursor` |
| `useProjectsPage` | `lastDoc` (snapshot) | `cursor` |

### 2.3 Services que retornavam `QueryDocumentSnapshot`

- `getProjectsPageByUserId` → `lastDoc`
- `getLooseImagesPageByUserId` → `lastDoc`

### 2.4 Páginas / fluxos de paginação

- `/projects` via `useProjectsPage`
- `/images` (soltas) via `useLooseImagesPage`

### 2.5 Testes impactados / novos

- Novos: `dates.test.js`, `recencySort.test.js`, casos de paginação em `projectService.test.js`, caso billing em `billing.test.js`
- Ajustes de mocks: image/hotspot/project cascade tests (`Timestamp` no mock Firestore)
- Alinhamento colateral: `publicSeo.test.js` (expectativa desatualizada vs copy atual)

### 2.6 Fluxos críticos potencialmente afetados

| Fluxo | Risco | Mitigação |
|-------|-------|-----------|
| Login / Auth | Baixo | Sem mudança estrutural; `UserProfile` já não expunha Timestamp de createdAt |
| Listagens / ordenação | Médio | `toMillis` unificado aceita Date + legado |
| Paginação load more | Médio | Cursor via `getDoc` + `startAfter(snap)` |
| Upload / replace imagem | Baixo | Writes com `serverTimestamp`; retorno local com `new Date()` |
| Billing / Stripe | Baixo | Só normalização read-side em `normalizeBilling` |
| Hotspots | Baixo | Mapper + sort por `toMillis` |

---

## 3. Estimativa inicial

| Métrica | Valor |
|---------|-------|
| Arquivos (produção + teste + docs) | ~25–30 |
| Services alterados | 6 (project, image, hotspot, invoice, stats + firebase/dates) |
| Hooks alterados | 4 |
| Testes tocados / novos | ~10 arquivos |
| Risco geral | Médio-baixo |
| **Esforço estimado** | **~12–14 h** (< 20 h) |

### Risco por área

| Área | Risco |
|------|-------|
| Timestamps / mappers | Baixo |
| Ordenação | Baixo–médio |
| Paginação | Médio |
| Auth | Baixo (não estrutural) |
| Billing / Stripe | Baixo (não estrutural) |
| Upload Storage | Baixo (não estrutural) |

---

## 4. Decisão de executar ou interromper

**DECISÃO: EXECUTAR.**

Nenhum critério de interrupção foi atingido:

- Estimativa < 20 h  
- Auth / billing / upload **não** estruturalmente afetados  
- Sem alteração de schema Firestore  
- Sem migração de dados  
- Sem alteração de Rules  
- Risco não classificado como alto  

---

## 5. Tipos Firebase encontrados fora dos services (antes)

| Local | Tipo | Ação |
|-------|------|------|
| `useProjectImages.js` | `Timestamp` | Removido |
| `useLooseImages.js` | `Timestamp` | Removido |
| `useLooseImagesPage.js` | `Timestamp` + snapshot cursor | Removido |
| `useProjectsPage.js` | snapshot cursor | Removido |
| `config/billing.js` typedefs | `Timestamp \| …` | → `Date \| null` |
| `config/planLimits.js` typedef | `Timestamp` | → `Date \| null` |

**Após o sprint:** zero imports de `firebase/firestore` em `hooks/`, `pages/`, `components/`, `contexts/`.

---

## 6. Estratégia de normalização adotada

Fronteira central em `src/services/firebase/dates.js`:

| Função | Papel |
|--------|-------|
| `toAppDate(value)` | Firebase/legado → `Date \| null` |
| `toMillis(value)` | Comparação/ordenação (epoch ms; `0` se inválido) |
| `toFirestoreDate(date)` | App → `Timestamp` (writes explícitos; creates/updates online seguem com `serverTimestamp()`) |
| `buildPaginationCursor` / `isPaginationCursor` | Cursor público |

Conversão aplicada nos mappers de leitura (`mapProjectDoc`, `mapImageDoc`, `mapHotspotDoc`, `mapInvoiceDoc`, stats, `normalizeBilling`).

Returns otimistas após write usam `new Date()` no DTO local; o documento Firestore continua com `serverTimestamp()`.

---

## 7. Padrão de datas adotado

**Padrão da aplicação:** `Date | null` nos DTOs / hooks / view models.

- ISO string: aceita na entrada (`toAppDate`); não é o tipo preferido em memória.  
- Epoch ms: usado em `PaginationCursor.sortValue` e ordenação.  
- Sentinels `serverTimestamp` não resolvidos → `null` (seguro).  

---

## 8. Estratégia do cursor

```ts
type PaginationCursor = {
  id: string;
  sortValue: number | null; // epoch ms de updatedAt
};
```

**API pública:** `{ items, cursor, hasMore }` — sem `lastDoc` / `QueryDocumentSnapshot`.

**Interno (Firestore adapter):**

1. Se cursor válido → `getDoc(collection, cursor.id)`  
2. Se existe → `startAfter(snapshot)` (mesma semântica de antes)  
3. Se excluído → fallback `startAfter(Timestamp.fromMillis(sortValue))`  
4. Cursor inválido (`id` vazio) → primeira página  

Índices existentes preservados (`userId` + `updatedAt` DESC). Sem novo índice / schema.

---

## 9. Arquivos alterados

### Produção

- `src/services/firebase/dates.js` *(novo)*  
- `src/services/firebase/index.js`  
- `src/services/projects/projectService.js`  
- `src/services/images/imageService.js`  
- `src/services/hotspots/hotspotService.js`  
- `src/services/billing/invoiceService.js`  
- `src/services/stats/statsService.js`  
- `src/config/billing.js`  
- `src/config/planLimits.js`  
- `src/utils/recencySort.js`  
- `src/utils/imageRecencySort.js`  
- `src/hooks/useProjectsPage.js`  
- `src/hooks/useLooseImagesPage.js`  
- `src/hooks/useProjectImages.js`  
- `src/hooks/useLooseImages.js`  

### Testes

- `src/services/firebase/dates.test.js` *(novo)*  
- `src/utils/recencySort.test.js` *(novo)*  
- `src/services/projects/projectService.test.js`  
- `src/services/projects/projectService.cascade.test.js`  
- `src/config/billing.test.js`  
- `src/services/images/imageService.*.test.js` (mocks)  
- `src/services/hotspots/hotspotService.sceneMove.test.js` (mocks)  
- `src/utils/publicSeo.test.js` (alinhamento expectativa × copy atual)  

### Docs

- `docs/RC-INDEXEDDB-P0-PREP-1.md` *(este arquivo)*  

---

## 10. Testes adicionados

- Conversão `toAppDate` / `toMillis` / `toFirestoreDate` (Timestamp, Date, ISO, null, serverTimestamp, legado `{ seconds }`)  
- Cursor: build / validate / first page / next page / doc deletado / cursor inválido  
- Ordenação com `Date` (`recencySort`, image recency/created)  
- `normalizeBilling` → datas como `Date`  

---

## 11. Testes executados

```text
npm test -- --watchAll=false
Test Suites: 31 passed, 31 total
Tests:       263 passed, 263 total
```

Cobertura inclui: auth, projects, images, hotspots, billing, plans, email queue, legal consent, utils.

---

## 12. Resultado do build

```text
npm run build
→ Compiled with warnings (ESLint hooks pré-existentes em componentes públicos)
→ build/ gerado com sucesso
```

Nenhum erro de compilação introduzido por este sprint.

---

## 13. Riscos residuais

1. **Fallback de cursor com doc deletado** — `startAfter(sortValue)` pode, em empates de `updatedAt`, duplicar/saltar um item; raro.  
2. **Retorno otimista pós-write** — `createdAt`/`updatedAt` locais são `Date` do cliente, não o valor final do servidor até o próximo fetch.  
3. **`DocumentReference` interno** — ainda usado dentro de `hotspotService` / batches (não vaza para UI).  
4. **Validação manual completa** — não executada neste ambiente (requer app + Firebase autenticado); recomendada antes do merge em Beta.  

---

## 14. Pontos deixados para pós-Beta

Conforme auditoria e exclusões deste sprint:

- IndexedDB / Dexie / cache local  
- Offline / outbox / sync / conflitos  
- Cache de blobs / panoramas  
- Repository completo  
- Abstração total de `serverTimestamp` / batch / transaction  
- Metadados `syncVersion` / `deletedAt` / estados pending  

---

## 15. Comparação com a auditoria original

| Achado da auditoria (P0) | Status |
|--------------------------|--------|
| Normalizar timestamps nos mappers | ✅ Feito |
| Remover Timestamp de hooks/DTOs públicos | ✅ Feito |
| Abstrair cursor de paginação | ✅ Feito |
| Helpers em `services/firebase` | ✅ Feito |
| Repository completo | ⏭ Pós-Beta (P2) |
| IndexedDB | ⏭ Fora de escopo |

**Impacto esperado no Cenário B da auditoria:** fronteira de datas + cursor serializável reduzem atrito principal estimado (economia ~30–50% no caminho de cache futuro).

---

## 16. Confirmação de ausência de IndexedDB

- [x] Nenhuma dependência Dexie / idb instalada  
- [x] Nenhum store IndexedDB criado  
- [x] Nenhum service worker / Cache API de panoramas  

---

## 17. Confirmação de ausência de deploy

- [x] Nenhum `firebase deploy`  
- [x] Nenhum publish Hosting / Functions / Rules  
- [x] Apenas `npm test` e `npm run build` locais  

---

## Critérios de aceite

| Critério | Status |
|----------|--------|
| Timestamp não exposto à UI | ✅ |
| Hooks com `Date` / padrão definido | ✅ |
| Mappers concentram conversão | ✅ |
| Cursor público sem `QueryDocumentSnapshot` | ✅ |
| serverTimestamp / batch / transaction internos | ✅ |
| Sem schema / migração | ✅ |
| Sem mudança visual/funcional intencional | ✅ |
| Testes passam | ✅ |
| Build passa | ✅ |
| Sem deploy | ✅ |
| Sem IndexedDB | ✅ |
