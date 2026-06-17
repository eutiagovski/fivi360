# Modelo de perfil público

**Sprint Public Profile Cleanup 2** — arquitetura canônica do portfólio público.

---

## Visão geral

| Coleção | Uso | Leitura anônima |
|---------|-----|-----------------|
| `users/{uid}` | Dados privados da conta (plano, billing, legal) | ❌ negada |
| `publicProfiles/{uid}` | Perfil público do portfólio | ✅ somente se `portfolioAvailable == true` |
| `slugs/{slug}` | Resolução de slug → `uid` | ✅ `get` |

O app **não** usa `users/{uid}` como fonte pública. Campos de portfólio (`slug`, `portfolioEnabled`, etc.) vivem em `publicProfiles/{uid}`.

---

## `users/{uid}` — schema privado

| Campo | Descrição |
|-------|-----------|
| `displayName` | Nome de exibição (espelhado em `publicProfiles` ao salvar Settings) |
| `email` | E-mail da conta |
| `plan` | Plano efetivo (objeto ou legado string) |
| `billing` | Estado de cobrança |
| `legalConsent` | Aceite de termos/privacidade |
| `welcomeEmailQueuedAt` | Controle de e-mail de boas-vindas |
| `createdAt`, `updatedAt` | Timestamps |

**Não persistir em `users/{uid}`:** `publicSlug`, `portfolioEnabled`, `portfolioAvailable` — esses campos pertencem a `publicProfiles/{uid}`.

**Nunca expor a anônimos:** `email`, `plan`, `billing`, `legalConsent`.

---

## `publicProfiles/{uid}` — schema público

| Campo | Descrição |
|-------|-----------|
| `uid` | Mesmo valor que o ID do documento |
| `displayName` | Nome de exibição |
| `companyName` | Nome do escritório |
| `companyLogo` | URL do logo |
| `bio` | Bio / descrição curta |
| `slug` | Slug do portfólio (`/u/:slug`) — mapeado como `publicSlug` na UI |
| `portfolioEnabled` | Portfólio ativo pelo usuário (`true` / `false`) |
| `portfolioAvailable` | Portfólio efetivamente público (`portfolioEnabled` + plano elegível) |
| `socialLinks` | `{ website, instagram, youtube, linkedin, whatsapp }` |
| `createdAt`, `updatedAt` | Timestamps |

**Nunca incluir em `publicProfiles`:** `email`, `plan`, `billing`, `legalConsent`.

`portfolioAvailable` é recalculado em `saveUserSettings` e no webhook Stripe quando o plano muda.

---

## `slugs/{slug}` — schema de resolução

| Campo | Descrição |
|-------|-----------|
| `uid` | Dono do slug |
| `type` | `"user"` |
| `createdAt` | Timestamp de criação |
| `updatedAt` | Timestamp da última alteração (quando aplicável) |

O ID do documento é o slug normalizado (`a-z`, `0-9`, `-`). Garante unicidade global.

---

## Fluxos

### Settings (autenticado)

1. `getUser(uid)` → lê `users/{uid}` + `publicProfiles/{uid}` (owner).
2. `saveUserSettings` → atualiza `users/{uid}` (campos privados) + `publicProfiles/{uid}` (campos públicos); transação quando o slug muda (`slugs/{slug}`).

### `/u/:slug` (anônimo)

1. `getDoc(slugs/{slug})` → `uid`.
2. `getDoc(publicProfiles/{uid})` → perfil (rules exigem `portfolioAvailable == true` para leitura anônima).
3. Se `portfolioAvailable !== true` → portfólio indisponível.
4. `list projects` com `userId == uid` e `visibility == 'public'` (rules exigem `portfolioAvailable` no dono).

### Cadastro

`createUserProfile` cria `users/{uid}` e `publicProfiles/{uid}` em paralelo.

---

## Serviços e páginas

| Componente | Leitura pública |
|------------|-----------------|
| `getPublicUserBySlug` / `getPublicUserById` | Apenas `publicProfiles/{uid}` |
| `PublicPortfolio`, `PublicPortfolioProject`, `PublicSharedProject`, `usePublicViewerImage` | Via serviços acima |

---

## Publicar rules após alterações

```bash
firebase deploy --only firestore:rules
```
