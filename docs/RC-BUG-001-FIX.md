# RC-BUG-001-FIX — Cadastro por e-mail, emailQueue e verificação

**Status:** correção implementada (sem deploy)  
**Data:** 2026-07-27  
**Deploy:** nenhum  
**Dados reais:** nenhum alterado  
**Firebase produção / Stripe Dashboard:** não alterados

---

## Causa raiz final confirmada

### 1) Falha silenciosa da `emailQueue` (defeito principal de envio)

Em `createUserProfile`, o parâmetro `enqueueVerifyEmail` (boolean) **sombreava** o import da função `enqueueVerifyEmail`.

Com a flag `true`, o código executava efetivamente `await true({ ... })`, gerava `TypeError`, e o `try/catch` **engolia** o erro. Resultado:

- Auth + `users` + `publicProfiles` + workspace + member criados;
- `emailQueue` nunca criada;
- UI tratava o fluxo como sucesso de envio.

Além disso, o `to` podia vir do formulário (não do e-mail canônico do Auth), o que também quebraria a rule `to == request.auth.token.email` mesmo após corrigir o shadowing.

### 2) Race de navegação (flash UI)

Após `createUserWithEmailAndPassword`, `onAuthStateChanged` autenticava o usuário enquanto o signup ainda rodava:

`PublicRoute` → `/dashboard` → `ProtectedRoute` → `/verify-email` → `authLogout()` → `VerifyEmailRoute` → `/login`

Não havia navegação explícita pós-cadastro estável.

---

## Estratégia de UX escolhida

**B — rota pública de confirmação após logout**

1. criar Auth;
2. criar estrutura Firestore;
3. enfileirar verificação (com e-mail canônico);
4. logout (após tentativa de enqueue);
5. `navigate("/verify-email-sent")` explícito;
6. tela pública estável (não exige sessão).

`/verify-email` permanece para login com conta ainda não verificada (reenvio autenticado).

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/services/users/userService.js` | Renomeia binding do flag (`shouldEnqueueVerifyEmail`); resultado estruturado; não engole falha de enqueue |
| `src/services/email/emailQueueService.js` | `to` = `auth.currentUser.email`; logs de erro úteis |
| `src/contexts/AuthContext.jsx` | `signUpInProgress`; e-mail canônico; logout pós-enqueue; `SignUpResult` |
| `src/pages/SignUp.js` | Navegação explícita para `/verify-email-sent` |
| `src/pages/VerifyEmailSent.js` | **Novo** — tela pública sucesso/falha parcial |
| `src/utils/verifyEmailSentState.js` | sessionStorage para refresh |
| `src/App.js` | Rota `/verify-email-sent` |
| `src/components/auth/authRouteGuards.js` | **Novo** — decisões puras das guards |
| `src/components/auth/PublicRoute.jsx` | Respeita `signUpInProgress` |
| `src/components/auth/ProtectedRoute.jsx` | Loading durante signup (sem flash) |
| `src/components/auth/VerifyEmailRoute.jsx` | Loading durante signup |
| Testes unitários + rules `emailQueue` | Cobertura A–G / Rules |
| `docs/RC-BUG-001-FIX.md` | Este documento |

**Não alterados:** Firestore Rules (apenas testes), Google Login, Stripe, billing, LegalConsentGate (consome retorno sem mudança de contrato crítico), REG-002/003.

---

## Fluxo anterior

```
SignUp → createUser → onAuth flash /dashboard→/verify-email
      → createUserProfile (enqueue engolido / shadowing)
      → logout → VerifyEmailRoute → /login
      → setSignupSuccessEmail (frequentemente nunca visível)
```

## Fluxo novo

```
SignUp → signUpInProgress=true
      → createUser (PublicRoute não redireciona)
      → createUserProfile(email canônico) + enqueueVerifyEmail(auth.email)
      → logout
      → resultado estruturado
      → persist sessionStorage + navigate(/verify-email-sent)
      → clearSignUpInProgress
```

---

## Tratamento de sucesso

```js
{
  userCreated: true,
  profileCreated: true,
  verificationEmailQueued: true,
  email: "<auth canonical>",
  logoutCompleted: true
}
```

UI: “Conta criada com sucesso” + e-mail + instrução inbox/spam + link login.

## Tratamento de falha parcial (enqueue)

```js
{
  userCreated: true,
  profileCreated: true,
  verificationEmailQueued: false,
  email: "<auth canonical>",
  logoutCompleted: true|false,
  errorCode: "verification-email-queue-failed"
}
```

- Auth/docs **não** são apagados;
- UI **não** afirma que o e-mail foi enviado;
- mensagem: conta criada, envio falhou; orientar login + reenvio em `/verify-email`;
- formulário **não** volta silenciosamente ao estado inicial vazio.

**Limitação documentada do reenvio na tela pública:** Rules exigem usuário autenticado e `to == token.email`. Sem sessão, o reenvio direto não é possível sem bypass. A UI orienta login → `/verify-email` → Reenviar.

---

## E-mail canônico

1. `AuthContext.signUp` usa `authUser.email` (retorno de `signUpWithEmail` / `userCredential.user`).
2. `createUserProfile` grava esse e-mail em `users.email`.
3. `enqueueVerifyEmail` usa **exclusivamente** `auth.currentUser.email` no campo `to` (fonte alinhada ao token das Rules).

---

## Como a race foi eliminada

- Flag `signUpInProgress` no `AuthContext`.
- `PublicRoute`: se `user && signUpInProgress` → permanece no formulário.
- `ProtectedRoute` / `VerifyEmailRoute`: durante signup → loading (não navegam).
- Destino final **explícito** via `navigate("/verify-email-sent")`, não via guards.
- Flag limpa só após navegação (`clearSignUpInProgress` no `finally` do SignUp).

---

## Firestore Rules

**Não alteradas.** Mantida a exigência:

- autenticado;
- `to == request.auth.token.email`;
- tipo permitido;
- payload/status válidos.

Novos testes de rules cobrem create canônico, `to` diferente, anônimo, tipo inválido, payload inválido e casing mismatch.

---

## Testes adicionados

| Suite | Cobertura |
|-------|-----------|
| `createUserProfile.signup.test.js` | A, B, C + shadowing fix |
| `emailQueueService.test.js` | e-mail canônico / missing auth |
| `AuthContext.signup.test.jsx` | A, C, D, E, G |
| `authRouteGuards.test.js` | D, F, G |
| `verifyEmailSentState.test.js` | persistência / refresh |
| `firestore.rules.test.js` (`emailQueue`) | Rules create/reject |

---

## Resultado dos testes

- Unitários RC-BUG-001: **23 passed**
- Firestore rules: **35 passed** (inclui 6 novos de `emailQueue`)
- Build: **sucesso** (warnings ESLint pré-existentes fora do escopo)

---

## Logs

- Removidos logs temporários `[Signup] *` de diagnóstico.
- Preservados `console.error` com `stage`, `code`, `message`, `stack` em falhas de batch/enqueue/logout.
- Sem senhas, tokens ou payloads sensíveis.

---

## Riscos residuais

1. Reenvio na tela pública exige login (limitação das Rules — intencional).
2. Contas órfãs Auth+Firestore se o batch falhar após Auth (pré-existente; fora do escopo de rollback).
3. Se logout falhar, `signUpInProgress` + navegação para rota pública ainda evitam loop; usuário pode permanecer autenticado até refresh.
4. Worker `processEmailQueue` precisa estar ativo para o e-mail chegar de fato (fora deste sprint).

---

## Confirmações

| Item | Status |
|------|--------|
| Google Login não regrediu (`signUpInProgress` só no email signup; teste G) | OK |
| Nenhum deploy | OK |
| Nenhum dado real alterado | OK |
| Firebase produção não alterado | OK |
| Stripe Dashboard não alterado | OK |
| Rules não enfraquecidas | OK |
| Usuário não verificado não liberado no app | OK (`ProtectedRoute` + logout pós-signup) |
