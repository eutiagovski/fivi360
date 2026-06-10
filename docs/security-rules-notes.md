# Notas de segurança — Firestore & Storage Rules

**Sprint 13.3** — modelo de acesso público vs privado no FIVI360.

---

## Resumo

| Recurso | Público (anônimo) | Owner autenticado |
|---------|-------------------|-------------------|
| `users/{uid}` | ❌ negado | ✅ read/write |
| `users/{uid}/public/profile` | ✅ read | ✅ write |
| `publicProfiles/{uid}` | ✅ read | ✅ write (canônico para portfólio) |
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
3. Perfil do escritório: `getDoc(publicProfiles/{uid})`.

### `/u/:slug`

1. `getDoc(slugs/{slug})` → `uid`.
2. `getDoc(publicProfiles/{uid})` (fallback: `users/{uid}/public/profile`).
3. `list projects` com `where userId == uid` e `where visibility == 'public'` (portfólio).

---

## Dados públicos vs privados

### `users/{uid}/public/profile` (público)

- `name`, `companyName`, `companyBio`, `companyLogo`
- `publicSlug`, `portfolioEnabled`
- `websiteUrl`, `instagramUrl`, `youtubeUrl`, `linkedinUrl`, `whatsappUrl`

Sincronizado em `createUserProfile` e `saveUserSettings`.

### `users/{uid}` (privado — nunca expor a anônimos)

- `email`
- `plan`, `billing`
- `legalConsent`
- timestamps internos

---

## Listagem pública de imagens por `projectId`

`allow list` usa `get(projects/{projectId})` para verificar se o projeto pai é `shared` ou `public`. A query pública é apenas `where('projectId', '==', id)` — não lista imagens de projeto `private`.

Imagens `shared` em projeto `private` são acessíveis via `get` (`/share/image/:id`), mas **não** aparecem em listagens por `projectId`.

---

## Migração de perfil público

Contas anteriores à Sprint 13.3 podem não ter `publicProfiles/{uid}`. Backfill automático:

- no login (`AuthContext` → `ensurePublicProfileForUser`)
- em `getUser` (header/settings)

O owner precisa entrar no app uma vez para o portfólio voltar a funcionar.

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

## Riscos remanescentes (fora do escopo 13.3)

1. **Limites de plano** — enforcement só no cliente/services; owner pode alterar `plan`/`portfolioEnabled` via SDK (C-03 da auditoria).
2. **URLs de Storage com token** — vazamento de link = vazamento de arquivo (ver acima).
3. **Backfill** — `projectVisibility` e `public/profile` em dados legados.
4. **Revogação de share** — URLs já emitidas podem continuar válidas até rotação de token.

---

## Publicar rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Testar manualmente os cenários da Sprint 13.3 (owner vs anônimo) após deploy.
