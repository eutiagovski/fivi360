# Notas de segurança — Firestore & Storage Rules

**Sprint Public Profile Cleanup 2** — modelo de acesso público vs privado no FIVI360.

Ver também: [public-profile-model.md](./public-profile-model.md)

---

## Resumo

| Recurso | Público (anônimo) | Owner autenticado |
|---------|-------------------|-------------------|
| `users/{uid}` | ❌ negado | ✅ read/write |
| `publicProfiles/{uid}` | ✅ read se `portfolioAvailable == true` | ✅ read/write |
| `slugs/{slug}` | ✅ get (resolução de slug) | ✅ create/delete (próprio slug) |
| `projects/{id}` | ✅ get/list se `visibility` ∈ `shared`, `public` | ✅ CRUD próprios |
| `images/{id}` | ✅ get se shared/public ou projeto shared/public | ✅ CRUD próprias |
| `images` list | ✅ só com filtros que provam visibilidade pública | ✅ `where userId == auth.uid` |
| `images/{id}/hotspots` | ✅ read se imagem acessível publicamente | ✅ CRUD próprias |
| Storage `users/{uid}/**` | ❌ negado (sem auth) | ✅ read/write |

---

## Fluxos públicos legítimos

### `/share/image/:imageId`

1. `getDoc(images/{imageId})` — permitido se `visibility` ∈ `shared`|`public` **ou** projeto pai ∈ `shared`|`public`.
2. Hotspots: subcoleção legível nas mesmas condições.
3. Panorama: URL `previewUrl`/`originalUrl` no documento (ver trade-off Storage abaixo).

### `/share/project/:projectId`

1. `getDoc(projects/{id})` — `visibility` ∈ `shared`|`public`.
2. `list images` com `where projectId == id` — rules validam via `get(projects/{id})` que visibilidade ∈ `shared`|`public`.
3. Perfil do escritório: `getDoc(publicProfiles/{uid})` (se `portfolioAvailable == true` para anônimo).

### `/u/:slug`

1. `getDoc(slugs/{slug})` → `uid`.
2. `getDoc(publicProfiles/{uid})` — única fonte pública de perfil; anônimo só se `portfolioAvailable == true`.
3. `list projects` com `where userId == uid` e `where visibility == 'public'` — exige `portfolioAvailable == true` no dono (`portfolioAvailableForOwner`).

---

## Dados públicos vs privados

### `publicProfiles/{uid}` (público — canônico)

- `displayName`, `companyName`, `bio`, `companyLogo`
- `slug`, `portfolioEnabled`, `portfolioAvailable`
- `socialLinks`
- `updatedAt`

Sincronizado em `createUserProfile` e `saveUserSettings`.

### `users/{uid}` (privado — nunca expor a anônimos)

- `email`
- `plan`, `billing`
- `legalConsent`
- `marketingPreferences` (RC-MARKETING-CONSENT-1)
- timestamps internos

---

## Listagem pública de imagens por `projectId`

`allow list` usa `get(projects/{projectId})` para verificar se o projeto pai é `shared` ou `public`. A query pública é apenas `where('projectId', '==', id)` — não lista imagens de projeto `private`.

Imagens `shared` em projeto `private` são acessíveis via `get` (`/share/image/:id`), mas **não** aparecem em listagens por `projectId`.

---

## Storage — trade-off das URLs com token

O app usa `getDownloadURL()` e persiste a URL completa no Firestore. Essas URLs incluem um **access token** embutido: quem possui o link pode baixar o arquivo **mesmo com Storage Rules restritas a owner**.

| Cenário | Comportamento |
|---------|----------------|
| Anônimo tenta path direto no bucket | ❌ negado |
| Anônimo com URL de imagem **shared** (via Firestore get) | ✅ download via token na URL |
| Anônimo com URL antiga de imagem **privada** (vazou) | ⚠️ ainda funciona até token expirar/revogar |

**Pendência futura:** signed URLs de curta duração, Cloud Function para emitir links, ou path `public/` com regras dedicadas.

Paths legados `projects/` e `images/` na raiz do bucket foram **removidos** das rules (negados). O app v2 usa apenas `users/{userId}/...`.

---

## Riscos remanescentes (fora do escopo desta sprint)

1. **Limites de plano** — enforcement só no cliente/services; owner pode alterar `plan`/`portfolioEnabled` via SDK (C-03 da auditoria).
2. **URLs de Storage com token** — vazamento de link = vazamento de arquivo (ver acima).
3. **Dados legados no Firestore** — documentos órfãos de migrações anteriores podem existir sem rules dedicadas; limpeza manual futura.
4. **Revogação de share** — URLs já emitidas podem continuar válidas até rotação de token.

---

## Hotspots scene — validação de destino (RC-P0.9)

### O que as Rules validam hoje

Em `images/{imageId}/hotspots/{hotspotId}`:

- **create/update**: ownership da imagem **origem** (`parentImage().userId`);
- shape mínimo (`type`, `targetImageId is string` para scene; title/description para info);
- imutabilidade de `pitch`/`yaw` no update.

### Limite conhecido

As Rules **não** validam que `targetImageId` aponte para uma imagem existente do mesmo `userId`/`projectId`.

Fazer `get(images/{targetImageId})` em todo create/update de scene:

- aumenta leituras por escrita;
- exige tratar target inexistente / cross-project / cross-user com cuidado;
- pode tornar writes frágeis se o documento destino estiver inconsistente.

### Camadas de defesa (prioridade)

1. Ownership da imagem origem (Rules) — já existe.
2. Frontend filtra opções de destino (`HotspotFormDialog` + `assertValidSceneTarget` no service).
3. Viewer valida defensivamente em memória (`resolveSceneHotspotTarget`) antes de navegar.
4. Cascade em `deleteImage` remove scene hotspots de entrada (RC-P0.6).
5. Auditoria read-only: `scripts/audit-orphan-scene-hotspots.mjs`.

Validação de destino via Rules com `get()` **não** foi adicionada nesta sprint (custo/fragilidade). Continua como validação de aplicação.

---

## Publicar rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Testar manualmente os cenários owner vs anônimo após deploy.
