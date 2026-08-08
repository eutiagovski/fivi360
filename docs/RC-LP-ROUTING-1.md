# RC-LP-ROUTING-1 — Arquitetura de rotas públicas e Landing Pages

## Objetivo

Preparar a arquitetura de rotas para campanhas de pré-lançamento, corrigir o redirect indevido da Home autenticada e reservar o namespace `/lp/*`, sem implementar formulário, captação, WhatsApp ou tracking UTM persistido.

**Build completo:** não executado.  
**Deploy:** não realizado.

---

## Arquitetura anterior

O roteamento vivia em `src/App.js` com três wrappers relevantes:

| Wrapper | Comportamento |
|---|---|
| `LandingRoute` | Visitante via Home; **autenticado → `/dashboard`** |
| `PublicRoute` | Login/register/forgot; autenticado → `/dashboard` |
| `ProtectedRoute` | Privado + `LegalConsentGate` |

Share, Embed, Portfólio (`/u/*`) e páginas legais já eram públicos sem wrapper.

Não existiam `GuestRoute`, `AuthRoute` nem pasta `src/landing-pages/`.

---

## Causa do redirect da Home

`src/components/auth/LandingRoute.jsx` redirecionava qualquer `user` autenticado:

```js
if (user) {
  return <Navigate to="/dashboard" replace />;
}
```

Isso impedia usuários logados de ver a Home institucional, navegar pelo site público ou abrir futuras LPs a partir da mesma sessão.

---

## Três conceitos explícitos

### PUBLIC_ALWAYS

Acessível autenticado ou não. Sem redirect por sessão. Sem `LegalConsentGate`.  
Não depende de loading de perfil Firestore para renderizar conteúdo básico.

Implementação: `PublicAlwaysRoute` + `resolvePublicAlwaysRoute` (sempre `"children"`).

Exemplos: `/`, `/lp/*`, `/share/*`, `/embed/*`, `/u/*`, `/termos`, `/privacidade`.

### GUEST_ONLY

Visitantes veem a página; autenticados vão para `/dashboard` (comportamento preservado).

Implementação: `GuestRoute` + `resolveGuestRoute`.  
`PublicRoute` permanece como alias de `GuestRoute`.

Exemplos: `/login`, `/register`, `/forgot-password`.

### PRIVATE

Exige autenticação (+ verificação de e-mail quando aplicável) e passa por `LegalConsentGate`.

Implementação: `ProtectedRoute` (inalterada em regra de segurança).

Exemplos: `/dashboard`, `/projects/*`, `/settings`, `/plan`, `/images`, `/viewer/:imageId`, `/help`.

---

## Matriz final de rotas

| Rota | Estado anterior | Estado desejado / atual |
|---|---|---|
| `/` | LandingRoute → auth redirecionava | **PUBLIC_ALWAYS** |
| `/login` | PublicRoute (guest) | **GUEST_ONLY** |
| `/register` | PublicRoute (guest) | **GUEST_ONLY** |
| `/forgot-password` | PublicRoute (guest) | **GUEST_ONLY** |
| `/lp/*` | inexistente | **PUBLIC_ALWAYS** |
| `/lp/acesso-antecipado` | inexistente | **PUBLIC_ALWAYS** |
| `/share/*` | público (sem wrapper) | **PUBLIC_ALWAYS** |
| `/embed/*` | público (sem wrapper) | **PUBLIC_ALWAYS** |
| `/u/*` | público (sem wrapper) | **PUBLIC_ALWAYS** |
| `/termos` | público | **PUBLIC_ALWAYS** |
| `/privacidade` | público | **PUBLIC_ALWAYS** |
| `/dashboard` | ProtectedRoute | **PRIVATE** |
| `/projects` | ProtectedRoute | **PRIVATE** |
| `/projects/:id` | ProtectedRoute | **PRIVATE** |
| `/settings` | ProtectedRoute | **PRIVATE** |
| `/plan` | ProtectedRoute | **PRIVATE** |
| `/pricing` | Navigate → `/plan` | inalterado (PRIVATE via `/plan`) |
| `/images`, `/viewer/:imageId`, `/help` | ProtectedRoute | **PRIVATE** |

---

## Alterações na Home

1. `/` passou a usar `PublicAlwaysRoute` — autenticado permanece na Home.
2. `LandingHeader` passou a ler `useAuth`:
   - deslogado: **Entrar** + **Começar grátis**;
   - autenticado: **Ir para o Dashboard**.
3. Design geral da Home não foi alterado.
4. `LandingPricing` já tratava CTAs autenticados; agora esse caminho fica alcançável.

---

## Estrutura `landing-pages`

```text
src/landing-pages/
  access-early/
    AccessEarlyLandingPage.jsx
    config.js
    index.js
    components/
    sections/
    hooks/
```

Isolada de `src/pages/` para facilitar migração futura a `apps/lp/` ou monorepo equivalente.

---

## Placeholder criado

Rota: `/lp/acesso-antecipado`

Conteúdo mínimo:

- FIVI360
- Acesso antecipado
- Estamos preparando algo novo para arquitetos e designers.
- Em breve.

Sem formulário, hero definitivo, benefícios, vídeo ativo ou CTA de campanha.

---

## Preparação do vídeo

`src/landing-pages/access-early/config.js`:

```js
export const ACCESS_EARLY_CONFIG = {
  videoUrl: "",
};
```

Com `videoUrl` vazio, nenhum iframe é renderizado.

---

## Query params

A LP não limpa `location.search`, não redireciona para URL sem parâmetros e não faz `history.replace` desnecessário.  
UTMs como `?utm_source=instagram&utm_medium=stories&...` permanecem na URL para a Sprint 2 capturar.

---

## LegalConsentGate e auth loading

| Superfície | LegalConsentGate | Perfil Firestore |
|---|---|---|
| Home `/` | Não (fora de ProtectedRoute) | Header/pricing usam só `user` do AuthContext; sem `ensureUserStructure` |
| `/lp/acesso-antecipado` | Não | Não usa Auth / perfil |
| Rotas PRIVATE | Sim (via ProtectedRoute) | Sim (fluxo existente) |

`PublicAlwaysRoute` renderiza filhos imediatamente, sem spinner de auth.

Lógica interna do `LegalConsentGate` **não** foi alterada — apenas confirmado que ele continua exclusivo de `ProtectedRoute`.

---

## Preparação para monorepo

A LP importa apenas:

- `react-router-dom` (`Link`, `useLocation`);
- config local.

Evita: `ProjectService`, Billing, `ProjectContext`, `PlanContext`, Viewer admin, hooks privados, AuthGate.

---

## Arquivos alterados / criados

### Criados

- `src/components/auth/PublicAlwaysRoute.jsx`
- `src/components/auth/GuestRoute.jsx`
- `src/landing-pages/access-early/*`
- `src/components/auth/PublicAlwaysRoute.test.jsx`
- `src/components/auth/GuestRoute.test.jsx`
- `src/components/auth/ProtectedRoute.lpRouting.test.jsx`
- `src/components/auth/routeArchitecture.lpRouting.test.js`
- `src/components/landing/LandingHeader.auth.test.jsx`
- `src/landing-pages/access-early/AccessEarlyLandingPage.test.jsx`
- `docs/RC-LP-ROUTING-1.md`

### Alterados

- `src/App.js` — classificação de rotas + `/lp/acesso-antecipado`
- `src/components/auth/authRouteGuards.js` — PUBLIC_ALWAYS / GUEST_ONLY
- `src/components/auth/LandingRoute.jsx` — alias de PublicAlwaysRoute
- `src/components/auth/PublicRoute.jsx` — alias de GuestRoute
- `src/components/auth/ProtectedRoute.jsx` — comentário PRIVATE
- `src/components/landing/LandingHeader.jsx` — CTA autenticado
- `src/components/auth/authRouteGuards.test.js` — cobertura dos três conceitos

---

## Testes executados

Comando (somente suites relacionadas):

```bash
npm test -- --watchAll=false --testPathPattern="authRouteGuards|PublicAlwaysRoute|GuestRoute|ProtectedRoute.lpRouting|routeArchitecture.lpRouting|AccessEarlyLandingPage|LandingHeader.auth"
```

Resultado: **7 suites, 38 testes — todos passando**.

Cobertura principal:

- visitante / autenticado em PUBLIC_ALWAYS;
- guest-only em login/register;
- PRIVATE + LegalConsentGate;
- LP placeholder, query params, `videoUrl` vazio;
- estrutura `landing-pages`;
- wiring em `App.js`.

**Build completo:** não executado.

---

## Validação manual (checklist)

### Deslogado

- [ ] `/` → Home
- [ ] `/login` → Login
- [ ] `/register` → Cadastro
- [ ] `/lp/acesso-antecipado` → Placeholder LP
- [ ] `/lp/acesso-antecipado?utm_source=instagram&utm_medium=stories` → LP com query intacta

### Logado

- [ ] `/` → Home, sem redirect
- [ ] Header mostra “Ir para o Dashboard”
- [ ] `/lp/acesso-antecipado` → LP, sem redirect
- [ ] `/dashboard` → Dashboard
- [ ] `/projects` → Projetos
- [ ] `/login` → redirect para `/dashboard` (guest-only)

### Públicos existentes

- [ ] `/share/...`
- [ ] `/embed/...`
- [ ] `/u/...`
- [ ] `/termos`, `/privacidade`

---

## Riscos residuais

1. Home autenticada ainda usa `useAuth` no header/pricing — acoplamento leve ao AuthContext (não ao perfil Firestore / LegalConsentGate). Aceitável nesta sprint.
2. `/pricing` continua redirecionando para `/plan` (PRIVATE); não é LP e não foi alterado.
3. Namespace `/lp/*` só tem a primeira rota registrada; rotas futuras precisam ser adicionadas explicitamente em `App.js`.
4. Validação manual depende do ambiente local do desenvolvedor (checklist acima).

---

## Confirmações

| Item | Status |
|---|---|
| `/` PUBLIC_ALWAYS | Feito |
| `/lp/*` reservado + placeholder | Feito |
| `/login` e `/register` GUEST_ONLY | Preservado |
| Páginas privadas PRIVATE | Preservado (`/projects/:id` incluso) |
| LP isolada em `src/landing-pages` | Feito |
| Query params preservados | Feito |
| LP sem LegalConsentGate / perfil | Feito |
| `videoUrl` preparado (vazio) | Feito |
| Coleção / Function / banco | **Não criados** |
| Build completo | **Não executado** |
| Deploy | **Não realizado** |
