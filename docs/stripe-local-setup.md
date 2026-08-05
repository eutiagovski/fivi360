# Stripe — configuração local (Firebase Emulator)

Guia curto para variáveis usadas por `createStripeCheckoutSession` no emulador de Cloud Functions.

> Estrutura completa e matriz de variáveis: [RC-FUNCTIONS-ENV-CLEANUP-1.md](./RC-FUNCTIONS-ENV-CLEANUP-1.md)

## Mapa de variáveis

| Variável | Mecanismo no código | Arquivo local | Secret? |
|----------|---------------------|---------------|---------|
| `STRIPE_SECRET_KEY` | `defineSecret` → `secrets: [...]` | `functions/.secret.local` | Sim |
| `STRIPE_WEBHOOK_SECRET` | `defineSecret` → `secrets: [...]` | `functions/.secret.local` | Sim |
| `STRIPE_PRICE_PROFESSIONAL` | `defineString` → `params: [...]` | `functions/.env` ou `.env.local` | Não |
| `STRIPE_PRICE_STUDIO` | `defineString` → `params: [...]` | `functions/.env` ou `.env.local` | Não |
| `APP_BASE_URL` | `process.env.APP_BASE_URL` | `functions/.env` ou `.env.local` | Não |

Referências no código:

- `functions/src/stripe/client.js` — `defineSecret("STRIPE_SECRET_KEY")`, `getStripeClient()`
- `functions/src/config/stripeBilling.js` — `defineString("STRIPE_PRICE_PROFESSIONAL")` / `STRIPE_PRICE_STUDIO`
- `functions/src/config/app.js` — `process.env.APP_BASE_URL` (fallback: `http://localhost:3000`)
- `functions/src/createStripeCheckoutSession.js` — `secrets: [STRIPE_SECRET_KEY]`, `params: STRIPE_BILLING_PARAMS`

---

## Setup rápido (novo notebook)

```powershell
cd functions
npm install
Copy-Item .env.example .env.local
# Preencher Price IDs e APP_BASE_URL em .env.local
# Criar .secret.local com STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (e RESEND_API_KEY se for testar e-mail)
```

Reinicie o emulador após qualquer alteração em `.env`, `.env.local` ou `.secret.local`.

---

## 1. Onde colocar `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`

**Arquivo:** `functions/.secret.local` (obrigatório para `defineSecret` no Emulator)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- Declarada com `defineSecret(...)`.
- Injetada na function via `secrets: [...]`.
- **Não** coloque secrets em `functions/.env` nem `.env.local` — o Firebase CLI só sobrescreve secrets via `.secret.local` (ou Secret Manager).
- O arquivo está no `functions/.gitignore`; não commitar.

Chave de teste: [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (`sk_test_...`).

Webhook local: use o Stripe CLI (`stripe listen --forward-to ...`) e copie o `whsec_...` exibido para `.secret.local`.

---

## 2. Onde colocar Price IDs e `APP_BASE_URL`

**Arquivo:** `functions/.env` (base compartilhada) ou `functions/.env.local` (override local)

```bash
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_STUDIO=price_...
APP_BASE_URL=http://localhost:3000
```

- `.env.local` tem precedência sobre `.env` no emulador.
- Price IDs não são secrets, mas são específicos da conta Stripe — preferir `.env.local` localmente.

Se `APP_BASE_URL` estiver ausente, o fallback em `app.js` é `http://localhost:3000`.

---

## 3. Como reiniciar os emulators

Parar o processo atual (`Ctrl+C`) e subir de novo:

```bash
# Na raiz do projeto
npm run emulators
```

Ou só Functions:

```bash
cd functions
npm run serve
```

**Importante:** alterações em `.secret.local`, `.env` ou `.env.local` exigem **reinício completo** do emulador de Functions. Hot reload não recarrega secrets/params.

Ao subir, confira no log:

```
i  functions: Loaded environment variables from .env, .env.local
```

---

## 4. Como validar que `createStripeCheckoutSession` lê a secret

### Checklist rápido

1. `functions/.secret.local` contém `STRIPE_SECRET_KEY=sk_test_...`
2. `functions/.env` ou `.env.local` contém `STRIPE_PRICE_PROFESSIONAL=price_...`
3. Emuladores reiniciados após editar esses arquivos
4. Frontend com `REACT_APP_USE_FIREBASE_EMULATORS=true` (`.env.local` da raiz)

### Teste via app (callable autenticada)

1. Login no app apontando para Auth Emulator.
2. Disparar checkout do plano `professional` (fluxo que chama `createStripeCheckoutSession`).
3. **Secret OK + price OK:** resposta com `{ checkoutUrl: "https://checkout.stripe.com/..." }`.
4. **Secret ausente ou inválida:** erro `failed-precondition` — *"Stripe não configurado."* (`getStripeClient()` retorna `null`).
5. **Price ausente:** erro `failed-precondition` — *"Preço Stripe não configurado."*

### O que observar nos logs

- Sucesso: `createStripeCheckoutSession: session created` com `sessionId`.
- Falha Stripe/API: `createStripeCheckoutSession: failed` com mensagem de erro.
- Secret Manager sem credencial (sem `.secret.local`): aviso do emulador pedindo override em `functions/.secret.local`.

Ver também: [resend-email-plan.md](./resend-email-plan.md) (mesmo padrão de `.secret.local` para `RESEND_API_KEY`).
