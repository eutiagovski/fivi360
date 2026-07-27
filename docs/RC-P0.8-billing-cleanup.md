# RC-P0.8 — Stripe Billing Cleanup + Studio Beta

## Status

Mercado Pago **não** é mais dependência ativa. Stripe é o único provedor de billing.

Documentos históricos que mencionam Mercado Pago (`mercado-pago-billing-plan.md`, audits antigos) estão **obsoletos** para a arquitetura atual.

## Fonte de verdade

| Conceito | Fonte |
|----------|--------|
| Plano / entitlements | `users.plan` (`id` + `status` active/trialing) |
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

Sem `customerId` / `subscriptionId` / `priceId` vazios. Sem `mercado_pago`.

## Compatibilidade legado

Usuários com `billing.provider === "mercado_pago"`:

- Continuam carregando o app
- Billing legado **não** libera entitlement
- Billing legado **não** sobrescreve `users.plan`
- Não há conversão automática para Stripe

## Migração futura (não nesta sprint)

1. Query Firestore: `billing.provider == "mercado_pago"`
2. Saneamento opcional: remover campos vazios legados; **não** inventar customer/subscription Stripe
3. Remover secrets/env MP se ainda existirem no projeto Firebase/hosting
4. Arquivar `docs/mercado-pago-billing-plan.md`

## Upgrade Professional → Studio

Checkout Stripe cria nova subscription apenas quando o plano atual é inferior ao alvo.
Usuário já em Professional que sobe para Studio usa o mesmo callable (upgrade de tier).
Portal de billing (`createBillingPortalSession`) permanece stub “em breve” — troca avançada/proration via portal fica para sprint futura.

## Itens externos que podem ser removidos posteriormente

Ver relatório de entrega RC-P0.8 (não executar remoção remota nesta sprint):

- Variáveis `REACT_APP_MP_PLAN_*` em Hosting / CI (se ainda definidas)
- Qualquer secret Mercado Pago residual no Google Cloud / Firebase (nenhum encontrado no repo)
- Webhooks ou apps Mercado Pago externos (se existirem fora do código)
- Documento `docs/mercado-pago-billing-plan.md` (arquivar)
