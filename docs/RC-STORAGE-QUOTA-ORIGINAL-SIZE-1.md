# RC-STORAGE-QUOTA-ORIGINAL-SIZE-1 — Contabilizar armazenamento pelo tamanho original do upload

## Objetivo

Consumir o limite comercial do plano com base no tamanho do arquivo **original** selecionado pelo usuário (`File.size`), antes de compressão/conversão. A economia da compressão WebP é otimização interna de infraestrutura e **não** amplia a capacidade comercial.

## Regra anterior

- Persistência: `images.sizeBytes = webpBlob.size` (tamanho após conversão WebP).
- Quota comercial (`usage.storageBytes`): soma de `images.sizeBytes` → tamanho **comprimido**.
- Validação no serviço de upload: `assertCanUploadImage(userId, webpBlob.size)` **depois** da conversão.
- Pré-check de UI: já usava `file.size` (original) — inconsistente com o assert/persistência.
- Exclusão/cascade: devolvia `sizeBytes` comprimido.

## Regra nova

| Conceito | Campo | Uso |
|----------|--------|-----|
| Quota comercial | `originalSizeBytes` | Validação, dashboard, deltas, exclusão |
| Tamanho físico | `storedSizeBytes` (+ legado `sizeBytes`) | Métricas internas / Storage |
| Uso agregado | `usage.storageBytes` | Continua o nome existente; agora = soma de quotas originais |

Exemplo: original 5 MB → armazenado 1,4 MB → consumo do plano **5 MB**.

## Modelo de dados

Novos documentos de imagem:

```js
{
  originalSizeBytes: number, // File.size
  storedSizeBytes: number,   // WebP persistido
  sizeBytes: number,         // legado = storedSizeBytes (compatibilidade)
}
```

### Decisão `storedSizeBytes`

**Preferência A (atual):** tamanho do panorama WebP principal.

Hoje `previewUrl === originalUrl` e há um único objeto no Storage por imagem. Quando existirem artefatos adicionais (preview/thumbnail separados), preferir **B** (soma de todos os arquivos físicos) sem mudar a regra comercial.

## Compatibilidade com documentos existentes

Fallback de quota (`getQuotaSizeBytes`):

1. `originalSizeBytes`
2. `sizeBytes` (legado — era comprimido)
3. `storedSizeBytes`
4. `0`

Incerteza documentada: docs pré-RC com apenas `sizeBytes` subestimam o uso comercial (valor comprimido). Aceitável até limpeza pré-Beta; sem migração em massa nesta sprint.

`sizeBytes` **não** mudou de significado: continua representando o tamanho físico armazenado.

## Fluxo de upload

1. Usuário seleciona arquivo.
2. UI valida tipo e quota com `file.size` (`showImageUploadBlockedToast`).
3. `uploadImage` / `replaceImageFile`:
   - captura `originalSizeBytes = file.size`;
   - **`assertCanUploadImage` / `assertCanReplaceImageStorage` antes de `convertToWebp`**;
   - comprime → `storedSizeBytes = webpBlob.size`;
   - upload Storage;
   - grava Firestore com ambos os campos (+ `sizeBytes` legado).
4. UI aplica `applyUsageDelta` com `getQuotaSizeBytes(image)`.
5. `refreshUsage()` recalcula a soma no Firestore.

Falha antes do `setDoc`: nenhum consumo persistido (não há reserva atômica nesta sprint).

## Momento da validação

| Camada | Momento | Bytes |
|--------|---------|-------|
| UI (toast) | Após seleção, antes do diálogo/processamento | `file.size` |
| Serviço | Antes de `convertToWebp` | `file.size` |
| Dashboard | Soma contínua de imagens | `originalSizeBytes` (+ fallback) |

## Atualização do contador

Não existe contador persistido de storage no usuário/workspace. A fonte de verdade é a soma das imagens (`getUserUsage`). O hook `applyUsageDelta` é otimista e alinhado a `getQuotaSizeBytes`.

## Exclusão e cascade

- `deleteImage`: retorna `sizeBytes` / `originalSizeBytes` = quota comercial; `storedSizeBytes` = físico.
- UI decrementa com `getQuotaSizeBytes(image)`.
- `deleteProjectCascade.deletedStorageBytes`: soma de `getQuotaSizeBytes` das imagens.
- Consumo nunca negativo na UI: `Math.max` no count de projetos; storage vem da soma recalculada.
- Idempotência: documento removido → some da soma; retry de delete em doc inexistente falha sem segundo decremento persistido.

## Movimentação projeto ↔ galeria

Inalterada: não muda `originalSizeBytes` / Storage / quota. Apenas `projectId` / contadores de projeto.

## Upload múltiplo

**Não suportado** na UI atual (`files?.[0]`). A API de bloqueio (`getImageUploadBlockCode` / toast) já aceita `additionalBytes` como soma, pronta para lotes futuros.

Política se/quando houver lote: preservar comportamento atual (arquivo único). Toast de storage já informa selecionado + disponível.

## Concorrência e retry — risco P0 (Beta)

### Situação atual

- Enforcement **somente no cliente**.
- Sem transaction / reserva / Cloud Function de quota.
- Dois uploads simultâneos podem ambos passar no assert com o mesmo saldo (TOCTOU).
- Firestore Rules: validam shape (`originalSizeBytes` / `storedSizeBytes` / `sizeBytes` são `number` no create); **não** validam valor vs Storage nem vs plano.
- `File.size` é dado do cliente — não confiável para enforcement absoluto.

### Estratégia mínima (esta sprint)

- Validação UX no cliente (pré-compressão).
- Escrita apenas pelo fluxo controlado de `imageService`.
- Recálculo atômico na prática = re-soma após refresh (sem counter doc).
- Sem reserva: falha pré-`setDoc` não deixa consumo órfão.

### Estratégia ideal (pós-Beta)

Backend valida tamanho, reserva quota, autoriza upload, confirma após conclusão.

**Risco P0 residual:** bypass client-side e corrida entre uploads paralelos. Documentado; enforcement server-side fora de escopo desta RC.

## Métricas internas futuras

Campos suficientes para:

- `economiaBytes = originalSizeBytes - storedSizeBytes`
- `taxaCompressao = storedSizeBytes / originalSizeBytes`

Não exibidos ao usuário. Sem dashboard admin nesta sprint.

## Limites dos planos

**Inalterados** (`src/config/planLimits.js`):

| Plano | Storage |
|-------|---------|
| Starter | 25 MB |
| Professional | 250 MB |
| Studio | 2 GB |
| Enterprise | a partir de 10 GB |

Estimativa comercial continua ~5 MB/imagem **antes** da otimização.

## Mensagem ao usuário

Storage:

> Este upload ultrapassa o limite de armazenamento disponível no seu plano. Selecionado: X. Disponível: Y. Libere espaço excluindo imagens ou faça upgrade para continuar.

Sem menção a compressão, Firebase ou economia interna.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/utils/storageQuota.js` | Helpers `getQuotaSizeBytes` / `getStoredSizeBytes` |
| `src/services/plans/planService.js` | Soma por quota original; mensagem STORAGE_LIMIT |
| `src/services/images/imageService.js` | Assert pré-compressão; dual size; delete quota |
| `src/services/projects/projectService.js` | Cascade soma quota original |
| `src/utils/planToast.js` | Mensagem com selecionado/disponível |
| `src/pages/Images.js` | Deltas com `getQuotaSizeBytes` |
| `src/pages/ProjectDetail.js` | Idem |
| `firestore.rules` | Create exige `originalSizeBytes` e `storedSizeBytes` number |
| Testes listados abaixo | Cobertura da RC |
| `docs/RC-STORAGE-QUOTA-ORIGINAL-SIZE-1.md` | Este documento |

## Testes executados

Comando (apenas suite relacionada; **sem build completo**):

```bash
npx craco test --watchAll=false --testPathPattern="storageQuota|planService.storageQuota|planToast.storageQuota|imageService.storage|imageService.delete|imageService.move|projectService.cascade|planLimits"
```

Resultado: **8 suites, 64 testes, todos passando.**

Cobertura incluída:

- `file.size` capturado / assert antes da compressão
- Quota usa `originalSizeBytes`; compressão não reduz consumo comercial
- `storedSizeBytes` persistido à parte
- Upload acima do limite recusado antes de `convertToWebp`
- Exclusão / cascade devolvem tamanho original
- Fallback legado
- Move não altera size
- Limites Professional 250 MB / Studio 2 GB
- Toast sem termos de compressão

## Validação manual (checklist)

- [ ] Upload abaixo do limite: consumo = original; físico menor no Storage
- [ ] Upload acima do limite: bloqueio antes da compressão; sem doc / sem objeto
- [ ] Exclusão de imagem / projeto: devolve soma original
- [ ] Mover projeto ↔ galeria: consumo inalterado
- [ ] Dashboard / Plan / PlanUsageCard: barras usam tamanho original
- [ ] Sem UI mostrando tamanho comprimido como “uso do plano”

## Riscos residuais

1. **P0 — enforcement client-only / TOCTOU** (ver Concorrência).
2. Docs legados com `sizeBytes` comprimido subestimam quota até wipe Beta.
3. Cliente malicioso pode gravar `originalSizeBytes` artificialmente baixo (rules só checam tipo).
4. Upload múltiplo ainda não implementado na UI.

## Confirmações de entrega

- Build completo: **não executado** (orientação da RC).
- Deploy: **não realizado**.
- Preços / limites dos planos: **não alterados**.
