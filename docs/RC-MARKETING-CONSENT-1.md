# RC-MARKETING-CONSENT-1 — Consentimento para novidades e atualizações do FIVI360

**Data:** 29 de julho de 2026  
**Escopo:** checkbox opcional no cadastro + estrutura `marketingPreferences` no Firestore — sem campanhas, sem Resend Contacts, sem deploy  

---

## 1. Resumo executivo

Sprint **executado com sucesso**. O cadastro por e-mail passou a exibir o checkbox opcional *“Quero receber novidades e atualizações do FIVI360.”* (desmarcado por padrão), independente do aceite obrigatório de Termos/Privacidade. A escolha é convertida no service para a estrutura completa `users/{uid}.marketingPreferences`. Cadastro Google não presume consentimento. Usuários antigos sem o campo continuam compatíveis (default seguro = marketing desabilitado).

| Item | Resultado |
|------|-----------|
| Checkbox no cadastro | Sim — texto exato, opcional, unchecked |
| Independência dos Termos | Sim |
| Persistência Firestore | `marketingPreferences` completo (opt-in e opt-out) |
| Google | `enabled: false`, `consentSource: "google_signup_default"` |
| DTO público | `Date \| null` via `toAppDate` |
| Resend / campanhas | Não alterados / não enviados |
| Deploy | **Não executado** |
| Testes unitários | 33 suites / 282 testes — PASS |
| Testes Rules | 39 testes — PASS |
| Build | PASS (warnings ESLint pré-existentes) |

---

## 2. Arquitetura anterior

Antes deste sprint:

- Cadastro por e-mail: `SignUp` → `AuthContext.signUp` → `createUserProfile` com `legalConsent` obrigatório no formulário.
- Google: Auth apenas; perfil via `ensureUserStructure` + `LegalConsentGate` (modal de termos).
- E-mails transacionais: `emailQueue` → Cloud Functions → Resend (inalterados).
- Nenhum campo de marketing no documento do usuário.
- Rules de `users/{uid}` com allowlist rígida (sem `marketingPreferences`).

---

## 3. Estrutura escolhida para `marketingPreferences`

Estrutura **completa** (não a simplificada):

```js
marketingPreferences: {
  enabled: boolean,
  productUpdates: boolean,
  offers: boolean,
  tips: boolean,
  newsletter: boolean,
  research: boolean,
  consentVersion: string | null,
  consentSource: string | null,
  consentedAt: Timestamp | null,   // Firestore
  revokedAt: Timestamp | null,
  updatedAt: Timestamp
}
```

DTO público (`UserProfile.marketingPreferences`):

```js
{
  enabled, productUpdates, offers, tips, newsletter, research,
  consentVersion, consentSource,
  consentedAt: Date | null,
  revokedAt: Date | null,
  updatedAt: Date | null
}
```

Versão de consentimento nesta fase: `"beta-2026-01"`.

---

## 4. Motivo da estrutura adotada

Adotou-se o modelo completo (com `offers`, `tips`, `newsletter`, `research`) porque:

1. O texto do checkbox cobre novidades/atualizações, mas **não** ofertas promocionais específicas — `offers` / `newsletter` / `research` nascem `false`.
2. Segmentação futura (Resend Topics/Segments) precisa de canais separados sem nova migração de schema.
3. Campos de auditoria (`consentVersion`, `consentSource`, `consentedAt`, `revokedAt`) preparam descadastro e sincronização sem reescrever o documento.
4. A alternativa simplificada reduziria rework imediato no próximo sprint de marketing.

---

## 5. Texto incluído na interface

Texto exato:

> Quero receber novidades e atualizações do FIVI360.

Componente: `MarketingConsentCheckbox`  
Posição: abaixo do aceite de Termos/Privacidade, separado por `border-t`.  
Layout: `break-words` + `shrink-0` no checkbox para mobile.

---

## 6. Comportamento padrão

| Cenário | Comportamento |
|---------|----------------|
| Checkbox no formulário | Inicia **desmarcado** |
| Envio do formulário | Não exige marketing; não valida marketing |
| Opt-in | `enabled/productUpdates/tips = true`; `offers/newsletter/research = false`; `consentedAt = serverTimestamp()` |
| Opt-out | Toda a estrutura com flags `false`; `consentedAt = null` |
| Usuário antigo (campo ausente) | `DEFAULT_MARKETING_PREFERENCES` (tudo false/null) — **nunca** consentimento |

---

## 7. Comportamento no cadastro por e-mail

```
UI: marketingConsent: boolean
  → AuthContext.signUp(..., { marketingConsent })
  → createUserProfile({ marketingConsent, marketingConsentSource: "signup" })
  → buildMarketingPreferencesPayload(...)
  → users/{uid}.marketingPreferences
```

Fluxos de Auth, verificação de e-mail e welcome **não** foram alterados semanticamente.

---

## 8. Comportamento no cadastro pelo Google

**Decisão:** não adicionar etapa obrigatória de marketing ao fluxo Google.

- Google não passa por formulário intermediário de marketing.
- `ensureUserStructure` (criação do shell `users/{uid}`) grava:
  - `enabled: false`
  - `consentSource: "google_signup_default"`
  - `consentedAt: null`
- `LegalConsentGate` passa `marketingConsentSource` conforme `usesGoogleAuth`.
- Fallback raro de `createUserProfile` no gate também usa `marketingConsent: false` (sem presumir consentimento).

---

## 9. Compatibilidade com usuários existentes

- **Sem migração obrigatória.**
- `mapMarketingPreferences(undefined)` → `DEFAULT_MARKETING_PREFERENCES`.
- Ausência do campo = preferência ainda não informada = marketing desabilitado.
- Ausência **nunca** equivale a consentimento concedido.

---

## 10. Mappers e DTOs alterados

| Artefato | Alteração |
|----------|-----------|
| `marketingPreferences.js` | Novo — flags, payload, map, resolve, defaults |
| `userMappers.js` | `mapUserDoc` inclui `marketingPreferences` via `mapMarketingPreferences` + `toAppDate` |
| `UserProfile` typedef | Campo `marketingPreferences` com datas `Date \| null` |
| `userService.js` | `createUserProfile` aceita `marketingConsent` / `marketingConsentSource` |
| `ensureUserStructure.js` | Bootstrap com preferências opt-out + source configurável |

`serverTimestamp()` permanece nos services; o builder recebe o sentinela injetado (não vaza para UI).

---

## 11. Arquivos alterados

### Produção

| Arquivo | Mudança |
|---------|---------|
| `src/components/legal/MarketingConsentCheckbox.jsx` | Novo checkbox |
| `src/pages/SignUp.js` | Estado + UI + passe de `marketingConsent` |
| `src/contexts/AuthContext.jsx` | `signUp(..., { marketingConsent })` |
| `src/services/users/marketingPreferences.js` | Novo módulo |
| `src/services/users/userService.js` | Persistência no create |
| `src/services/users/userMappers.js` | DTO |
| `src/services/users/ensureUserStructure.js` | Google/bootstrap default |
| `src/components/legal/LegalConsentGate.jsx` | Sources + create fallback |
| `firestore.rules` | Allowlist + `isValidMarketingPreferences` |
| `docs/security-rules-notes.md` | Nota do campo privado |

### Testes / docs

| Arquivo | Mudança |
|---------|---------|
| `src/services/users/marketingPreferences.test.js` | Novo |
| `src/pages/SignUp.marketingConsent.test.jsx` | Novo |
| `src/services/users/createUserProfile.signup.test.js` | Casos marketing |
| `src/contexts/AuthContext.signup.test.jsx` | Pass-through consent |
| `src/services/users/ensureUserStructure.test.js` | Default Google |
| `src/services/users/userMappers.billing.test.js` | Map + legacy |
| `tests/firestore-rules/firestore.rules.test.js` | Create/update/deny |
| `docs/RC-MARKETING-CONSENT-1.md` | Este documento |

---

## 12. Testes adicionados

### Interface

1. Checkbox aparece com texto exato e inicia unchecked  
2. Cadastro com marketing desmarcado  
3. Cadastro com marketing marcado  
4. Marketing não substitui aceite dos termos  
5. Erro de termos não menciona marketing  
6. Botão permanece disabled até termos (marketing irrelevante)

### Service / mapper / Rules

7. Opt-in → `enabled: true`, `consentedAt` com sentinela  
8. Opt-out → `enabled: false`, `consentedAt: null`  
9. `offers` permanece false  
10. DTO retorna `Date | null`  
11. Usuário antigo → defaults seguros  
12. Google bootstrap → `google_signup_default`  
13. Rules: create opt-in/opt-out, update owner, deny `enabled` sem `consentedAt`

---

## 13. Testes executados

| Suite | Resultado |
|-------|-----------|
| `npm test -- --watchAll=false` | **33 suites / 282 testes — PASS** |
| `npm run test:rules` | **39 testes — PASS** |

---

## 14. Resultado do build

```
npm run build
→ Compiled with warnings (ESLint pré-existentes em PublicContactSection, PublicImageViewer, PublicPortfolio, Viewer)
→ build/ gerado com sucesso
```

Nenhum warning novo introduzido por este sprint.

---

## 15. Resultado das validações manuais

Validações manuais ponta a ponta (Firestore real / conta nova) **não foram executadas neste ambiente de agente** (sem interação de browser autenticado nem deploy). Cobertura equivalente via:

- testes de UI SignUp  
- testes de `createUserProfile` / `AuthContext` / `ensureUserStructure`  
- testes de Rules com opt-in/opt-out  

Checklist recomendado no ambiente do time (antes do próximo deploy de rules):

- [ ] Cadastro e-mail desmarcado → `enabled: false`, `consentedAt: null`  
- [ ] Cadastro e-mail marcado → `enabled: true`, `productUpdates: true`, `consentedAt` preenchido  
- [ ] Google novo → `google_signup_default`, sem consentimento presumido  
- [ ] Usuário legado → app sem erro; marketing tratado como desabilitado  
- [ ] Verify-email + welcome continuam funcionando  

---

## 16. Confirmação de que não houve envio de marketing

- Nenhuma Cloud Function de marketing criada.  
- Nenhuma chamada a Broadcasts/Topics/Segments.  
- `emailQueue` / `enqueueVerifyEmail` / `enqueueWelcomeEmail` inalterados em responsabilidade.  
- Preferência de marketing **não** condiciona e-mails transacionais.

---

## 17. Confirmação de que o Resend não foi alterado

- Nenhuma alteração em secrets/config Resend do frontend.  
- Nenhuma criação/atualização de Contacts no Resend.  
- Functions de e-mail transacional não foram modificadas neste sprint.

---

## 18. Pontos preparados para integração futura

Fluxo futuro documentado (não implementado):

```
Firestore users/{uid}.marketingPreferences
  ↓
Cloud Function (onWrite / scheduled sync)
  ↓
Resend Contacts
  ↓
Topics e Segments (productUpdates, tips, offers, …)
  ↓
Broadcasts
```

Campos já prontos: `enabled`, canais granulares, `consentVersion`, `consentSource`, `consentedAt`, `revokedAt`, `updatedAt`.  
Rules já permitem update do próprio `marketingPreferences` (UI de preferências futura).

---

## 19. Riscos residuais

| Risco | Mitigação / status |
|-------|-------------------|
| Rules ainda não deployadas | Deploy fora do escopo; rodar `test:rules` + deploy de rules no próximo release |
| Google sem opt-in no signup | Intencional; preferências futuras via settings |
| Usuários legados sem campo | Defaults seguros; possível backfill opt-in futuro via UI |
| Validação manual E2E não feita no agente | Checklist na seção 15 |

---

## 20. Confirmação de ausência de deploy

**Nenhum deploy foi realizado** (Hosting, Functions, Firestore Rules ou Remote Config).

Alterações de `firestore.rules` estão apenas no repositório local e nos testes de emulator.
