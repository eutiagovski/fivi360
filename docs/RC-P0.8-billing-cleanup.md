# RC-P0.8 — Stripe Billing Cleanup + Studio Beta

## Status

Stripe é o **único** provedor de billing. Compatibilidade com Mercado Pago e schemas
pré-Beta foi removida em **RC-CLEANUP-LEGACY-1** (ambiente Beta = Firebase novo,
sem migração de produção).

Documentos históricos que mencionam Mercado Pago (`mercado-pago-billing-plan.md`,
audits antigos) permanecem apenas como arquivo histórico — **não** são configuração atual.

## Fonte de verdade

| Conceito | Fonte |
|----------|--------|
| Plano / entitlements | `users.plan` (`id` + `status` active/trialing, ou `"starter"` no bootstrap) |
| Metadados Stripe | `users.billing` (`provider: "stripe"`, `billing.stripe.*`) |
| priceId Stripe | Backend (`STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_STUDIO`) |
| Checkout Studio (FE) | Habilitado por padrão no Beta; opt-out `REACT_APP_STRIPE_STUDIO_CHECKOUT=false` |
| Checkout Studio (BE) | Disponível quando `STRIPE_PRICE_STUDIO` está configurado |

## Bootstrap Starter (`users/{uid}`)

```js
{
  plan: "starter",
  billing: {
    provider: "stripe",
    subscriptionStatus: "free",
  },
  // ...
}
```

Sem `customerId` / `subscriptionId` / `priceId` vazios. Único provider válido: `stripe`.

## Upgrade Professional → Studio

Checkout Stripe cria nova subscription apenas quando o plano atual é inferior ao alvo.
Usuário já em Professional que sobe para Studio usa o mesmo callable (upgrade de tier).
Portal de billing (`createBillingPortalSession`) permanece stub “em breve” — troca avançada/proration via portal fica para sprint futura.

## Removido (RC-CLEANUP-LEGACY-1)

- Leitura / preservação de `billing.provider = mercado_pago`
- Aliases históricos de plano (`free`, `pro`)
- Fallback `billing.stripeCustomerId` (usar apenas `billing.stripe.customerId`)
- Testes e mappers de compatibilidade legada
- Migração Mercado Pago → Stripe (não aplicável ao Firebase novo)
