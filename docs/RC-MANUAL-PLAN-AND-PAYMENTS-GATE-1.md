# RC-MANUAL-PLAN-AND-PAYMENTS-GATE-1

Preparação do primeiro go-live: planos manuais + gate global de pagamentos.

**Base:** `docs/AUDIT-MANUAL-PLAN-ENTITLEMENT-1.md`  
**Runbook operacional:** `docs/RUNBOOK-MANUAL-PLAN-GRANT.md`

---

## Objetivos

1. Novos usuários permanecem **Starter**.
2. Pagamentos Stripe **indisponíveis** no go-live (`PAID_CHECKOUT_ENABLED=false`).
3. Professional / Studio **visíveis** com CTA **"Em breve"**.
4. Concessão Admin de Professional/Studio via `users.plan` com `source: "manual"`.
5. Plano manual **não** é tratado como assinatura Stripe na UI.

---

## Entitlement × billing

| Conceito | Fonte | Notas |
|----------|-------|-------|
| Entitlement | `users/{uid}.plan` → `normalizeUserPlan` → `PLAN_LIMITS` | Única fonte |
| `plan.source` | Metadado (`stripe` \| `system` \| `manual`) | **Não** altera limites |
| Billing Stripe | `users.billing` + `subscriptions` + `invoices` | Separado |

`source: "manual"` formalizado em `PLAN_SOURCES.MANUAL` (`src/config/planLimits.js`).

---

## Plano manual — comportamento

```js
plan: { id: "studio", status: "active", source: "manual", updatedAt }
billing: { provider: "stripe", subscriptionStatus: "free" } // inalterado
```

- Entitlement: Studio (ou Professional).
- UI `/plan`: “Plano Studio” + status **“Acesso concedido”**.
- Sem próxima cobrança, sem R$/mês como cobrança, sem Cancelar / portal Stripe.
- `canCancelStripeSubscription` exige `subscriptionId` real (+ rejeita `source=manual`).

Mapper (`userMappers.js`): `source=manual` **não** copia `plan.status` → `billing.subscriptionStatus`.

---

## Feature flag

| Env | Lado | Go-live |
|-----|------|---------|
| `REACT_APP_PAID_CHECKOUT_ENABLED` | Frontend | `false` |
| `PAID_CHECKOUT_ENABLED` | Functions | `false` |

- Frontend: `isPaidCheckoutEnabled()` → `getStripeCheckoutPlanIds()` vazio → CTA “Em breve”.
- Backend: `createStripeCheckoutSession` rejeita **antes** de Stripe (`failed-precondition` + mensagem “Pagamentos serão ativados em breve.”).
- Defense in depth: manter `STRIPE_PRICE_*` vazios em produção.

Opt-out fino Studio permanece: `REACT_APP_STRIPE_STUDIO_CHECKOUT=false`.

---

## Configuração produção (go-live)

```bash
# Frontend (.env.production / hosting env)
REACT_APP_PAID_CHECKOUT_ENABLED=false

# Functions (param / .env de deploy)
PAID_CHECKOUT_ENABLED=false
# STRIPE_PRICE_PROFESSIONAL=   (vazio)
# STRIPE_PRICE_STUDIO=         (vazio)
```

Local com Stripe: `PAID_CHECKOUT_ENABLED=true` e prices em `functions/.env.local`; frontend sem `REACT_APP_PAID_CHECKOUT_ENABLED=false`.

---

## Starter (regressão)

Sem alterações em `createUserProfile` / `ensureUserStructure`. Bootstrap continua `plan: "starter"`.

---

## Portfólio após grant manual

Cliente **não** pode promover `portfolioAvailable`. Após setar plano manual:

1. Se o usuário ativar portfólio nas Settings → app chama `syncPublicPortfolioAvailability`.
2. Ou Admin recalcula / seta via Admin SDK (ver runbook).

---

## Pendência futura (não nesta RC)

**RC-MANUAL-TO-STRIPE-CONVERSION** — checkout no mesmo tier bloqueia hoje (`createStripeCheckoutSession` anti-duplicate). Não há workaround de downgrade temporário no código.

---

## Arquivos principais

- `src/config/planLimits.js` — `PLAN_SOURCES`, `getPlanSource`, `isManualPlanSource`
- `src/config/billing.js` — flag paga, cancel gate, CTAs “Em breve”
- `src/services/users/userMappers.js` — sem contaminação manual→subscription
- `src/components/plans/ManageSubscriptionSection.jsx` — view “Acesso concedido”
- `src/pages/Plan.js` — cancel + `planSource`
- `src/components/landing/LandingPricing.jsx` — Professional/Studio Em breve
- `functions/src/config/stripeBilling.js` — `isPaidCheckoutEnabled`
- `functions/src/createStripeCheckoutSession.js` — gate early reject

---

## Testes

- `src/config/planLimits.manual.test.js`
- `src/config/billing.test.js` (flag + cancel)
- `src/services/users/userMappers.billing.test.js` (manual)
- `tests/functions/paidCheckoutGate.test.js`
- `tests/functions/envConfig.test.js` (`PAID_CHECKOUT_ENABLED` no example)
- Rules: regressão existente `owner cannot change users.plan/billing`
