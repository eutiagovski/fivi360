# RC-EMBED-PREVIEW-FIX-1 — Corrigir URL e carregamento da prévia da incorporação

## Causa da URL de produção em desenvolvimento

`getAppBaseUrl()` usava o fallback:

1. `REACT_APP_APP_BASE_URL`
2. **`REACT_APP_PUBLIC_URL`** ← problema
3. `window.location.origin`

Em `.env.local`, `REACT_APP_PUBLIC_URL=https://fivi360.com.br` estava definido (site/marketing). Como `REACT_APP_APP_BASE_URL` estava comentado, a prévia, o snippet e “Abrir em nova aba” apontavam para o domínio público — não para `localhost` e nem necessariamente para `app.fivi360.com.br`.

## Causa da falha do preview

Dois fatores distintos:

| Camada | Sintoma | Causa |
|--------|---------|-------|
| URL errada | iframe abre domínio público | Fallback via `REACT_APP_PUBLIC_URL` |
| Dados do Viewer | rota local abre, mas visualização falha | `getPublicEmbeddedProject` no Functions Emulator |

Nesta sessão de emuladores, o Functions Emulator subiu em `127.0.0.1:5001`, porém **falhou ao carregar as function definitions** (`Timeout after 10000`). Probe HTTP:

```text
GET http://127.0.0.1:5001/fivi360/southamerica-east1/getPublicEmbeddedProject?projectId=test
→ 404 Not Found
```

Ou seja: mesmo com URL `http://localhost:3000/embed/:id` correta, a página Embed chama a Function pública e fica no estado de erro controlado se o emulator não registrou `getPublicEmbeddedProject`.

Distinção:

1. **iframe não carregou** — URL/headers/rede  
2. **rota carregou, Function falhou** — caso observado com emulator sem exports  
3. **Viewer carregou, panorama falhou** — Storage/URL da imagem  

## Helper central adotado

Arquivo: `src/utils/embed.js`

```js
getAppBaseUrl()
  → REACT_APP_APP_BASE_URL (trim, remove barras finais)
  → window.location.origin
  → ""

buildEmbedProjectUrl(projectId, { imageId? })
  → {base}/embed/{encodeURIComponent(projectId)}[ /image/{imageId} ]
  → "" se projectId ou base vazios

buildEmbedSnippet(projectId)
  → usa buildEmbedProjectUrl (mesma origem)
```

`REACT_APP_PUBLIC_URL` **não** participa mais da base do Embed.

Prévia, nova aba e snippet compartilham `buildEmbedProjectUrl`.

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `REACT_APP_APP_BASE_URL` | Base do app para Embed (opcional em dev) |
| `REACT_APP_PUBLIC_URL` | Site/marketing — **não** usada pelo Embed |
| `REACT_APP_USE_FIREBASE_EMULATORS` | Aponta `embedPublicService` ao emulator |
| `REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST/PORT` | Default `127.0.0.1:5001` |

Documentado em `.env.example`. Em `.env.production`:

```env
REACT_APP_APP_BASE_URL=https://app.fivi360.com.br
```

Reiniciar o CRACO após alterar `REACT_APP_*`.

## Comportamento local

- Sem `REACT_APP_APP_BASE_URL` → `http://localhost:<porta>/embed/:id`
- Snippet e prévia usam a mesma origem
- `embedPublicService` → `http://127.0.0.1:5001/{projectId}/southamerica-east1/getPublicEmbeddedProject` quando emulators=true
- Headers CSP do Hosting **não** se aplicam ao CRACO; same-origin iframe local não depende de `frame-ancestors`

## Comportamento em produção

- `REACT_APP_APP_BASE_URL=https://app.fivi360.com.br`
- Function: `https://southamerica-east1-fivi360.cloudfunctions.net/getPublicEmbeddedProject`
- Hosting: `/embed/**` com `Content-Security-Policy: frame-ancestors *`

## Relação com Functions Emulator

Cliente já correto (`embedPublicService.getFunctionsBaseUrl`).  
Pré-requisito operacional: Functions Emulator deve carregar exports (incluindo `getPublicEmbeddedProject`). Se o boot falhar por timeout de discovery, a prévia local mostra erro da rota Embed mesmo com URL correta.

## Headers analisados

| Ambiente | CSP / frame |
|----------|-------------|
| Firebase Hosting `/embed/**` | `frame-ancestors *` |
| Rotas admin Hosting | `frame-ancestors 'self'` |
| CRACO `localhost:3000` | Sem headers Hosting; same-origin OK |

Nenhuma proteção global foi removida.

## Prévia (UX)

- Carregamento sob demanda preservado  
- `key={previewUrl:nonce}` remonta ao mudar URL ou retry  
- Loading overlay + erro com “Tentar novamente”  
- Reset ao fechar o modal (`modalOpen`) ou desativar incorporação  
- Não renderiza iframe sem URL válida  
- `allow="fullscreen"` + `allowFullScreen` + title acessível  

Layout/tabs/copy aprovados em RC-EMBED-UX-REFINE-1 permanecem intactos.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/utils/embed.js` | Base URL sem `PUBLIC_URL`; projectId vazio |
| `src/utils/embed.test.js` | Cobertura da resolução de URL |
| `src/components/projects/ProjectEmbedSettingsSection.jsx` | Prévia com loading/erro/retry/reset |
| `src/components/projects/ShareProjectDialog.jsx` | Prop `modalOpen` |
| `src/components/projects/ShareProjectDialog.test.jsx` | Asserções do iframe |
| `.env.example` | Documentação `REACT_APP_APP_BASE_URL` |
| `.env.local` | Comentários (PUBLIC_URL ≠ Embed) |
| `.env.production` | `REACT_APP_APP_BASE_URL` oficial |
| `docs/RC-EMBED-PREVIEW-FIX-1.md` | Este documento |

## Não alterado

Backend, Cloud Function, Rules, schema, elegibilidade, Viewer, Pannellum, tabs/layout/copy.

## Testes

```text
npm test -- --watchAll=false --testPathPattern="embed.test|ShareProjectDialog.test"
→ 3 suites, 33 passed
```

## Build

```text
npm run build — sucesso (exit 0)
```

Warnings ESLint pré-existentes (PublicContactSection / PublicImageViewer / PublicPortfolio / Viewer). Nenhum warning novo nos arquivos desta sprint.

## Validação manual

- [ ] Emulators com Functions **carregadas** (export `getPublicEmbeddedProject` visível)
- [ ] Frontend CRACO; omitir `REACT_APP_APP_BASE_URL` em local
- [ ] Abrir prévia → URL `localhost` → Viewer
- [ ] Abrir em nova aba / copiar snippet
- [ ] Build com `.env.production` → snippet com `app.fivi360.com.br`

## Riscos residuais

- Functions Emulator pode falhar no cold load; prévia local depende disso  
- `iframe.onError` não detecta erro interno da SPA (Function 404) — a própria rota Embed exibe o estado de erro  
- Reinício do CRACO é obrigatório após mudar `.env.local`  

## Confirmação de ausência de deploy

**Nenhum deploy** foi executado.
