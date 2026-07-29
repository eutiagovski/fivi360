# RC-PLANS-PRICING-1 — Consolidação dos planos, limites e pagamentos

## Objetivo

Oferta comercial definitiva do Beta público, com uma fonte central compartilhada por UI, billing e documentação.

## Fonte central

`src/config/planLimits.js`

- `PLAN_LIMITS` / `PLAN_CONFIG` — preços, storage, estimativa de imagens, flags de checkout
- `STORAGE_IMAGE_ESTIMATE_NOTE` — disclaimer de quantidade aproximada (~5 MB/imagem)
- `billing.js` e `landingContent.js` **derivam** preços/bullets de `PLAN_LIMITS` (sem duplicar valores)

## Matriz Beta

| Plano | Preço | Storage | Imagens (aprox.) | Checkout |
|-------|-------|---------|------------------|----------|
| Starter | Grátis | 25 MB | ~5 | Não |
| Professional | R$ 49/mês | 250 MB | ~50 | Stripe |
| Studio | R$ 199/mês | 2 GB | ~400 | Stripe |
| Enterprise | Sob consulta | a partir de 10 GB | personalizado | Comercial (mailto) |

## Fora de escopo / não alterado

- Stripe como único provider
- Fluxo de webhook
- Regras de entitlement (hotspots, portfólio, etc.)
- Auth, cadastro, workspaces, hotspots, cache
- Stripe Dashboard / Price IDs reais
- Deploy

## Nota Stripe

Os valores cobrados no cartão continuam definidos nos Price objects do Stripe (`STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_STUDIO`). A UI exibe a matriz acima; qualquer divergência de valor no Dashboard deve ser alinhada manualmente antes do Beta.

## Enforcement

- Storage e quotas de projeto/imagem: `planService.js` (cliente), via `PLAN_LIMITS.maxStorageBytes` / `maxProjects` / `maxTotalImages`.
- Starter mantém hard caps de enforcement (`maxProjects: 2`, `maxTotalImages: 10`); a oferta comercial destaca ~5 imagens com base no storage de 25 MB.
- Cloud Functions / Rules: sem quota de storage (inalterado nesta RC).
