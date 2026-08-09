# AUDIT-MANUAL-PLAN-ENTITLEMENT-1

Auditoria somente leitura — concessão manual de planos (pré-produção).

**Escopo:** entender a arquitetura atual e recomendar o menor modelo seguro para entitlement manual (Studio sem Stripe).

**Fora de escopo desta auditoria:** implementação de código, edição de Firestore, alteração de schema/Rules/Stripe, build e deploy.

**Data:** 2026-08-08  
**Produto:** FIVI360  
**Contexto:** Stripe ainda não receberá pagamentos no primeiro go-live; novos usuários permanecem Starter; um usuário específico precisa de Studio manual.

---

## Sumário executivo

| Pergunta | Resposta curta |
|----------|----------------|
| Fonte de verdade do plano? | `users/{uid}.plan` |
| Studio sem Stripe é possível? | **Sim** — entitlement não exige assinatura Stripe |
| Conceder hoje sem código? | **Sim**, via Admin SDK / Firebase Console em `users.plan` |
| `source: "manual"` existe? | **Não** (observados: `stripe`, `system`) |
| Cliente pode se promover? | **Não** (Rules P0 OK) |
| Risco de sobrescrita sem Stripe? | **Baixo** (`ensureUserStructure` não reseta plano existente) |
| P0 que impede go-live? | **Não** para entitlement; há **P1** de UX/billing UI e de checkout Professional ainda clicável no frontend |

---

## 1. Fonte de verdade do plano

### Arquitetura atual

| Store | Papel | Entitlement? |
|-------|-------|--------------|
| `users/{uid}.plan` | Fonte canônica de plano / limites / features | **Sim** |
| `users/{uid}.billing` | Metadados Stripe (customer/sub IDs, período, cancel) | Não |
| `subscriptions/{uid}` | Espelho da assinatura Stripe (webhook); fallback no gate de checkout | Não (exceto anti-duplicate de checkout) |
| `invoices/{invoiceId}` | Histórico de cobrança | Não |
| `workspaces/{uid}.planId` | Bootstrap `"starter"`; congelado pelas Rules | **Não** |
| Custom claims | Não há claims de plano | Não |

Evidência central:

- `src/config/planLimits.js` — documenta `users.plan` como formato persistido.
- `src/config/billing.js` — “Fonte de plano / entitlement: `users.plan`”.
- `functions/src/portfolio/resolvePortfolioAvailable.js` — entitlement de portfólio só lê `users.plan`.
- `functions/src/embed/resolvePublicEmbeddedProject.js` — embed público só lê `users.plan`.

### Existe mais de uma fonte?

**Não para entitlement.** Billing/subscriptions/invoices/workspace.planId são auxiliares.

### Fallback

1. `usePlanLimits` — se `getUserPlanContext` falhar, usa `getUser` + `normalizePlanId(profile.planId ?? profile.plan)`.
2. `createStripeCheckoutSession.resolveEffectivePlanId` — se `users.plan` não for pago ativo, pode consultar `subscriptions/{uid}` **apenas** para decidir se checkout é permitido (anti-duplicate), não para liberar features no app.
3. `mapUserDoc` — `plan` ausente → `"starter"`; `planId` via `normalizeUserPlan`.

### Cache

Não há cache persistente de entitlement (Redis/localStorage). Pós-checkout usa polling `refreshSilent` (`useCheckoutSuccessSync`).

### Como saber se o usuário é Starter / Professional / Studio?

```text
users/{uid}.plan  →  normalizeUserPlan() / normalizePlanId()  →  PLAN_IDS / PLAN_LIMITS
```

Regras de normalização (`src/config/planLimits.js`):

- String canônica (`"starter"` | `"professional"` | `"studio"` | `"enterprise"`) → esse plano.
- Objeto `{ id, status?, ... }`:
  - `status` presente e **fora** de `active` | `trialing` → **Starter**
  - `status` ausente ou ativo → plano de `id`
- Desconhecido / nulo → **Starter**
- **`source` não entra no cálculo de entitlement**

---

## 2. Schema real de `users.plan`

### Formas persistidas encontradas

**A) Bootstrap Starter (string)**

```js
plan: "starter"
```

Gravado em: `createUserProfile`, `ensureUserStructure` (quando o doc ainda não existe).  
Exigido pelas Rules no **create** (`data.plan == 'starter'`).

**B) Objeto (Stripe / system)**

```js
plan: {
  id: "professional" | "studio" | "starter" | "enterprise",
  status: "active" | "trialing" | ...,
  source: "stripe" | "system",
  cancelAtPeriodEnd?: boolean,
  updatedAt?: Timestamp
}
```

### Campos — inventário

| Campo | Tipo | Valores observados | Obrigatório? | Quem grava | Quem lê |
|-------|------|--------------------|--------------|------------|---------|
| (string root) | `string` | `"starter"` | No create | Cliente (signup / ensure) | `normalizeUserPlan`, Rules create |
| `id` | `string` | `starter`, `professional`, `studio`, `enterprise` | No objeto Stripe | Webhook checkout / deleted | Entitlement, mappers, UI |
| `status` | `string` | `active`, `trialing`; UI conhece também `past_due`, `canceled`, `unpaid`, `free` | Opcional para entitlement (ausente = OK se `id` válido) | Webhook, cancel callable | Entitlement (filtro), `enrichBillingFromUserDoc` |
| `source` | `string` | **`stripe`**, **`system`** | Opcional | Checkout → `stripe`; subscription.deleted → `system` | Só enriquecimento UI se `=== "stripe"`; **não** entitlement |
| `cancelAtPeriodEnd` | `boolean` | true/false | Opcional | subscription.updated, cancel callable, deleted→false | Billing UI |
| `updatedAt` | Timestamp | server time | Opcional | Webhook / cancel | Display / sync |

### Valores de `source` atualmente aceitos

| Valor | Onde | Significado |
|-------|------|-------------|
| `"stripe"` | `functions/src/stripeWebhook.js` (`updateUserAfterCheckout`) | Plano concedido via Checkout Stripe |
| `"system"` | `handleSubscriptionDeleted` | Downgrade automático para Starter após fim da assinatura |
| `"manual"` | **Não existe** | — |

Não há enum fechado no código: qualquer string é tolerada; só `stripe` tem efeito colateral no mapper de billing.

### Typedef frontend

`UserPlan` em `planLimits.js`: `{ id?, status?, source?, cancelAtPeriodEnd?, updatedAt? }`.

---

## 3. Criação do Starter

### Fluxo

```text
Auth signup (email) / Google + LegalConsentGate
  → createUserProfile  OU  ensureUserStructure (se users/{uid} ausente)
  → users/{uid}: plan: "starter", billing: DEFAULT_BILLING
  → workspaces/{uid}: planId: "starter" (não é entitlement)
  → publicProfiles/{uid}: portfolioAvailable: false
```

### Quem cria `users/{uid}`?

| Caminho | Arquivo | `plan` | `billing` |
|---------|---------|--------|-----------|
| Email signup | `src/services/users/userService.js` → `createUserProfile` | `"starter"` | `{ provider: "stripe", subscriptionStatus: "free" }` |
| Estrutura ausente | `src/services/users/ensureUserStructure.js` | `"starter"` | idem |
| Rules | `firestore.rules` `userCreateFieldsAreValid` | deve ser exatamente `'starter'` | bootstrap mínimo |

### Cloud Function?

Não há Function que crie o doc do usuário no signup. Criação é **cliente** + Rules. Reparos de workspace usam callable Admin (`repairUserWorkspaceFields`) sem tocar em plan/billing.

### Fallback frontend

`ensureUserStructure` cria user **somente se** `gaps.needsUser` (doc inexistente). Se o doc já existe, **não sobrescreve** `plan` (testes em `ensureUserStructure.test.js`).

### Checkout pago desabilitado

**Sim** — novos usuários continuam recebendo Starter. O bootstrap não depende de Stripe Checkout nem de price IDs.

---

## 4. Upgrade via Stripe

### Fluxo completo

```text
UI Plan / UpgradePlanModal
  → requestUpgrade(planId) → createStripeCheckoutSession (callable)
  → Stripe Checkout
  → redirect /plan?checkout=success&session_id=...&plan=...
  → webhook checkout.session.completed
       → users.plan + users.billing + subscriptions/{uid}
       → sync publicProfiles.portfolioAvailable
  → useCheckoutSuccessSync faz poll em users.plan
```

### Eventos realmente tratados

`HANDLED_STRIPE_EVENTS` em `stripeWebhook.js`:

| Evento | `users.plan` | `users.billing` | `subscriptions/{uid}` | `invoices` |
|--------|--------------|-----------------|----------------------|------------|
| `checkout.session.completed` | **Escreve** `{ id, status:"active", source:"stripe", updatedAt }` | customer/sub IDs + período | upsert | — |
| `customer.subscription.updated` | **Não muda `id`** — só `cancelAtPeriodEnd`, `updatedAt` | espelha período / cancel | upsert | — |
| `customer.subscription.deleted` | **Overwrite** → `{ id:"starter", status:"active", source:"system", ... }` | não limpa IDs Stripe | `status: canceled` | — |
| `invoice.paid` | **Não** | espelha período | upsert período/planId | upsert paid + e-mail |
| `invoice.payment_failed` | **Não** | — | período | upsert failed + e-mail |

Cancelamento agendado (callable `cancelStripeSubscription`, não webhook): atualiza `plan.cancelAtPeriodEnd` / `plan.status`, não muda `plan.id` até o `deleted`.

### Escrita pós-checkout (evidência)

```js
plan: {
  id: planId,
  status: "active",
  source: "stripe",
  updatedAt: FieldValue.serverTimestamp(),
},
billing: {
  provider: "stripe",
  stripe: { customerId, subscriptionId },
  cancelAtPeriodEnd, currentPeriodStart?, currentPeriodEnd?, nextInvoiceDate?,
}
```

---

## 5. Entitlement

### Cadeia

```text
users.plan → normalizePlanId / normalizeUserPlan → PLAN_LIMITS[planId]
  → usePlanLimits / planService asserts / flags de UI / Functions de portfólio/embed
```

### Pontos de enforcement relevantes

| Recurso | Mecanismo | Arquivo(s) |
|---------|-----------|------------|
| Limite de projetos | `assertCanCreateProject` | `planService.js` → `projectService.js` |
| Limite de imagens / storage | `assertCanUploadImage`, `assertCanReplaceImageStorage` | `planService.js` → `imageService.js`, Upload/Edit dialogs |
| Hotspots | `assertHotspotsEnabled` | `hotspotService.js` |
| Portfólio público | `assertPublicPortfolioEnabled` + `computePortfolioAvailable` / callable sync | `userService.js`, `resolvePortfolioAvailable.js` |
| Visibilidade pública | `assertPublicVisibilityEnabled` | `projectService.js` |
| Embed | `canUseProjectEmbed` / assert embed + resolver server | `planLimits.js`, embed Functions |
| Branding / white-label | Flag em `PLAN_LIMITS` (`whiteLabelEnabled: false` mesmo no Studio) | Sem enforcement runtime encontrado |
| Analytics avançado / suporte | Flags comerciais | Sem gate runtime encontrado além de limits |

Helpers reais: `usePlanLimits`, `getUserPlanContext`, `getPlanLimits`, `normalizeUserPlan`, `canUseProjectEmbed`, `assertCan*`, `assert*Enabled`.

### Se alterarmos SOMENTE `users/{uid}.plan.id = "studio"`?

| Forma | Resultado |
|-------|-----------|
| String `"studio"` | Entitlement Studio **sim** |
| `{ id: "studio" }` (sem status) | Studio **sim** |
| `{ id: "studio", status: "active" }` | Studio **sim** (recomendado) |
| `{ id: "studio", status: "canceled" }` | Trata como **Starter** |

`source`, `billing`, `subscriptions` **não** são necessários para limites/features.

**Caveats operacionais (não bloqueiam entitlement de limites):**

1. `publicProfiles.portfolioAvailable` só sobe via Admin/callable (`syncPublicPortfolioAvailability`) ou webhook — cliente não pode promover. Após grant manual, se o usuário já tiver `portfolioEnabled: true`, chamar o sync (ou pedir que salve settings de novo).
2. Preferir objeto completo alinhado ao webhook para evitar ambiguidades na UI de billing.

---

## 6. Billing × Entitlement

### Separação atual

| Conceito | Store | Uso |
|----------|-------|-----|
| ENTITLEMENT | `users.plan` | Features e quotas |
| BILLING | `users.billing` + `subscriptions` + `invoices` | Stripe, cobrança, cancelamento |

### Studio ativo + nenhuma assinatura Stripe?

**Sim, arquiteturalmente possível e já suportado pelo enforcement.**

Testes (`userMappers.billing.test.js`) confirmam que billing ausente/inválido **não concede** entitlement — o inverso também vale: plano pago em `users.plan` não exige IDs Stripe para `planId`.

### Frontend assume Studio === Stripe?

**Parcialmente na UI de billing, não no entitlement.**

- Consumo / limites: usam `planId` normalizado → OK para manual.
- `ManageSubscriptionSection` (paid view): mostra “Plano Studio”, status derivado de `billing.subscriptionStatus` (que `enrichBillingFromUserDoc` **copia de `plan.status`**), “Próxima cobrança”, valor mensal de catálogo.
- `canCancelStripeSubscription(billing)`: se `provider === "stripe"` (default do bootstrap) **e** `subscriptionStatus` ficou `"active"` via `plan.status`, o botão **Cancelar assinatura aparece** mesmo sem `subscriptionId`.

Isso é o principal atrito UX/segurança operacional do grant manual hoje (ver §7 e riscos P1).

---

## 7. Tela de planos (`/plan`) — usuário Studio sem Stripe

Assumindo grant:

```js
plan: { id: "studio", status: "active" }  // source opcional
billing: { provider: "stripe", subscriptionStatus: "free" }  // inalterado
// sem subscriptions/{uid}, sem invoices
```

| Elemento | Comportamento esperado hoje |
|----------|-----------------------------|
| Consumo (projetos/imagens/storage) | Limites Studio — **correto** |
| Plano atual | “Plano Studio” — **correto** |
| Status da assinatura | Provavelmente **“Ativa”** (porque `plan.status` sobrescreve `billing.subscriptionStatus` no mapper) — **enganoso** |
| Próxima cobrança | Visível com valor **“Próxima cobrança indisponível”** — confuso, não quebra |
| Valor mensal | “R$ 199 /mês” do catálogo — **enganoso** para cortesia |
| Gerenciar assinatura (portal) | Botão comentado / stub “Disponível em breve” — OK |
| Cancelar assinatura | **Botão pode aparecer**; callable falha com “Assinatura não encontrada” (sem `subscriptions/{uid}`) — **erro UX, sem downgrade** |
| Histórico | Empty state “Nenhuma cobrança disponível.” — OK |
| Alterar plano / upgrade | Modal abre; checkout depende de prices/flag |

Não há chamada Stripe no render da página só por ser Studio. Chamadas Stripe só ocorrem em ações (checkout/cancel) e cancel exige doc em `subscriptions`.

---

## 8. Webhooks e risco de sobrescrita

### Quem sobrescreve `users.plan.id`?

| Processo | Sobrescreve `plan.id`? | Risco para Studio manual **sem** Stripe |
|----------|------------------------|-----------------------------------------|
| `checkout.session.completed` | Sim → plano pago | Só se o usuário completar um checkout |
| `customer.subscription.deleted` | Sim → starter + `source:"system"` | **Só se existir assinatura Stripe** que seja deletada |
| `customer.subscription.updated` | Não (`id`) | — |
| `invoice.*` | Não | — |
| `ensureUserStructure` | Só se doc **ausente** | **Não** reseta plano existente |
| Login / refresh | Não | — |
| `repairUserWorkspaceFields` | Não (plan/billing) | — |
| Scheduled reconcile | **Não encontrado** | — |

### Conclusão

Para um usuário **sem** customer/subscription Stripe, o risco de downgrade automático é **baixo**.

Se no futuro o mesmo UID ganhar assinatura Stripe e ela for cancelada, o webhook **vai** forçar Starter — esperado para Stripe, perigoso se ainda se quiser preservar cortesia manual (tratar na migração futura).

---

## 9. `source: "manual"`

### Estado atual

- **Não existe** constante, validator, Rule, teste ou branch de UI para `"manual"`.
- Schema é aberto (`source` é string opcional).
- Rules **não validam** o conteúdo de `plan` em updates (updates de `plan` são negados ao cliente; Admin SDK bypassa Rules).
- Frontend: único special-case é `plan.source === "stripe"` em `enrichBillingFromUserDoc`.
- Functions: gravam `stripe` / `system`; leitores de entitlement ignoram `source`.

### Se introduzir oficialmente `"manual"` (futura RC — não nesta auditoria)

| Camada | Precisa mudar? |
|--------|----------------|
| Schema Firestore | Não (campo livre) |
| Rules | Não (Admin write) |
| `normalizeUserPlan` | Não (ignora source) |
| `userMappers.enrichBillingFromUserDoc` | **Sim recomendado** — não tratar status de plano manual como assinatura Stripe cancelável |
| Billing UI (`canCancelStripeSubscription`, period display, preço) | **Sim** — ramo “plano concedido” / sem cobrança |
| Webhooks | Opcional: preservar manual em `subscription.deleted` se política for “cortesia sobrevive” (não necessário no go-live sem Stripe) |
| Docs / runbook admin | Sim |
| Testes | Sim — mapper + UI + regras de cancel |

**Para go-live imediato:** `source: "manual"` é **desejável mas não obrigatório** para entitlement. Já é possível usar `source: "system"` (já existe) ou omitir `source`. Recomendação de produto: introduzir `"manual"` na RC de suporte oficial para distinguir cortesia de downgrade automático.

---

## 10. Modelo recomendado (mínimo)

### Grant operacional (hoje, sem código)

```js
// users/{uid} — Admin SDK / Console
plan: {
  id: "studio",
  status: "active",
  source: "manual",   // opcional hoje; recomendado se RC formalizar
  updatedAt: Timestamp.now()
}
// NÃO alterar billing para inventar customer/subscription
// NÃO criar subscriptions/{uid}
// NÃO criar invoices fake
```

Manter:

```js
billing: {
  provider: "stripe",
  subscriptionStatus: "free"
}
```

### Campos extras (`grantedAt`, `grantedReason`, …)

Ver §11. **Não** são necessários para entitlement funcionar.

### Modelo oficial futuro (RC)

```js
plan: {
  id: "studio",
  status: "active",
  source: "manual",
  updatedAt: Timestamp,
  // opcional audit:
  // grantedAt, grantedBy, grantedReason
}
```

Evitar duplicar entitlement em `workspaces.planId` ou claims.

---

## 11. Dados de auditoria

| Campo | Valor agregado | Recomendação |
|-------|----------------|--------------|
| `grantedAt` | Rastrear quando | **Útil** (ops / suporte) |
| `grantedBy` | Quem concedeu (uid admin / e-mail interno) | **Útil** se houver mais de um operador; evitar PII desnecessária — preferir uid admin ou label `"ops"` |
| `grantedReason` | Motivo curto (`"beta-partner"`, `"internal"`) | **Útil** |
| Notas longas / e-mail do cliente no doc | Pouco valor no doc de usuário | Preferir ticket externo |

Para **uma** concessão no go-live: um registro em runbook/Notion + `updatedAt` no doc basta. Formalizar campos na RC se concessões manuais se tornarem recorrentes.

---

## 12. Como conceder o plano

| Abordagem | Prós | Contras | Adequação agora |
|-----------|------|---------|-----------------|
| **A) Firebase Console** editar `users/{uid}` | Zero código; imediato | Erro humano; sem audit trail; fácil esquecer sync de portfolio | **OK para 1 usuário** com checklist |
| **B) Script admin interno** (Admin SDK) | Repetível; pode sync portfolio; log | Precisa manter script | Melhor se >1 grant |
| **C) Function / admin tooling** | Seguro e auditável | Overkill no estágio atual | Adiar |

### Recomendação estágio atual

**A (Console) com checklist rigoroso**, ou **B** se o time já tem script Admin.

Checklist mínimo:

1. Identificar `uid` correto.
2. Setar `plan` objeto Studio `active` (idealmente `source: "manual"`).
3. **Não** criar `subscriptions/{uid}` nem IDs Stripe fictícios.
4. Manter `billing` free.
5. Se `portfolioEnabled === true`, rodar sync de `portfolioAvailable` (callable como o usuário, ou Admin set).
6. Validar no app: criar projeto além do limite Starter, upload, hotspots.
7. Abrir `/plan` e confirmar que cancelamento, se aparecer, **não** deve ser usado (ou aplicar RC de UI antes).

---

## 13. Como remover (Studio manual → Starter)

Sem Stripe:

```js
plan: "starter"
// OU
plan: {
  id: "starter",
  status: "active",
  source: "system", // ou "manual" se política for “revogado”
  cancelAtPeriodEnd: false,
  updatedAt: Timestamp
}
```

- Manter `billing` free; não inventar cancel Stripe.
- Recalcular `publicProfiles.portfolioAvailable` (deve ir a `false` se plano não elegível).
- Não é necessário apagar `invoices`/`subscriptions` se nunca existiram.

Evitar deixar `plan: { id: "studio", status: "canceled" }` se a intenção for Starter visualmente limpo — funciona para entitlement, mas a UI paid pode ficar estranha.

---

## 14. Migração futura para Stripe

### Cenário

```text
manual Studio  →  checkout Stripe Studio  →  webhook  →  plan.source = "stripe"
```

### Funciona hoje?

**Sim, com nuance:**

1. `createStripeCheckoutSession` usa `resolveEffectivePlanId`. Se o usuário já é Studio manual ativo, `getPlanTier(studio) >= getPlanTier(studio)` → checkout **bloqueado** (“já possui assinatura…”).
2. Portanto: para migrar **o mesmo** plano Studio, hoje seria necessário **temporariamente** baixar o entitlement (ex.: Starter) **ou** alterar o gate de checkout para permitir “attach billing” quando `source !== "stripe"`.
3. Alternativa operacional: conceder Professional manual → checkout upgrade Studio Stripe (tier maior) — funciona sem mudar código, mas é caminho torto.

### Após webhook

- `plan` vira `{ id, status:"active", source:"stripe" }` — sobrescreve campos manuais.
- `billing.stripe.*` e `subscriptions/{uid}` passam a existir.
- Campos `granted*` manuais seriam perdidos no merge do objeto `plan` (o set substitui o mapa `plan` inteiro em `updateUserAfterCheckout`).

### Riscos

| Risco | Notas |
|-------|-------|
| Downgrade temporário | Se forçar Starter antes do checkout, há janela sem Studio |
| `subscription.deleted` futuro | Volta a Starter mesmo se ainda quisesse cortesia |
| Consistência | Remover ou arquivar metadados manuais após `source:"stripe"` |

### Comportamento esperado recomendado (futura RC)

- Permitir checkout quando `plan.source === "manual"` mesmo com mesmo `plan.id` (converter cortesia → assinatura).
- Webhook escreve `source: "stripe"` e limpa `granted*`.
- Não depender de downgrade temporário.

---

## 15. Checkout desabilitado (produção inicial)

### Objetivo UX

- Starter: normal.
- Professional / Studio: **visíveis**, sem checkout real.
- Copy coerente com UI atual: já existem **“Em breve”** (`STUDIO_PLAN_UNAVAILABLE_LABEL`, Enterprise) e **“Pagamentos serão ativados em breve.”** (`PAYMENTS_COMING_SOON_MESSAGE`).

Recomendação de copy: **“Em breve”** nos CTAs de planos pagos (alinhado a Studio/Enterprise); toast `PAYMENTS_COMING_SOON_MESSAGE` se alguém ainda acionar fluxo.

### Pontos de bloqueio

| Camada | Mecanismo atual | Suficiente sozinho? |
|--------|-----------------|---------------------|
| Frontend Studio | `REACT_APP_STRIPE_STUDIO_CHECKOUT=false` → CTA “Em breve” | Só Studio |
| Frontend Professional | Sempre em `getStripeCheckoutPlanIds()` | **Não** — botão “Assinar Professional” permanece ativo |
| Backend prices | `STRIPE_PRICE_PROFESSIONAL` / `STRIPE_PRICE_STUDIO` vazios → gate rejeita | **Sim (autoritativo)** |
| Backend secret | Sem `STRIPE_SECRET_KEY` → checkout falha | Sim, mas erro genérico |
| Landing | Studio respeita flag; Professional pode linkar upgrade | Parcial |

**Não confiar só em esconder botão.** O ponto seguro é o backend (`getAllowedCheckoutPlanIds` + `resolveCheckoutPlanFromRequest`).

### Estratégia mínima segura no go-live

1. **Produção Functions:** não configurar (ou deixar vazio) `STRIPE_PRICE_PROFESSIONAL` e `STRIPE_PRICE_STUDIO`.
2. **Frontend:** `REACT_APP_STRIPE_STUDIO_CHECKOUT=false`.
3. **RC recomendada:** flag única `PAID_CHECKOUT_ENABLED=false` (ver §16) para Professional + Studio no client e server — evita clique → erro.

---

## 16. Feature flag (recomendação — não implementar aqui)

### Proposta mínima

| Env | Side | Default prod go-live | Default dev |
|-----|------|----------------------|-------------|
| `PAID_CHECKOUT_ENABLED` / `REACT_APP_PAID_CHECKOUT_ENABLED` | Functions + Frontend | `false` | `true` (ou conforme Stripe local) |
| Manter `REACT_APP_STRIPE_STUDIO_CHECKOUT` | Frontend | pode permanecer como opt-out fino | — |
| `STRIPE_PRICE_*` | Functions | vazios até enable | preenchidos no emulador/local |

### Comportamento

- `false`: `getAllowedCheckoutPlanIds()` → vazio **ou** gate early-return; UI usa “Em breve” / `PAYMENTS_COMING_SOON_MESSAGE`.
- `true`: comportamento atual (prices ainda obrigatórios).

Arquitetura mínima > múltiplas flags desencontradas. A flag **não substitui** prices vazios como defense-in-depth.

---

## 17. Segurança (P0)

### Cliente pode alterar `users.plan` / `users.billing`?

**Não.**

Evidência `firestore.rules`:

- **Create:** `plan == 'starter'` + `isStarterBootstrapBilling` apenas.
- **Update:** allowlist **exclui** `plan` e `billing`:

```
affected.hasOnly([
  'displayName', 'updatedAt', 'legalConsent',
  'welcomeEmailQueuedAt', 'marketingPreferences'
])
```

Comentário explícito: “plan / billing: bootstrap starter no create; updates só via Admin SDK.”

Testes: `tests/firestore-rules/firestore.rules.test.js` — “owner cannot change users.plan”, “owner cannot change users.billing”, workspace.planId imutável, `portfolioAvailable` não promovível pelo cliente.

`subscriptions` / `invoices`: escrita cliente negada.

### Conclusão P0 self-promote

**Bloqueado.** Usuário não consegue Starter → Studio via SDK cliente.

---

## 18. Testes existentes e lacunas

### Cobertura encontrada

| Área | Exemplos |
|------|----------|
| Rules plan/billing | `tests/firestore-rules/firestore.rules.test.js` |
| Matriz planos / checkout flags | `src/config/planLimits.test.js`, `billing.test.js` |
| Mapper billing | `userMappers.billing.test.js` |
| ensureUserStructure | `ensureUserStructure.test.js` |
| planService storage | `planService.storageQuota.test.js` |
| Portfolio resolver | `tests/functions/resolvePortfolioAvailable.test.js`, `portfolio.test.js` |
| Checkout gate / plan resolution | `checkoutPlanGate.test.js`, `planResolution.test.js` |
| Env Stripe | `tests/functions/envConfig.test.js` |

### Lacunas para plano manual

1. Caso `plan: { id:"studio", status:"active", source:"manual" }` + billing free → `planId` Studio, **cancel button hidden**.
2. `canCancelStripeSubscription` não deve ativar só porque `plan.status === "active"` sem subscriptionId.
3. Webhook `subscription.deleted` vs preservação de manual (política futura).
4. Flag `PAID_CHECKOUT_ENABLED` (quando existir).
5. Integração E2E do `stripeWebhook` (handlers) — pouco/nenhum teste de integração encontrado.

---

## 19. Matriz final de cenários

| Cenário | `users.plan` | Stripe | Entitlement | Billing UI | Checkout | Próxima cobrança | Gerenciar / Cancelar |
|---------|--------------|--------|-------------|------------|----------|------------------|----------------------|
| Starter gratuito | `"starter"` + billing free | Nenhum | Starter | View Starter + upgrade | Bloquear pagos (flag/prices) | N/A | Sem cancel Stripe |
| Studio manual | `{id:"studio", status:"active", source:"manual"?}` + billing free | Nenhum | Studio | Mostra Studio; status/preço podem enganar | Deve bloquear (já no tier) | “indisponível” se visível | Cancel pode aparecer hoje → erro callable (P1) |
| Professional manual | Idem com `professional` | Nenhum | Professional | Idem | Bloquear / Em breve | Idem | Idem P1 |
| Studio Stripe | `{id:"studio", status:"active", source:"stripe"}` + billing.stripe IDs | Sub ativa | Studio | Status ativa + período | Bloqueado (já no tier) | Data real | Cancel OK (callable) |
| Stripe cancelado | `{id:"starter", source:"system"}` após `subscription.deleted` | Sub canceled | Starter | Starter | Disponível se prices on | N/A | Sem cancel ativo |
| Manual → Stripe | Ideal: webhook → `source:"stripe"` | Nova sub | Studio | UI Stripe | Hoje bloqueia mesmo tier (§14) | Após webhook: real | Após webhook: OK |
| Manual → Starter | Voltar `plan` starter | Nenhum | Starter | Starter | Em breve / on | N/A | N/A |

---

## 20. Respostas objetivas

1. **Podemos conceder Studio manualmente hoje sem alteração de código?**  
   **Sim** (Admin SDK / Console em `users.plan`).

2. **Quais campos alterar?**  
   Preferencialmente:
   ```js
   plan: { id: "studio", status: "active", source: "manual", updatedAt: <now> }
   ```
   Mínimo funcional: `{ id: "studio", status: "active" }` ou até string `"studio"`.

3. **Quais documentos NÃO criar?**  
   - `subscriptions/{uid}`  
   - `invoices/*` fake  
   - `billing.stripe.customerId` / `subscriptionId` fictícios  
   - Não alterar `workspaces.planId` como “entitlement”

4. **Risco de sobrescrita?**  
   **Baixo** sem Stripe. `ensureUserStructure` não reseta. Risco real só com assinatura Stripe + `customer.subscription.deleted`.

5. **Precisamos introduzir `source="manual"`?**  
   **Não para entitlement funcionar.** **Sim como boa prática / RC oficial** para UX de billing e ops.

6. **Arquivos a mudar numa futura RC oficial**  
   - `src/services/users/userMappers.js` (não mapear status manual → assinatura cancelável)  
   - `src/config/billing.js` (`canCancelStripeSubscription`, period display, labels)  
   - `src/components/plans/ManageSubscriptionSection.jsx` / `Plan.js` (copy “Plano concedido”, esconder cancel/cobrança)  
   - Opcional: `functions/src/createStripeCheckoutSession.js` (migração manual→Stripe mesmo tier)  
   - Opcional: flag paid checkout frontend + `checkoutPlanGate` / `stripeBilling.js`  
   - Testes mapper/UI/rules docs  
   - Runbook admin

7. **UI de Billing para plano manual?**  
   Ideal: plano atual Studio; status “Sem assinatura ativa” ou “Acesso concedido”; sem próxima cobrança; sem cancel Stripe; sem valor cobrado como se fosse assinatura.  
   **Hoje:** mostra Studio + pode parecer assinatura ativa e oferecer cancel.

8. **Migrar depois para Stripe?**  
   Webhook já escreve `source:"stripe"`. Gate atual impede checkout no mesmo tier — precisa RC ou workaround (downgrade temporário / upgrade de tier).

9. **Desabilitar checkout pago com segurança?**  
   Backend: prices vazios (+ secret ausente se desejado). Frontend: Studio flag false + **RC** para Professional/Em breve. Não confiar só no UI.

10. **P0 que impeça go-live dessa estratégia?**  
    **Não.** Self-promote está fechado; entitlement manual funciona.  
    **P1:** UI de cancel/cobrança enganosa; Professional ainda clicável no frontend se prices vazios (erro no backend).

---

## 21. Riscos

| Severidade | Risco | Mitigação go-live |
|------------|-------|-------------------|
| P0 | Self-promote via cliente | Já mitigado (Rules) |
| P1 | Botão cancelar em Studio manual | Operacional: não usar; RC mapper/UI |
| P1 | “Próxima cobrança” / “R$ 199/mês” enganosos | Aceitar temporariamente ou RC UI |
| P1 | CTA Professional ativo → erro Functions | Esvaziar prices + RC flag “Em breve” |
| P2 | `portfolioAvailable` stale após grant | Sync pós-grant |
| P2 | `source:"manual"` não formalizado | Documentar no runbook; RC depois |
| P2 | Migração manual→Stripe mesmo tier | Adiar até RC do gate |

---

## Recomendação final

### Para o primeiro go-live (sem código)

1. Novos usuários: fluxo atual Starter — **OK**.
2. Checkout: deixar `STRIPE_PRICE_*` vazios em produção; `REACT_APP_STRIPE_STUDIO_CHECKOUT=false`.
3. Conceder Studio ao usuário alvo via Admin/Console:
   - `plan: { id: "studio", status: "active", source: "manual" }`
   - não criar subscription/billing Stripe fake
4. Validar features + sync portfolio se necessário.
5. Orientar ops a **ignorar** “Cancelar assinatura” se aparecer.

### RC seguinte (suporte oficial a manual + payments off)

1. Tratar `source === "manual"` na UI/mapper (sem cancel Stripe, sem próxima cobrança falsa).
2. Flag `PAID_CHECKOUT_ENABLED` (frontend + Functions).
3. (Opcional) checkout “converter cortesia → Stripe” no mesmo tier.
4. Testes das lacunas §18.

### Arquivos de referência (somente leitura nesta auditoria)

- `src/config/planLimits.js`
- `src/config/billing.js`
- `src/services/users/userMappers.js`
- `src/services/users/ensureUserStructure.js`
- `src/services/users/userService.js`
- `src/services/plans/planService.js`
- `src/hooks/usePlanLimits.js`
- `src/pages/Plan.js`
- `src/components/plans/ManageSubscriptionSection.jsx`
- `functions/src/stripeWebhook.js`
- `functions/src/createStripeCheckoutSession.js`
- `functions/src/billing/checkoutPlanGate.js`
- `functions/src/config/stripeBilling.js`
- `functions/src/cancelStripeSubscription.js`
- `functions/src/portfolio/resolvePortfolioAvailable.js`
- `firestore.rules`

---

*Fim da auditoria AUDIT-MANUAL-PLAN-ENTITLEMENT-1. Nenhuma alteração de código, Firestore, build ou deploy foi feita nesta entrega.*
