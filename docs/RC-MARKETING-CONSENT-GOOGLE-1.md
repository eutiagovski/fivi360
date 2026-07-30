# RC-MARKETING-CONSENT-GOOGLE-1 — Consentimento de marketing no modal de termos (Google)

**Data:** 29 de julho de 2026  
**Referência:** [RC-MARKETING-CONSENT-1.md](./RC-MARKETING-CONSENT-1.md)  
**Escopo:** checkbox opcional de marketing no `LegalConsentModal` do fluxo Google — sem campanhas, sem Resend, sem deploy  

---

## 1. Resumo

Sprint **executado com sucesso**. Usuários Google passam a escolher marketing no modal de Termos já existente, sem etapa extra e sem consentimento presumido.

| Item | Resultado |
|------|-----------|
| Checkbox no modal Google | Sim — opcional, unchecked |
| Independência dos Termos | Sim |
| `consentSource` final | `google_terms_modal` (marcado ou não) |
| Estado pré-modal | `google_signup_default` (inalterado) |
| Usuários e-mail no modal de atualização | Checkbox **oculto** (não sobrescreve preferência do signup) |
| Resend / marketing send | Não alterados |
| Deploy | **Não executado** |
| Testes unitários | 35 suites / 297 — PASS |
| Testes Rules | 39 — PASS |
| Build | PASS |

---

## 2. Fluxo anterior

1. Google Auth → `ensureUserStructure` cria `users/{uid}` com  
   `marketingPreferences.enabled = false`, `consentSource = "google_signup_default"`.
2. `LegalConsentGate` exige aceite legal → `LegalConsentModal` (só Termos).
3. Ao aceitar: `saveLegalConsent` gravava apenas `legalConsent`.
4. Marketing permanecia no default do bootstrap — sem oportunidade explícita de opt-in.

---

## 3. Fluxo novo

```
Google Auth
  → ensureUserStructure (google_signup_default, enabled: false)
  → LegalConsentGate (consent ausente/desatualizado)
  → LegalConsentModal
       [ ] Termos (obrigatório)
       [ ] Marketing (opcional, só se usesGoogleAuth)
  → onAccept({ marketingConsent })
  → saveLegalConsent(..., { marketingConsent, marketingConsentSource: "google_terms_modal" })
  → dashboard
```

UI envia apenas `marketingConsent: boolean`. O service monta o schema completo via `buildMarketingPreferencesPayload`.

---

## 4. Estado inicial (pré-modal)

Mantido do RC-MARKETING-CONSENT-1:

```js
{
  enabled: false,
  consentSource: "google_signup_default",
  consentedAt: null,
  // … demais flags false
}
```

Significa: preferência ainda não apresentada / escolha não feita no modal.

---

## 5. Persistência final (pós-modal)

Independente de marcado ou desmarcado, `consentSource` passa a `"google_terms_modal"`.

**Marcado**

```js
{
  enabled: true,
  productUpdates: true,
  offers: false,
  tips: true,
  newsletter: false,
  research: false,
  consentVersion: "beta-2026-01",
  consentSource: "google_terms_modal",
  consentedAt: serverTimestamp(),
  revokedAt: null,
  updatedAt: serverTimestamp()
}
```

**Desmarcado**

```js
{
  enabled: false,
  productUpdates: false,
  offers: false,
  tips: false,
  newsletter: false,
  research: false,
  consentVersion: "beta-2026-01",
  consentSource: "google_terms_modal",
  consentedAt: null,
  revokedAt: null,
  updatedAt: serverTimestamp()
}
```

---

## 6. Comportamento de abandono

Se o usuário fecha o app, sai (“Sair”), recarrega ou abandona sem concluir:

- `legalConsent` não é gravado (ou permanece desatualizado) → modal reaparece
- dashboard permanece bloqueado pelo gate
- `marketingPreferences` permanece em `google_signup_default` / `enabled: false` / `consentedAt: null`
- nenhum consentimento de marketing é inferido

---

## 7. Idempotência

- Status `SAVING` impede double-submit.
- Com `legalConsent` atual, o gate **não** reapresenta o modal.
- Conclusão não dispara e-mails de marketing nem Resend Contacts.
- Welcome/verify continuam best-effort e independentes de marketing.

---

## 8. Decisão: quem vê o checkbox

| Usuário | Vê marketing no modal? | Persiste marketing no accept? |
|---------|------------------------|-------------------------------|
| Google (`usesGoogleAuth`) | Sim | Sim → `google_terms_modal` |
| E-mail / atualização de termos | Não | Não (evita sobrescrever opt-in do signup) |

Motivo: o modal também serve a usuários existentes com termos desatualizados; um checkbox default unchecked sobrescreveria preferência já registrada no cadastro por e-mail.

---

## 9. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/legal/LegalConsentModal.jsx` | Checkbox marketing + `onAccept({ marketingConsent })` |
| `src/components/legal/LegalConsentGate.jsx` | Passa consent; `showMarketingConsent` para Google |
| `src/services/users/userService.js` | `saveLegalConsent` aceita opções de marketing |
| `src/components/legal/LegalConsentModal.marketingConsent.test.jsx` | Novo |
| `src/services/users/saveLegalConsent.marketing.test.js` | Novo |
| `src/components/legal/LegalConsentGate.test.jsx` | Casos Google |
| `docs/RC-MARKETING-CONSENT-GOOGLE-1.md` | Este documento |

**Rules:** reutilizadas (`isValidMarketingPreferences` + allowlist). Sem alteração adicional necessária.

---

## 10. Testes

### Adicionados / ajustados

1. Modal Google exibe marketing unchecked  
2. Continuar com marketing off/on  
3. Termos obrigatórios; marketing não libera o botão  
4. `saveLegalConsent` opt-in/opt-out com `google_terms_modal`  
5. Gate Google mostra checkbox; password não  
6. Accept Google persiste source correta  
7. Consent concluído não reabre modal  

### Executados

| Suite | Resultado |
|-------|-----------|
| `npm test -- --watchAll=false` | **35 / 297 — PASS** |
| `npm run test:rules` | **39 — PASS** |

---

## 11. Build

```
npm run build → PASS
(warnings ESLint pré-existentes)
```

---

## 12. Validação manual

Não executada neste ambiente de agente (sem browser autenticado Google). Checklist para o time:

- [ ] Cenário A — Google + marketing marcado → `enabled: true`, `google_terms_modal`, `consentedAt`  
- [ ] Cenário B — Google + marketing desmarcado → `enabled: false`, `consentedAt: null`  
- [ ] Cenário C — abandono / reload → modal de novo, dashboard bloqueado, `enabled: false`  

---

## 13. Confirmações

- Nenhum e-mail de marketing enviado  
- Resend não alterado  
- E-mails transacionais independentes  
- **Nenhum deploy executado**

---

## 14. Riscos residuais

| Risco | Status |
|-------|--------|
| Rules locais ainda não deployadas | Fora do escopo; testes de emulator PASS |
| Google existente já com termos aceitos | Não vê modal; marketing permanece como estava |
| Validação E2E Google | Checklist manual pendente no time |
