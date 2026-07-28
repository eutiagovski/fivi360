# RC-BUG-001 — Diagnóstico: cadastro por e-mail (verification + emailQueue)

**Status:** corrigido em RC-BUG-001-FIX (ver `docs/RC-BUG-001-FIX.md`)  
**Data:** 2026-07-27  
**Deploy:** nenhum  
**Dados reais:** nenhum alterado

---

## 1. Fluxo completo do cadastro (sequência real)

Rota: `/register` → `PublicRoute` → `SignUp`

```
SignUp.handleSubmit
  └─ await AuthContext.signUp(email, password, name)
       ├─ await signUpWithEmail()                    // authService
       │    └─ createUserWithEmailAndPassword()      // Firebase Auth SDK
       │         └─ onAuthStateChanged → setUser()   // paralelo (listener)
       │              └─ PublicRoute: Navigate /dashboard
       │                   └─ ProtectedRoute: Navigate /verify-email  (flash UI)
       ├─ await createUserProfile(uid, {
       │      displayName, email, acceptedSource: "signup",
       │      enqueueVerifyEmail: true
       │    })
       │    ├─ writeBatch: users + publicProfiles + workspace + member
       │    └─ try { await enqueueVerifyEmail() } catch { /* engole */ }
       │         └─ addDoc(emailQueue)               // client SDK
       ├─ await authLogout() / signOut()
       │    └─ onAuthStateChanged → user=null
       │         └─ VerifyEmailRoute: Navigate /login
       └─ trackEvent("sign_up")
  └─ setSignupSuccessEmail(email)   // frequentemente NÃO visível (SignUp já desmontado)
```

**Diferença vs expectativa do bug report:** o código **não** navega para `/verify-email` de propósito no cadastro. O design atual faz **logout imediato** e deveria mostrar “Confirme seu e-mail” **na própria** `/register`. O flash de “Verifique seu e-mail” é efeito colateral de redirect por Auth state.

---

## 2. Arquivos envolvidos

| Arquivo | Papel |
|---------|--------|
| `src/pages/SignUp.js` | UI cadastro / submit |
| `src/hooks/useAuth.js` | Acesso ao contexto |
| `src/contexts/AuthContext.jsx` | Orquestra signUp → profile → logout |
| `src/services/auth/authService.js` | Auth SDK + `needsEmailVerification` |
| `src/services/users/userService.js` | `createUserProfile` + enqueue |
| `src/services/email/emailQueueService.js` | `addDoc` em `emailQueue` |
| `src/components/auth/PublicRoute.jsx` | Se `user` → `/dashboard` |
| `src/components/auth/ProtectedRoute.jsx` | Se não verificado → `/verify-email` |
| `src/components/auth/VerifyEmailRoute.jsx` | Se `!user` → `/login` |
| `src/pages/VerifyEmail.js` | Tela “Verifique seu e-mail” |
| `firestore.rules` | `emailQueue` create restrito |
| `functions/src/processEmailQueue.js` | Envio (só se doc existir) |

---

## 3. Sequência real das chamadas (async / try-catch)

| # | Função | Arquivo | await? | try/catch | Propaga? |
|---|--------|---------|--------|-----------|----------|
| 1 | `handleSubmit` | SignUp.js | sim | catch → formError | não |
| 2 | `signUp` | AuthContext.jsx | sim | catch → setError + throw | sim |
| 3 | `signUpWithEmail` | authService.js | sim | nenhum | sim |
| 4 | `createUserProfile` | userService.js | sim | batch: throw; enqueue: **engole** | batch sim / enqueue **não** |
| 5 | `enqueueVerifyEmail` → `enqueueEmail` | emailQueueService.js | sim | (após instrumentação) log + throw | sim (até o catch do #4) |
| 6 | `authLogout` | authService.js | sim | nenhum no signUp | sim |
| 7 | `setSignupSuccessEmail` | SignUp.js | — | — | — |

Não há `finally` com navigate. Não há `navigate("/verify-email")` no fluxo de cadastro.

---

## 4. Última etapa executada antes da falha (síntese)

Evidência de teste manual + código:

- **Auth:** criado  
- **users (+ publicProfiles + workspace):** criados (`batch.commit` ok)  
- **emailQueue:** **não** aparece  

Conclusão: o fluxo **chega** em `enqueueVerifyEmail` (flag `true` após batch ok). A falha ocorre **na escrita** `addDoc(emailQueue)` **ou** o erro é engolido sem rastro (antes desta instrumentação).

---

## 5. Primeira etapa que não executa / não surte efeito

1. **Persistência de `emailQueue`** — documento não materializa.  
2. **UI estável em verificação** — não permanece em `/verify-email`; logout força saída.  
3. **`setSignupSuccessEmail`** — SignUp costuma já ter sido desmontado pelo `PublicRoute`.

---

## 6. Stack trace encontrado

Nenhum stack capturado em runtime nesta sessão (investigação estática + instrumentação).

Antes da instrumentação, falhas de enqueue só logavam em dev:

```text
[FIVI360] Failed to enqueue verify email: <err>
```

e **não** propagavam para a UI.

Logs temporários `[Signup] *` foram adicionados (somente `NODE_ENV === "development"`). Reproduzir o cadastro e coletar o console confirma `code` / `message` / `stack`.

---

## 7. Causa raiz identificada

### A) Flash UI “Verifique seu e-mail” → volta para auth (**confirmado por código**)

Causa: **race entre sessão Auth e guards de rota**, somada ao **logout intencional** pós-cadastro.

1. `createUserWithEmailAndPassword` autentica o usuário.  
2. `onAuthStateChanged` preenche `user` no contexto.  
3. `PublicRoute` (`/register`) redireciona autenticados para `/dashboard`.  
4. `ProtectedRoute` vê `needsEmailVerification` → `/verify-email` → título **“Verifique seu e-mail”**.  
5. `AuthContext.signUp` chama `authLogout()`.  
6. `VerifyEmailRoute` com `!user` → **`/login`** (não `/register`).

Observação do tester (“volta para cadastro”) alinha-se a tela de auth pós-logout; pelo código o destino é **`/login`**.

### B) `emailQueue` vazia (**alta confiança: erro engolido na enqueue**)

Em `createUserProfile`:

- `enqueueVerifyEmail` está em `try/catch` que **não relança**.  
- Signup “sucesso” mesmo se a fila falhar.  
- Auth + `users` existem; e-mail nunca é enfileirado.

Rules (`isValidEmailQueueCreate`) exigem, entre outros:

- `isSignedIn()`
- `userId == request.auth.uid`
- **`to == request.auth.token.email`** (match exato)
- `type` ∈ `welcome | verify_email | billing_upgrade_requested`
- `status == pending`

O cliente envia `to: email` do **formulário**, não `authUser.email`. Se houver divergência (ex.: casing) → `permission-denied` → catch silencioso → sem doc.

**Rules:** não bloqueiam `verify_email` por tipo. Bloqueiam create anônimo, create para e-mail de terceiros, e campos inválidos.

Instrumentação agora loga `toMatchesAuthEmail`, `authEmail`, `code`, `stack`.

### C) Desalinhamento de produto (design vs expectativa)

Esperado no bug: permanecer em “Verifique seu e-mail” autenticado.  
Implementado: **logout** + mensagem “Confirme seu e-mail” em `/register` (quebrada pela race A).

---

## 8. Proposta mínima de correção (NÃO implementar agora)

1. **Parar race de redirect no signup**  
   - Opção A: `PublicRoute` não redireciona enquanto e-mail/senha não verificado (ou flag `signupInProgress`).  
   - Opção B: após signup, `navigate("/verify-email")` **sem** logout; logout só no botão “Sair”.  
2. **Não engolir falha de enqueue no cadastro**  
   - Propagar erro **ou** retry com `to: auth.currentUser.email`.  
   - Sempre usar e-mail do Auth token no `to`.  
3. **Unificar UX**  
   - Ou sucesso em `/register` (sem redirect), ou sessão em `/verify-email` até confirmar — não os dois em conflito.

---

## 9. Impacto esperado da correção

- Usuário permanece na tela de verificação coerente.  
- `emailQueue` recebe `verify_email` → `processEmailQueue` envia o link.  
- Auth / `users` / workspace inalterados no happy path.

---

## 10. Arquivos que precisarão ser alterados (sprint de correção)

- `src/contexts/AuthContext.jsx` (logout / ordem / e-mail do Auth)  
- `src/components/auth/PublicRoute.jsx` (exceção unverified)  
- `src/services/users/userService.js` (não engolir enqueue no signup)  
- `src/services/email/emailQueueService.js` (usar e-mail Auth)  
- Possivelmente `src/pages/SignUp.js` + `VerifyEmailRoute.jsx` (UX final)  
- Testes: rules `emailQueue` + fluxo signup (hoje sem cobertura de rules para a fila)

---

## 11. Riscos

- Remover logout sem ajustar guards pode deixar unverified no app.  
- Propagar erro de enqueue pode falhar signup após Auth+users criados (órfãos) — precisa política (compensating / retry).  
- Afrouxar rule `to == token.email` aumenta risco de spam a terceiros.

---

## 12. Confirmação: nenhum deploy

Nenhum deploy foi realizado nesta investigação.

---

## 13. Confirmação: nenhum dado real alterado

Nenhuma escrita em Firebase de produção. Apenas instrumentação local de logs em development.

---

## Instrumentação temporária (manter até fechar investigação)

Prefixo: `[Signup]`

Arquivos: `SignUp.js`, `AuthContext.jsx`, `userService.js`, `emailQueueService.js`, `PublicRoute.jsx`, `ProtectedRoute.jsx`, `VerifyEmailRoute.jsx`.

**Como validar:** cadastro em dev → console deve mostrar a cadeia até `emailQueue.addDoc` (ok ou exceção com `code`).
