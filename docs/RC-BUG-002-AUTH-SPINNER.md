# RC-BUG-002-AUTH-SPINNER — Loading infinito após login

**Status:** correção implementada (sem deploy)  
**Data:** 2026-07-29  
**Deploy:** nenhum  
**Dados reais / Firebase produção / Stripe:** não alterados  
**Functions engines:** Node 22 mantido (`functions/package.json`)

---

## Resumo executivo

Após autenticação (e-mail/senha **ou** Google), a UI permanecia indefinidamente em `AuthLoadingScreen`. A autenticação Firebase concluía; o spinner vinha do **`LegalConsentGate`** (renderizado por `ProtectedRoute`), preso em `status === "loading"` por uma corrida com o **React StrictMode**.

---

## Causa raiz

Em `LegalConsentGate`, o bootstrap pós-auth chamava `ensureUserStructure` via `loadProfile`, protegido por `loadingRef` e invalidação de `loadRequestIdRef`.

Com React 18+ StrictMode (`src/index.js`):

1. Effect inicia o load → `loadingRef = true`, `requestId = N`
2. Cleanup do mount effect faz `loadRequestIdRef += 1` (invalida N)
3. Effect remonta e chama `loadProfile` de novo
4. Early-return `if (loadingRef.current) return` **bloqueia** o segundo load
5. O `finally` do primeiro request **não** libera `loadingRef` porque `requestId !== loadRequestIdRef.current`
6. Gate permanece em `LOADING` → spinner infinito

Os dois provedores param no **mesmo ponto** (depois do Auth), porque ambos passam por `ProtectedRoute` → `LegalConsentGate`.

---

## Fluxo afetado

```text
Login (email | Google)
→ Auth (signIn* / onAuthStateChanged)          ✅ concluía
→ AuthContext.loading = false                  ✅ concluía
→ PublicRoute / navigate → /dashboard          ✅ concluía
→ ProtectedRoute (user ok, signUpInProgress)   ✅ concluía
→ LegalConsentGate LOADING + ensureUserStructure  ❌ travava aqui
→ (nunca) consent ready / children
→ (nunca) Layout + Dashboard
```

### Última etapa concluída antes do spinner

`resolveProtectedRoute` retornava `"children"` e montava `LegalConsentGate`. O gate despachava `LOAD_START` e não saía de `loading`.

### Estado que permanecia pendente

`legalConsentGateReducer.status === "loading"` (`LEGAL_CONSENT_GATE_STATUS.LOADING`), com `loadingRef.current === true` órfão.

### Arquivo e linhas responsáveis (antes da correção)

- `src/components/legal/LegalConsentGate.jsx` — early-return em `loadingRef` + `finally` condicional ao `requestId` + bump de `loadRequestIdRef` no cleanup do mount sem liberar o lock.

---

## Relação com AuthContext

`AuthContext.loading` **não** era a causa: `subscribeToAuthChanges` sempre chama `setLoading(false)`.

Ajustes defensivos feitos neste sprint:

- limpar `signUpInProgress` quando `user === null` e no `signOut`;
- leitura de perfil / welcome email no login envolvida em try/catch (não derruba o sign-in).

---

## Relação com guards

`ProtectedRoute` / `PublicRoute` / `VerifyEmailRoute` usam `loading` e `signUpInProgress`. Com login normal, `signUpInProgress` é `false` (limpo no `finally` do SignUp e agora também no logout). As guards não entravam em ciclo; apenas entregavam o app ao `LegalConsentGate`, que era quem prendia o spinner.

---

## Relação com signUpInProgress

Não era a causa do spinner nos dois provedores (Google nunca seta a flag). Reforço: flag limpa em sessão nula / logout para não vazar de um signup anterior na mesma SPA session.

---

## Relação com documentos Firestore

`ensureUserStructure` (users / publicProfiles / workspace) podia estar em voo, mas o travamento ocorria **mesmo com a Promise resolvendo**, se o request ficasse inválido e o remount não reiniciasse. Documento parcial/ausente, com o fix, leva a `consent_required` ou `error` — não a spinner eterno.

---

## Relação com Rules

Erros tipo `permission-denied` no ensure já iam para `LOAD_ERROR` + `AuthErrorScreen` **quando** o request ativo completava. Com a corrida, o erro/sucesso do request órfão era descartado e o loading nunca terminava — aparentava “Rules silenciosas”, mas a causa era o lock.

---

## Correção aplicada

1. **`LegalConsentGate`**: load cancelável por cleanup do effect (`requestId`); removido o lock `loadingRef` que sobrevivia à invalidação; remount StrictMode inicia novo load; falha continua em `AuthErrorScreen` (retry + sair).
2. **`AuthContext`**: limpeza de `signUpInProgress` em logout / user null; welcome/profile best-effort no login.

Não foi usado `setTimeout` para forçar fim de loading.

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/legal/LegalConsentGate.jsx` | Bootstrap StrictMode-safe |
| `src/contexts/AuthContext.jsx` | Limpeza `signUpInProgress`; try/catch welcome no login |
| `src/components/legal/LegalConsentGate.test.jsx` | **Novo** — StrictMode, erro, perfil null |
| `src/contexts/AuthContext.bootstrap.test.jsx` | **Novo** — loading / Google / profile fail |
| `src/components/auth/authRouteGuards.test.js` | Casos RC-BUG-002 |
| `docs/RC-BUG-002-AUTH-SPINNER.md` | Este relatório |

---

## Testes adicionados ou atualizados

- `LegalConsentGate.test.jsx` — StrictMode remount completa; permission-denied encerra loading; profile null → consent; load ok → children
- `AuthContext.bootstrap.test.jsx` — user null/válido encerra loading; Google sem `signUpInProgress`; signIn com falha de perfil; logout limpa flag
- `authRouteGuards.test.js` — loading / children / login / `signUpInProgress` false no login normal
- RC-BUG-001 (`AuthContext.signup`, `verifyEmailSentState`, guards signup) — mantidos passando

---

## Resultado dos testes

Suite focada (auth/bootstrap/signup/guards/ensure/legal/verify):

```text
Test Suites: 7 passed, 7 total
Tests:       45 passed, 45 total
```

`src/utils/workspace.test.js` — passou.

Falhas pré-existentes fora do escopo (ex.: `publicSeo.test.js`, `projectService.cascade.test.js` ao filtrar por `workspace`) — **não** introduzidas por este bugfix.

---

## Resultado do build

```text
npm run build → sucesso (Compiled with warnings pré-existentes de hooks em páginas públicas)
```

Nenhum deploy executado.

---

## Validação manual

| Teste | Esperado | Status nesta entrega |
|-------|----------|----------------------|
| 1 Cadastro e-mail → verificar → login → dashboard | Sem spinner infinito | Pendente validação local com emuladores |
| 2 Cadastro Google → dashboard | Sem spinner infinito | Pendente |
| 3 Login posterior e-mail | Dashboard | Pendente |
| 4 Login posterior Google | Dashboard | Pendente |
| 5 Perfil ausente | Consent ou erro recuperável | Coberto por teste unitário |
| 6 permission-denied | Erro + retry/sair | Coberto por teste unitário |

A correção é determinística em unit tests com `React.StrictMode`. Recomenda-se confirmar os fluxos 1–4 nos emuladores antes do próximo commit de release.

---

## Riscos residuais

- Se `ensureUserStructure` / callable `repairUserWorkspaceFields` **nunca resolver** (rede/emulador travado), o spinner ainda permanece até falha — comportamento esperado de Promise pendente; não é o bug StrictMode.
- Dashboard ainda usa `AuthLoadingScreen` enquanto `useProjects` / `useRecentImages` / `usePlanLimits` carregam; esses hooks já têm `finally` e não eram a causa comum aos dois provedores no gate.

---

## Confirmações

- **Node 22** mantido em `functions/package.json` (`engines.node: "22"`).
- **Nenhum deploy** realizado.
- **Rules / Stripe / preços / planos** não alterados.
- **RC-BUG-001** (signup e-mail, verify-email-sent, `signUpInProgress`) permanece coberto pelos testes existentes.
