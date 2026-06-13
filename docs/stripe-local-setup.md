# Stripe — configuração local (Firebase Emulator)

Guia curto para variáveis usadas por `createStripeCheckoutSession` no emulador de Cloud Functions.

## Mapa de variáveis

| Variável | Mecanismo no código | Arquivo local | Secret? |
|----------|---------------------|---------------|---------|
| `STRIPE_SECRET_KEY` | `defineSecret` → `secrets: [...]` | `functions/.secret.local` | Sim |
| `STRIPE_PRICE_PROFESSIONAL` | `defineString` → `params: [...]` | `functions/.env` ou `functions/.env.local` | Não |
| `APP_BASE_URL` | `process.env.APP_BASE_URL` (sem `defineString`) | `functions/.env` ou `functions/.env.local` | Não |

Referências no código:

- `functions/src/stripe/client.js` — `defineSecret("STRIPE_SECRET_KEY")`, `getStripeClient()`
- `functions/src/config/stripeBilling.js` — `defineString("STRIPE_PRICE_PROFESSIONAL")`
- `functions/src/config/app.js` — `process.env.APP_BASE_URL` (fallback: `http://localhost:3000`)
- `functions/src/createStripeCheckoutSession.js` — `secrets: [STRIPE_SECRET_KEY]`, `params: STRIPE_BILLING_PARAMS`

---

## 1. Onde colocar `STRIPE_SECRET_KEY`

**Arquivo:** `functions/.secret.local`

```bash
STRIPE_SECRET_KEY=sk_test_...
```

- Declarada com `defineSecret("STRIPE_SECRET_KEY")`.
- Injetada na function via `secrets: [STRIPE_SECRET_KEY]`.
- Lida em runtime com `STRIPE_SECRET_KEY.value()` dentro de `getStripeClient()`.
- **Não** coloque em `functions/.env` — secrets ficam só em Secret Manager (produção) ou `.secret.local` (emulador).
- O arquivo está no `functions/.gitignore`; não commitar.

Chave de teste: [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (`sk_test_...`).

---

## 2. Onde colocar `STRIPE_PRICE_PROFESSIONAL`

**Arquivo:** `functions/.env` (base) ou `functions/.env.local` (override local)

```bash
STRIPE_PRICE_PROFESSIONAL=price_...
```

- Declarada com `defineString("STRIPE_PRICE_PROFESSIONAL")`.
- Declarada na function via `params: STRIPE_BILLING_PARAMS`.
- `.env.local` tem precedência sobre `.env` no emulador.

Price ID de teste: Stripe Dashboard → Products → preço recorrente (`price_...`).

### `APP_BASE_URL` (mesmo padrão de env, não é secret)

Usada nos `success_url` / `cancel_url` do Checkout. Também lida de `process.env` (não usa `defineString`).

Para desenvolvimento local com React em `localhost:3000`:

```bash
# functions/.env.local
APP_BASE_URL=http://localhost:3000
STRIPE_PRICE_PROFESSIONAL=price_...
```

Se `APP_BASE_URL` estiver ausente, o fallback em `app.js` é `http://localhost:3000`. Se existir em `functions/.env` apontando para produção, o emulador carrega esse valor — use `.env.local` para sobrescrever.

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
i  functions: Loaded environment variables from .env.
```

---

## 4. Como validar que `createStripeCheckoutSession` lê a secret

### Checklist rápido

1. `functions/.secret.local` contém `STRIPE_SECRET_KEY=sk_test_...`
2. `functions/.env` ou `.env.local` contém `STRIPE_PRICE_PROFESSIONAL=price_...`
3. Emuladores reiniciados após editar esses arquivos
4. Frontend com `REACT_APP_USE_FIREBASE_EMULATORS=true` (`.env` da raiz)

### Teste via app (callable autenticada)

1. Login no app apontando para Auth Emulator.
2. Disparar checkout do plano `professional` (fluxo que chama `createStripeCheckoutSession`).
3. **Secret OK + price OK:** resposta com `{ checkoutUrl: "https://checkout.stripe.com/..." }`.
4. **Secret ausente ou inválida:** erro `failed-precondition` — *"Stripe não configurado."* (`getStripeClient()` retorna `null`).
5. **Price ausente:** erro `failed-precondition` — *"Preço Stripe não configurado."*

### Teste direto no emulador (curl)

Com usuário autenticado no Auth Emulator, obtenha um ID token e chame:

```bash
curl -X POST "http://127.0.0.1:5001/fivi360/southamerica-east1/createStripeCheckoutSession" \
  -H "Content-Type: application/json" \
  -d '{"data":{"planId":"professional"}}'
```

(Callable exige header `Authorization: Bearer <ID_TOKEN>` — mais simples validar pelo app.)

### O que observar nos logs

- Sucesso: `createStripeCheckoutSession: session created` com `sessionId`.
- Falha Stripe/API: `createStripeCheckoutSession: failed` com mensagem de erro.
- Secret Manager sem credencial (sem `.secret.local`): aviso do emulador pedindo override em `functions/.secret.local`.

---

## Estado atual do repositório (auditoria)

| Item | Status |
|------|--------|
| `STRIPE_SECRET_KEY` em `functions/.secret.local` | OK |
| `STRIPE_PRICE_PROFESSIONAL` em `functions/.env` / `.env.local` | OK |
| `APP_BASE_URL` em `functions/.env` | Aponta para `https://fivi360.web.app` — sobrescreva com `.env.local` se quiser redirects locais |
| `functions/.gitignore` ignora `.secret.local` e `.env*` | OK |

Ver também: [resend-email-plan.md](./resend-email-plan.md) (mesmo padrão de `.secret.local` para `RESEND_API_KEY`).
