# Modelo de perfil público

**Fonte canônica:** `publicProfiles/{uid}`

---

## Resumo

| Coleção / documento | Uso | Leitura anônima |
|---------------------|-----|-----------------|
| `publicProfiles/{uid}` | Perfil público do portfólio | ✅ permitida |
| `users/{uid}` | Dados privados da conta (settings, plano, billing) | ❌ negada |
| `users/{uid}/public/profile` | **Legado — descontinuado** | ❌ negada |

O app **não cria, lê nem atualiza** mais `users/{uid}/public/profile`. Documentos legados permanecem no Firestore até limpeza manual futura.

---

## `publicProfiles/{uid}` — campos públicos

| Campo | Descrição |
|-------|-----------|
| `name` | Nome de exibição (pessoa) |
| `companyName` | Nome do escritório |
| `companyLogo` | URL do logo |
| `companyBio` | Bio / descrição curta |
| `publicSlug` | Slug do portfólio (`/u/:slug`) |
| `portfolioEnabled` | Portfólio ativo (`true` / `false`) |
| `websiteUrl` | Site |
| `instagramUrl` | Instagram |
| `youtubeUrl` | YouTube |
| `linkedinUrl` | LinkedIn |
| `whatsappUrl` | WhatsApp |
| `updatedAt` | Timestamp da última sync pública |

**Nunca** incluir em `publicProfiles`: `email`, `plan`, `billing`, `legalConsent`.

---

## `users/{uid}` — campos privados

Espelha os mesmos campos de perfil/portfólio para edição autenticada, além de:

- `email`
- `plan`, `billing`
- `legalConsent`
- `createdAt`, `updatedAt`

Settings lê/escreve `users/{uid}` e sincroniza os campos públicos em `publicProfiles/{uid}` via `saveUserSettings` / `createUserProfile`.

---

## Fluxos

### Settings (autenticado)

1. `getUser(uid)` → lê `users/{uid}` (owner).
2. `saveUserSettings` → atualiza `users/{uid}` + `publicProfiles/{uid}` (transação quando slug muda).
3. **Não** escreve em `users/{uid}/public/profile`.

### `/u/:slug` (anônimo)

1. `getDoc(slugs/{slug})` → `uid`.
2. `getDoc(publicProfiles/{uid})` → perfil.
3. Se `portfolioEnabled !== true` → portfólio indisponível.
4. `list projects` com `userId == uid` e `visibility == 'public'`.

### Backfill (contas antigas)

Contas sem `publicProfiles/{uid}` recebem backfill no login (`ensurePublicProfileForUser`) ou em `getUser`, copiando campos públicos de `users/{uid}`.

---

## Locais que usavam a estrutura legada

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `src/services/users/userService.js` | Escrita dupla + leitura com fallback | Só `publicProfiles/{uid}` |
| `firestore.rules` | `portfolioEnabledForOwner` com fallback legado; leitura pública de `/public/profile` | Só `publicProfiles`; legado owner-only |
| `docs/security-rules-notes.md` | Documentava ambas as estruturas | Atualizado |

Páginas públicas (`PublicPortfolio`, `PublicPortfolioProject`, `PublicSharedProject`, `usePublicViewerImage`) usam `getPublicUserBySlug` / `getPublicUserById`, que leem **apenas** `publicProfiles/{uid}`.

---

## Publicar rules após alterações

```bash
firebase deploy --only firestore:rules
```
