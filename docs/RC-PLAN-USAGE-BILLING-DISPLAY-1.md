# RC-PLAN-USAGE-BILLING-DISPLAY-1

Corrigir consumo ilimitado (vermelho indevido) e exibição da próxima cobrança na página de Planos.

**Build completo:** não executado (orientação da sprint).  
**Deploy:** não realizado.

---

## Auditoria — consumo (“Seu consumo atual”)

### 1. Como o plano ilimitado é representado?

**Oficial: `null`** em `maxProjects` e `maxTotalImages` (`PLAN_LIMITS`).

- Helper: `isUnlimited` / alias `isUnlimitedLimit` (`src/config/planLimits.js`)
- **Não** usar `-1`, `Infinity` nem string `"unlimited"`

Professional / Studio / Enterprise: `maxTotalImages: null`.  
Starter: `maxTotalImages: 10` (finito).  
Armazenamento (`maxStorageBytes`) **nunca** é ilimitado.

### 2. Qual comparação deixava o item vermelho?

`usagePercentage(current, null)` retornava **100** quando `current > 0`.  
`StatCard` (`variant="usage"`) aplicava `getUsageVisualClasses(percentage)` → `percentage >= 100` → `text-red-400`.

O label já mostrava “ilimitado”, mas a cor usava o percentual artificial.

### 3. Limite exibido e limite da cor vinham da mesma fonte?

Mesmo `limits` / `buildUsageStats`, com **interpretação divergente**:

| Aspecto | Comportamento antigo |
|---|---|
| Label | `null` → “ilimitado” |
| Cor / barra | `null` + uso > 0 → 100% → vermelho |

### 4. Fallback antigo Starter após upgrade?

Não havia fallback hardcoded do plano pago. Havia:

- estado inicial de `usePlanLimits` = Starter até a carga;
- pós-checkout: `refreshSilent` atualiza `planId`/`limits` sem loading global.

O vermelho após upgrade era do bug de `usagePercentage`, não de um plano Starter permanente.

### 5. Componente recebe plano atualizado?

Sim, via `usePlanLimits` → `getUserPlanContext` → `users/{uid}` → `getPlanLimits(planId)`.  
Após webhook + poll de checkout, o plano novo chega sem remontar a página.

---

## Correção — recursos ilimitados

### Helper oficial

```js
isUnlimited(value)      // null | undefined
isUnlimitedLimit(limit) // alias explícito para UI/consumo
```

### `usagePercentage`

- Limite ilimitado → sempre `0` (sem barra de alerta).
- Limite finito → percentual 0–100 como antes.

### UI

- `buildUsageStats` inclui `unlimited` e label `"Ilimitado"`.
- `StatCard` (`usage`): se `unlimited`, texto neutro e **sem barra**.
- Imagens e armazenamento permanecem independentes: armazenamento pode ficar âmbar/vermelho sem afetar imagens ilimitadas.
- `PlanUsageCard` / Dashboard alinhados ao label `"Ilimitado"`.

---

## Auditoria — próxima cobrança

### A data existia no Firestore?

Sim, em **`subscriptions/{uid}.currentPeriodEnd`** (e alias `nextBillingAt`), quando a extração Stripe funcionava.

**Não** em `users.billing` (campos `currentPeriodEnd` / `nextInvoiceDate` do DTO UI).

`subscriptions/{uid}` é **client-deny** (somente Functions). A UI lê apenas `users.billing` via `getUser` / `normalizeBilling`.

### Mapper descartava o campo?

- Webhook gravava `nextBillingAt` em `subscriptions`.
- UI esperava `nextInvoiceDate` / `currentPeriodEnd` em `users.billing`.
- `enrichBillingFromUserDoc` não trazia datas.

### Stripe API 2026-07-29.dahlia

`current_period_end` saiu do objeto Subscription (Basil+) e está em:

`subscription.items.data[].current_period_end`

O webhook lia `subscription.current_period_end` → `undefined` → período não persistido.

---

## Fonte de verdade da próxima cobrança

| Camada | Campo |
|---|---|
| Stripe | `items.data[].current_period_end` (fallback top-level pré-Basil) |
| Firestore canônico (webhook) | `subscriptions/{uid}.currentPeriodEnd` (+ `nextBillingAt`) |
| Espelho UI | `users.billing.currentPeriodEnd` + `users.billing.nextInvoiceDate` |
| DTO | `UserBilling.currentPeriodEnd` / `nextInvoiceDate` (`Date \| null`) |

A UI **não** calcula “hoje + 30 dias”. Usa o período real da assinatura.

---

## Comportamento por status (`getSubscriptionPeriodDisplay`)

| Status / flag | Apresentação |
|---|---|
| `active` | “Próxima cobrança” + data |
| `trialing` | “Período de teste até” + data |
| `cancelAtPeriodEnd` | “Acesso disponível até” + data; aviso âmbar |
| `past_due` / `unpaid` | “Próxima cobrança indisponível” (sem inventar data) |
| `canceled` | Campo oculto |
| Data ausente | “Próxima cobrança indisponível” |

Formatação: `formatBillingDate` → `pt-BR`, `America/Sao_Paulo`, dia/mês por extenso (ex.: `15 de setembro de 2026`).

---

## Webhook (alterações necessárias e feitas)

1. Helper `functions/src/stripe/subscriptionPeriod.js` — extrai período de `items.data` com fallback top-level.
2. `checkout.session.completed` — grava período em `subscriptions` **e** espelha em `users.billing`.
3. `invoice.paid` — idem mirror em `users.billing`.
4. `customer.subscription.updated` — passa a ser tratado (período + `cancelAtPeriodEnd`, sem mudar entitlement/`users.plan.id`).
5. `cancelStripeSubscription` — lê período via helper Dahlia e espelha em `users.billing`.

Idempotência de invoices/e-mails preservada. Entitlement e `users.plan.id` não alterados por esta sprint além dos campos de período/cancelamento já previstos.

---

## Assinaturas já existentes (conta de teste)

Documentos antigos podem ter `subscriptions.currentPeriodEnd` vazio e/ou `users.billing` sem datas.

### Como popular (recomendado)

**Opção A — reprocessar evento Stripe (local / CLI)**

```bash
stripe events resend <evt_...>
# ou trigger:
stripe trigger customer.subscription.updated
# / invoice.paid / checkout.session.completed
```

Garantir que o endpoint de webhook local/deployed já contém a correção Dahlia.

**Opção B — sync sob demanda**

Não há callable dedicado de sync de período nesta sprint. O caminho suportado é reprocessar o evento.

**Opção C — fallback invoice**

Não usado como substituto permanente.

Após um `customer.subscription.updated` ou `invoice.paid` processado pelo webhook corrigido, `users.billing.currentPeriodEnd` / `nextInvoiceDate` devem aparecer e a UI exibir a data no próximo `refreshSilent` / reload da página.

---

## Arquivos alterados

### Frontend

- `src/config/planLimits.js` — `isUnlimitedLimit`, `usagePercentage` (ilimitado → 0)
- `src/services/plans/planService.js` — `buildUsageStats` (`unlimited`, label)
- `src/components/common/StatCard.jsx` — sem barra/vermelho se `unlimited`
- `src/pages/Plan.js` — passa `unlimited` aos cards
- `src/components/plans/PlanUsageCard.jsx` — label “Ilimitado”
- `src/utils/dashboardKpiDisplay.js` — label “Ilimitado”
- `src/config/billing.js` — `normalizeBilling` (alias `nextBillingAt`), `formatBillingDate`, `getSubscriptionPeriodDisplay`, mensagens
- `src/components/plans/ManageSubscriptionSection.jsx` — display por status

### Backend

- `functions/src/stripe/subscriptionPeriod.js` — **novo**
- `functions/src/stripeWebhook.js` — extração Dahlia, mirror `users.billing`, `subscription.updated`
- `functions/src/cancelStripeSubscription.js` — período via helper + mirror

### Testes

- `src/config/planUsageUnlimited.test.js` — **novo**
- `src/config/billingPeriodDisplay.test.js` — **novo**
- `tests/functions/subscriptionPeriod.test.js` — **novo**

### Docs

- `docs/RC-PLAN-USAGE-BILLING-DISPLAY-1.md` — este arquivo

---

## Testes executados

```text
npx craco test --watchAll=false --testPathPattern="planUsageUnlimited|billingPeriodDisplay|billing\.test|planLimits\.test|userMappers\.billing"
→ 5 suites, 70 tests passed

npx jest --config tests/functions/jest.config.js --runInBand subscriptionPeriod.test.js
→ 4 tests passed
```

**Não** executado: build completo.

---

## Validação manual (checklist)

- [ ] Starter: imagens com limite finito e alerta vermelho no teto
- [ ] Upgrade → plano novo, “Ilimitado”, sem vermelho em imagens
- [ ] Armazenamento próximo do limite pode ficar âmbar/vermelho sem afetar imagens
- [ ] Gerenciar assinatura: status + próxima cobrança alinhada ao Stripe Dashboard
- [ ] `cancelAtPeriodEnd`: “Acesso disponível até …” (sem “próxima cobrança” de renovação)
- [ ] Refresh silencioso pós-checkout: sem flash Starter / sem zerar limites

---

## Riscos residuais

1. Contas com assinatura criada **antes** desta correção precisam de reprocessamento de evento (ou novo `invoice.paid` / `subscription.updated`) para popular `users.billing`.
2. Endpoint Stripe Dashboard precisa incluir `customer.subscription.updated` se ainda não estiver na lista de eventos do webhook.
3. `past_due` / `unpaid` continuam caindo para entitlement Starter via `normalizeUserPlan` (fora do escopo desta sprint de display).
4. Deploy das Cloud Functions é necessário para persistir o período corretamente em produção/local Functions; **não foi feito nesta entrega**.

---

## Confirmações

- Build completo: **não executado**
- Deploy: **não realizado**
