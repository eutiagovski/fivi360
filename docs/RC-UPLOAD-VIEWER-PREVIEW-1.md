# RC-UPLOAD-VIEWER-PREVIEW-1 — Prévia 360° antes do upload ou substituição

## Objetivo

Permitir que o usuário explore a imagem no `PanoramaViewer` real **antes** de qualquer escrita definitiva no Firebase (Storage/Firestore/stats), tanto no upload novo quanto na substituição.

## Abordagem de upload múltiplo

**Adotada nesta sprint:** prévia apenas para **upload individual** e **substituição individual**.

O produto já opera com `<input type="file">` sem `multiple`. Upload em lote com “Imagem N de M” fica como **evolução imediata** documentada (fora do escopo). O fluxo unitário existente não foi quebrado.

## Fluxo anterior

### Novo upload

1. Seleção do arquivo (Images / ProjectDetail)
2. Toast de quota com `file.size`
3. `validateImageFile`
4. Abre `UploadImageDialog` com prévia **2D** (`<img>` + Object URL do arquivo original)
5. Ao **Salvar**: `assertCanUploadImage` → `convertToWebp` → Storage → Firestore → stats/projeto

### Substituição

1. `EditImageDialog` com prévia 2D do arquivo novo (ou thumb atual)
2. Ao **Salvar**: `assertCanReplaceImageStorage` → `convertToWebp` → upload (mesmo `imageId`) → updateDoc → delete legado se path mudou

Hotspots: nunca alterados no replace (mesmo documento).

## Fluxo novo

### Etapa 1 — Selecionar / preparar

1. Validação de tipo
2. Validação comercial de quota pelo tamanho **original** (`File.size`)
   - upload: `assertCanUploadImage(userId, file.size)`
   - replace: `assertCanReplaceImageStorage(userId, newSize, currentQuotaBytes)`
3. `processImageForUpload` / pipeline WebP atual (único)
4. `URL.createObjectURL(processedBlob)`
5. Abre etapa de prévia (`preview_ready`)

**Ainda não ocorre:** upload Storage, doc Firestore, stats, exclusão do arquivo anterior, consumo definitivo de quota.

### Etapa 2 — Visualizar e confirmar

- Viewer 360° (`PanoramaViewer` `mode="upload-preview"`)
- Ações:
  - Upload: **Confirmar upload** / **Escolher outra imagem** / **Cancelar**
  - Substituição: **Confirmar substituição** / **Escolher outra imagem** / **Manter imagem atual**
- Somente no confirmar: `uploadImage` / `replaceImageFile` com `processedBlob` (sem reconversão)

## Arquitetura da prévia local

```
File
  → assert quota (originalSizeBytes)
  → processImageForUpload (Canvas → WebP)
  → createObjectURL(processedBlob)
  → PanoramaViewer(mode=upload-preview)
  → [Confirmar] uploadBytes(processedBlob) + Firestore
```

Componentes/hooks:

| Peça | Papel |
|------|--------|
| `prepareUploadPreview` | Processa + Object URL + metas/avisos |
| `useUploadPreview` | Máquina de estados + revoke único |
| `PanoramaUploadPreview` | Frame 16:9 + loading/erro + metas |
| `UploadImageDialog` / `EditImageDialog` | UX e confirmação |
| `PanoramaViewer` | Viewer real, modo `upload-preview` |

## Arquivo original versus processado

| Conceito | Valor |
|----------|--------|
| Quota / tamanho exibido | `file.size` (`originalSizeBytes`) |
| Prévia e upload físico | Blob WebP do pipeline atual |
| Compressão / taxa / blob URL | **não** mostrados ao usuário |

## Máquina de estados

`idle` → `validating` → `processing` → `preview_ready` → `uploading` → (fecha)

`error` em falha de preparação; falha de rede no upload volta a `preview_ready` mantendo o Blob.

## Reutilização do PanoramaViewer

`mode="upload-preview"`:

- exibe panorama com drag/zoom
- sem hotspots / placement / context menu
- sem hint de interação
- sem analytics de visualização
- aceita `blob:`
- `onReady` / `onError` para UX do modal
- fullscreen nativo desligado no modal

## Novo upload

Modal: **Visualizar antes de enviar**. Confirmação chama `uploadImage(..., { processedBlob })`.

## Substituição

Modal: **Visualizar nova imagem**. Imagem atual intacta até confirmar.

Após sucesso:

1. upload do novo WebP
2. `updateDoc` (URLs, paths, tamanhos, dims) — **mesmo `imageId`**
3. só então remove path legado distinto
4. hotspots preservados (sem writes em hotspots)

## Preservação de hotspots

Inalterada: replace não toca coleções de hotspots; scene links por `imageId` seguem válidos.

## Quota

Preserva RC-STORAGE-QUOTA-ORIGINAL-SIZE-1.

- Upload: `used + newOriginal <= limit` (antes do processamento)
- Replace: `used - currentOriginal + newOriginal <= limit`
- Cancelar / falha: quota inalterada
- Enforcement server-side definitivo permanece P0 Beta (fora desta sprint)

## Cancelamento e cleanup

`useUploadPreview` revoga Object URL:

- ao trocar arquivo
- ao reset/cancelar
- no unmount

Sem Storage/Firestore/stats no cancelamento.

## Upload múltiplo

Fora de escopo; evolução: fila com preview sequencial + confirmar lote.

## Arquivos alterados

- `src/utils/imageConstants.js`
- `src/utils/imageValidation.js`
- `src/utils/imageConversion.js`
- `src/utils/prepareUploadPreview.js` (+ test)
- `src/hooks/useUploadPreview.js` (+ test)
- `src/components/images/PanoramaUploadPreview.jsx`
- `src/components/images/UploadImageDialog.jsx` (+ preview test)
- `src/components/images/EditImageDialog.jsx`
- `src/components/viewer/PanoramaViewer.jsx` (+ upload-preview test)
- `src/services/images/imageService.js` (+ storage tests)
- `src/utils/imageValidation.aspect.test.js`
- `docs/RC-UPLOAD-VIEWER-PREVIEW-1.md`

## Testes executados

Relacionados apenas (sem build completo) — **todos passaram**:

- `src/services/images/imageService.storage.test.js`
- `src/utils/prepareUploadPreview.test.js`
- `src/hooks/useUploadPreview.test.js`
- `src/components/images/UploadImageDialog.preview.test.jsx`
- `src/components/viewer/PanoramaViewer.uploadPreview.test.jsx`
- `src/utils/imageValidation.aspect.test.js`
- `src/services/plans/planService.storageQuota.test.js`
- `src/utils/storageQuota.test.js`
- `src/utils/planToast.storageQuota.test.js`

## Validação manual

Checklist:

- [ ] Novo upload: processar → explorar → zoom → confirmar → doc/Storage
- [ ] Cancelar após prévia: sem persistência / quota intacta
- [ ] Escolher outra: B no viewer + cleanup de A
- [ ] Substituição: cancelar mantém antiga; confirmar preserva `imageId` + hotspots
- [ ] Falha de upload: prévia permanece; retry sem reprocessar
- [ ] Desktop / notebook / tablet / 430px / 375px

## Riscos residuais

- Pannellum com `blob:` em browsers muito antigos (mitigado pelos formatos já aceitos)
- Container com altura zero em layouts extremos (mitigado com `aspect-video` + `min-h-[220px]`)
- Coexistência física temporária no replace same-path (overwrite) — esperado
- Enforcement server-side de quota ainda P0 Beta

## Build / deploy

- **Build completo:** não executado (orientação da sprint)
- **Deploy:** não realizado
