# RC-UPLOAD-VIEWER-PREVIEW-2 — Fullscreen e hotspots de referência na prévia

## Objetivo

Refinar a prévia local da RC-1 com:

1. **Fullscreen** no `PanoramaViewer` (`mode="upload-preview"`), reutilizando o controle nativo do Pannellum.
2. **Hotspots de referência inertes** na **substituição**, sobre o novo Blob WebP, sem alterar persistência.

Reposicionamento de hotspots **não** entra nesta sprint: o usuário confirma a troca e ajusta coordenadas depois no editor normal.

## Fullscreen

- `showFullscreenCtrl` habilitado em `PanoramaUploadPreview`.
- Capacidades centralizadas em `getPanoramaViewerCapabilities("upload-preview")`.
- Esc / botão nativo saem do fullscreen; o modal **não** fecha enquanto `document.fullscreenElement` estiver ativo (`onEscapeKeyDown` + guarda em `onOpenChange`).
- `fullscreenchange` → `viewer.resize()` (sem reconversão, sem novo Object URL, sem upload).
- Sem analytics de visualização.

## Hotspots de referência

| Fluxo | Hotspots |
|-------|----------|
| Novo upload | `[]` |
| Substituição | `getHotspotsByImage(imageId)` uma vez ao entrar no fluxo |

Comportamento:

- mesmos pitch/yaw;
- visual real + classe `pnlm-hotspot--preview-ref` (cursor default);
- tooltip/label simples (`title` ou “Hotspot existente”);
- **sem** click handlers → sem modal, navegação, edição, analytics;
- falha ao carregar hotspots **não** bloqueia a prévia nem a confirmação;
- copy de referência só quando `hotspots.length > 0`.

## Diferenças upload vs substituição

- Upload: fullscreen + zoom; sem hotspots.
- Substituição: fullscreen + zoom + hotspots inertes reutilizados ao “Escolher outra imagem”.

## Preservação no banco

`replaceImageFile` continua atualizando apenas metadados de arquivo/URL/tamanhos. Hotspots não entram no payload. `imageId` preservado.

## Falhas toleradas

- Hotspots indisponíveis → aviso âmbar; imagem e confirmação liberadas.
- Esc no fullscreen → sai da tela cheia, mantém modal/Blob.

## Arquivos alterados

- `src/components/viewer/PanoramaViewer.jsx` (+ capabilities)
- `src/components/viewer/panorama-viewer.css`
- `src/utils/hotspotPannellum.js`
- `src/utils/imageConstants.js`
- `src/components/images/PanoramaUploadPreview.jsx`
- `src/components/images/EditImageDialog.jsx`
- `src/components/images/UploadImageDialog.jsx`
- testes: `hotspotPannellum.preview`, `PanoramaViewer.capabilities`, `PanoramaViewer.uploadPreview`, `EditImageDialog.preview`
- `docs/RC-UPLOAD-VIEWER-PREVIEW-2.md`

## Testes executados

Relacionados apenas (sem build completo) — **25 passed**:

- `src/utils/hotspotPannellum.preview.test.js`
- `src/components/viewer/PanoramaViewer.capabilities.test.js`
- `src/components/viewer/PanoramaViewer.uploadPreview.test.jsx`
- `src/components/images/EditImageDialog.preview.test.jsx`
- `src/components/images/UploadImageDialog.preview.test.jsx`
- `src/utils/prepareUploadPreview.test.js`
- `src/hooks/useUploadPreview.test.js`

## Validação manual

- [ ] Fullscreen no novo upload (entrar/sair Esc; modal e Blob intactos)
- [ ] Substituição com info + scene (inerte; fullscreen; alinhamento)
- [ ] Confirmar substituição → mesmo `imageId` + hotspots interativos no Viewer normal
- [ ] Trocar arquivo A→B reutiliza hotspots; cleanup de Object URL
- [ ] Desktop / notebook / tablet / 430px / 375px / retrato / paisagem

## Riscos residuais

- Conflito raro Esc entre Fullscreen API e Dialog (mitigado).
- Scene órfão: exibido como referência sem carregar destino.
- Pannellum `cssClass` pode variar entre versões (classe CSS defensiva).

## Build / deploy

- **Build completo:** não executado.
- **Deploy:** não realizado.
