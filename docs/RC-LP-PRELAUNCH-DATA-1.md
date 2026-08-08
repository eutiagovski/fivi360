# RC-LP-PRELAUNCH-DATA-1 — Backend de pré-cadastro, origem e deduplicação

## Objetivo

Criar infraestrutura segura de captação de leads de pré-lançamento para a LP `/lp/acesso-antecipado`, sem UI final, e-mail, WhatsApp group, cupom ou analytics completo.

**Build completo:** não executado.  
**Deploy:** não realizado.

---

## Arquitetura

```text
LP (futuro formulário)
  → prelaunchLeadService.submitPrelaunchLead()
  → Cloud Function callable submitPrelaunchLead (Admin SDK)
  → validação / normalização / allowlist de campanha
  → ID determinístico sha256(emailNormalized|campaignId)
  → prelaunchLeads/{hash}.create()  (atômico)
  → { success, alreadyRegistered }
```

O cliente **não** escreve em `prelaunchLeads`. Rules: `allow read, write: if false`.

Auth é opcional: a Function funciona autenticado ou não e **não** vincula `auth.uid` ao lead. Lead ≠ usuário.

---

## Schema final

Coleção: `prelaunchLeads/{leadId}`

```js
{
  name: string,
  email: string,                 // trim do input (preserva casing)
  emailNormalized: string,       // trim + lowercase
  phone: string,                 // input trimado (máscara original)
  phoneNormalized: string,       // dígitos, ex. 5521999999999
  profession: string,

  marketingConsent: boolean,     // false permitido

  campaignId: string,            // oficial FIVI360 — NÃO vem de utm_campaign

  attribution: {
    source: string | null,       // utm_source
    medium: string | null,       // utm_medium
    utmCampaign: string | null,  // utm_campaign (só atribuição)
    content: string | null,      // utm_content
    term: string | null,         // utm_term
    referrer: string | null,
    landingPath: string
  },

  status: "waiting",

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Separação: identidade / consentimento / campanha / atribuição.

---

## Campaign ID

Frontend: `ACCESS_EARLY_CAMPAIGN.id = "prelaunch_2026"` em  
`src/landing-pages/access-early/config.js`

Backend allowlist: `ALLOWED_PRELAUNCH_CAMPAIGNS` em  
`functions/src/config/prelaunch.js`

`utm_campaign` da URL **nunca** controla deduplicação.

---

## Attribution

Helper: `getPrelaunchAttribution()` em  
`src/landing-pages/access-early/utils/getPrelaunchAttribution.js`

Captura: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `document.referrer`, `pathname`.

Não remove query params da URL. Sanitiza tamanhos máximos.

---

## Normalização de e-mail

`normalizeLeadEmail(email)` → `trim` + `lowercase`.

Ex.: `" Pedro@Email.COM "` → `"pedro@email.com"`

**Não** remove pontos do Gmail nem `+alias`.

---

## Normalização de telefone

`normalizeLeadPhone` (Functions):

- remove `+`, espaços, parênteses, hífen;
- armazena `phone` (original trimado) + `phoneNormalized` (só dígitos);
- para número local BR (10–11 dígitos), prefixa `55` (campanha Brasil);
- não inventa DDI em formatos ambíguos longos;
- não valida existência real do número.

---

## Deduplicação e ID determinístico

Unicidade: `emailNormalized + campaignId`

ID: `sha256(\`${emailNormalized}|${campaignId}\`)` → path `prelaunchLeads/{hash}`

- sem PII no path;
- atomicidade via `DocumentReference.create()`;
- concorrência → um único doc;
- mesmo e-mail em campanha diferente → outro hash (quando a campanha estiver na allowlist).

Duplicidade: **não sobrescreve** o documento (preserva primeira origem/consentimento). Retorno:

```js
{ success: true, alreadyRegistered: true }
```

Cadastro novo:

```js
{ success: true, alreadyRegistered: false }
```

Resposta **nunca** inclui: leadId, hash, e-mail, telefone, nome, attribution existente.

---

## Campos obrigatórios

| Campo | Regra |
|---|---|
| name | string não vazia (max 120) |
| email | válido após normalização (max 254) |
| phone | válido após normalização (10–15 dígitos) |
| profession | string não vazia (max 80) |
| campaignId | allowlist server-side |
| landingPath | obrigatório em attribution |
| marketingConsent | boolean obrigatório (`false` ok) |

UTMs e referrer: opcionais. Campos extras: ignorados (allowlist).

---

## Consentimento de marketing

`marketingConsent: boolean`

- opt-in de marketing/promos futuras;
- independente do direito de receber comunicação do **acesso antecipado**;
- `false` não bloqueia o pré-cadastro;
- **nenhum envio** nesta sprint.

---

## Function

`functions/src/submitPrelaunchLead.js` — callable v2, região `southamerica-east1`.

Fluxo: validar → normalizar → allowlist → hash → `create` → resposta mínima.

Logs (sem PII):

- `[Prelaunch] lead created` (+ hash truncado 8 chars)
- `[Prelaunch] duplicate submission`
- `[Prelaunch] validation rejected` (+ reason)

---

## Service frontend

`src/landing-pages/access-early/services/prelaunchLeadService.js`

```js
submitPrelaunchLead({ name, email, phone, profession, marketingConsent, attribution? })
```

Injeta `ACCESS_EARLY_CAMPAIGN.id` e attribution (ou `getPrelaunchAttribution()`).  
Componente futuro não chama Firebase direto.

---

## Rules

```js
match /prelaunchLeads/{leadId} {
  allow read, write: if false;
}
```

Admin SDK / Function ignora Rules.

---

## Rate limiting / abuso (risco P1)

Não há App Check, captcha nem throttle dedicado nesta sprint.

Mitigações atuais: validação forte, payload allowlist, dedupe atômico, resposta sem PII/enumeração mínima, timeout/memória padrão da Function.

**Pendente para Sprint Polish:** App Check e/ou rate limit / captcha.

---

## Arquivos

### Criados

- `functions/src/config/prelaunch.js`
- `functions/src/prelaunch/normalizeLeadEmail.js`
- `functions/src/prelaunch/normalizeLeadPhone.js`
- `functions/src/prelaunch/buildPrelaunchLeadId.js`
- `functions/src/prelaunch/validateAndNormalizePrelaunchLead.js`
- `functions/src/prelaunch/submitPrelaunchLeadCore.js`
- `functions/src/submitPrelaunchLead.js`
- `src/landing-pages/access-early/utils/normalizeLeadEmail.js`
- `src/landing-pages/access-early/utils/getPrelaunchAttribution.js`
- `src/landing-pages/access-early/services/prelaunchLeadService.js`
- `tests/functions/submitPrelaunchLead.test.js`
- `src/landing-pages/access-early/utils/*.test.js`
- `docs/RC-LP-PRELAUNCH-DATA-1.md`

### Alterados

- `functions/src/index.js` — export `submitPrelaunchLead`
- `firestore.rules` — bloqueio `prelaunchLeads`
- `src/landing-pages/access-early/config.js` — `ACCESS_EARLY_CAMPAIGN`
- `tests/firestore-rules/firestore.rules.test.js` — suite prelaunchLeads

---

## Testes executados

### Functions (núcleo)

```bash
npx jest --config tests/functions/jest.config.js --runInBand submitPrelaunchLead
```

**26 passed** — validação, normalização, hash, dedupe, concorrência, sem PII na resposta, sem auth.

### Attribution / LP (CRA)

```bash
npm test -- --watchAll=false --testPathPattern="getPrelaunchAttribution|normalizeLeadEmail|AccessEarlyLandingPage"
```

**11 passed**

### Rules

```bash
npm run test:rules
```

**52 passed** (inclui 7 testes `prelaunchLeads`: anon/auth read/create/update/delete negados + Admin bypass).

**Build completo:** não executado.

---

## Validação manual (Emulator — checklist)

1. Chamar `submitPrelaunchLead` com `email: teste@example.com`, `campaignId: prelaunch_2026` → `alreadyRegistered: false`
2. Repetir idêntico → `alreadyRegistered: true`
3. Confirmar um único doc; ID = sha256; sem e-mail no path
4. Attribution persistida; Rules bloqueiam get/set no client
5. (Opcional) outro `campaignId` só se adicionado à allowlist

---

## Confirmações

| Item | Status |
|---|---|
| Coleção `prelaunchLeads` definida | Feito |
| Cliente sem acesso direto | Feito |
| Function pública cria leads | Feito |
| E-mail / telefone normalizados | Feito |
| Campanha controlada no servidor | Feito |
| UTMs/referrer armazenáveis | Feito |
| Dedupe email+campaign | Feito |
| ID sem PII | Feito |
| Resposta sem PII | Feito |
| Service + attribution helpers | Feito |
| UI final / e-mail / WhatsApp group | **Não criados** |
| Rate limit avançado | **P1 pendente** |
| Build completo | **Não executado** |
| Deploy | **Não realizado** |
