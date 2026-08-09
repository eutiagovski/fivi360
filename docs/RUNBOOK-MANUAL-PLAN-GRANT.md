# RUNBOOK — Concessão manual de plano

Operação Admin para Professional / Studio **sem** assinatura Stripe.

**Pré-requisitos:** Firebase Console (Firestore) ou Admin SDK. Cliente **não** pode escrever `users.plan` / `users.billing` (Rules).

**Referência:** `docs/RC-MANUAL-PLAN-AND-PAYMENTS-GATE-1.md`, `docs/AUDIT-MANUAL-PLAN-ENTITLEMENT-1.md`

---

## Princípios

1. Fonte de entitlement: **somente** `users/{uid}.plan`.
2. **Não** criar `subscriptions/{uid}`, `invoices/*`, nem `billing.stripe.customerId` / `subscriptionId` fake.
3. Manter `billing` bootstrap (`provider: "stripe"`, `subscriptionStatus: "free"`) salvo se já houver Stripe real.
4. `source: "manual"` é metadado de UI/ops — **não** altera limites.

---

## Starter → Studio manual

1. Identificar o `uid` (Authentication / Firestore `users`).
2. Em `users/{uid}`, definir (merge / campo `plan`):

```json
{
  "plan": {
    "id": "studio",
    "status": "active",
    "source": "manual",
    "updatedAt": "<Timestamp agora>"
  }
}
```

3. **Não** alterar `billing` para inventar IDs Stripe.
4. Validar no app (login do usuário):
   - Limites Studio (projetos/imagens/storage/hotspots).
   - `/plan`: “Plano Studio”, status **“Acesso concedido”**, sem cancelar / próxima cobrança.

### Portfólio (`portfolioAvailable`)

Se `publicProfiles/{uid}.portfolioEnabled === true` e o portfólio público ainda não abrir:

**Opção A (preferida — usuário):** abrir Settings → salvar perfil com portfólio ativo → o app chama a callable `syncPublicPortfolioAvailability` (Admin SDK no servidor; cliente não promove o flag).

**Opção B (Admin):** recalcular e setar via Admin SDK:

```text
portfolioAvailable = portfolioEnabled === true && plan elegível (professional|studio|enterprise, status active|trialing)
```

Espelha `functions/src/portfolio/resolvePortfolioAvailable.js`.  
**Não** permitir que o cliente escreva `portfolioAvailable: true`.

---

## Starter → Professional manual

Igual ao Studio, com:

```json
{
  "plan": {
    "id": "professional",
    "status": "active",
    "source": "manual",
    "updatedAt": "<Timestamp agora>"
  }
}
```

---

## Professional / Studio manual → Starter (revogação)

1. Definir:

```json
{
  "plan": "starter"
}
```

ou

```json
{
  "plan": {
    "id": "starter",
    "status": "active",
    "source": "system",
    "cancelAtPeriodEnd": false,
    "updatedAt": "<Timestamp agora>"
  }
}
```

2. Recalcular `publicProfiles/{uid}.portfolioAvailable` (deve ir a `false` se não elegível).
3. Não chamar Stripe cancel — não há assinatura.

---

## Checklist pós-grant

- [ ] `users.plan.id` e `status: "active"`, `source: "manual"`
- [ ] Sem `subscriptions/{uid}` inventado
- [ ] Sem IDs Stripe fake em `billing`
- [ ] App: entitlement do plano concedido
- [ ] `/plan`: “Acesso concedido”, sem cancelar
- [ ] Portfólio sync se necessário

---

## Migração futura para Stripe

**Não implementar agora.** Pendência: `RC-MANUAL-TO-STRIPE-CONVERSION`.

Hoje o checkout bloqueia se o usuário já está no mesmo tier (ou superior), mesmo com `source: "manual"`. Não usar downgrade temporário para Starter como workaround em produção.
