# Plano de e-mails transacionais — Resend + Firebase Functions

Documentação da arquitetura de e-mails transacionais do FIVI360. **Marketing, newsletters e campanhas estão fora de escopo nesta fase.**

## Objetivo

Enviar e-mails transacionais de forma segura e escalável:

- A **API key do Resend nunca** vai para o frontend React.
- O frontend apenas **enfileira** pedidos de envio no Firestore.
- **Cloud Functions** consomem a fila e enviam via Resend usando **Firebase Secrets**.

---

## Domínio de envio

Recomendamos um subdomínio dedicado (não o apex `fivi360.com.br`):

| Opção | Exemplo de remetente |
|-------|----------------------|
| **Preferida** | `onboarding@emails.fivi360.com.br` |
| Alternativa | `onboarding@mail.fivi360.com.br` |

Vantagens:

- Isolamento de reputação (transacional vs. site principal).
- SPF/DKIM/DMARC configurados só para envio.
- Facilita futura separação de subdomínios (ex.: `billing@...`).

---

## DNS no Resend

1. Criar conta/projeto no [Resend](https://resend.com).
2. Em **Domains**, adicionar `emails.fivi360.com.br` (ou `mail.fivi360.com.br`).
3. Copiar os registros DNS exigidos (tipicamente):
   - **SPF** (TXT)
   - **DKIM** (CNAME ou TXT)
   - **DMARC** (TXT) — recomendado após validação
4. Aguardar verificação do domínio no painel Resend.
5. Só então usar endereços `@emails.fivi360.com.br` como `from`.

Sem domínio verificado, use o domínio sandbox do Resend **apenas em desenvolvimento** (só envia para e-mails autorizados na conta).

---

## Segredo `RESEND_API_KEY`

| Onde | O que fazer |
|------|-------------|
| **Firebase Secrets** | Armazenar `RESEND_API_KEY` |
| **Cloud Functions** | Ler via `defineSecret("RESEND_API_KEY")` |
| **Frontend React** | **Nunca** incluir a chave (nem em `.env`, nem no bundle) |
| **Repositório** | **Nunca** commitar a chave |

### Configurar o secret (produção)

```bash
firebase functions:secrets:set RESEND_API_KEY
# Cole a chave quando solicitado (re_...)

firebase deploy --only functions
```

### Desenvolvimento local (emulador)

Secrets com `defineSecret` **devem** ir em `functions/.secret.local` (o Emulator não lê secrets de `.env.local`).

```powershell
# Na pasta functions/
# Criar/editar .secret.local (gitignored) com:
# RESEND_API_KEY=re_sua_chave_de_dev
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

Remetente não sensível (opcional) em `.env` / `.env.local`:

```env
RESEND_FROM_EMAIL=FIVI360 <onboarding@emails.fivi360.com.br>
```

Reinicie o Functions Emulator após alterar `.secret.local` ou `.env*`.

Guia unificado: [RC-FUNCTIONS-ENV-CLEANUP-1.md](./RC-FUNCTIONS-ENV-CLEANUP-1.md).

---

## Arquitetura

```mermaid
flowchart LR
  subgraph Frontend["React (Hosting)"]
    App[App / Auth]
    QueueSvc[emailQueueService]
  end

  subgraph Firestore["Firestore"]
    EQ[emailQueue/{emailId}]
  end

  subgraph Functions["Cloud Functions"]
    PEQ[processEmailQueue]
    Templates[emailTemplates]
    Resend[Resend API]
  end

  App --> QueueSvc
  QueueSvc -->|"create (status: pending)"| EQ
  EQ -->|onCreate trigger| PEQ
  PEQ --> Templates
  PEQ --> Resend
  PEQ -->|"update sent/failed"| EQ
```

### Princípios

1. **Fila desacoplada** — falha no envio não bloqueia cadastro ou checkout.
2. **Idempotência futura** — `resendId` permite rastrear duplicatas; retries podem ser adicionados depois.
3. **Templates no backend** — HTML/texto gerados nas Functions, não no cliente.
4. **Tipos explícitos** — campo `type` mapeia para um template.

---

## Coleção `emailQueue/{emailId}`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | string | Identificador do template (ver eventos abaixo) |
| `to` | string | Destinatário |
| `userId` | string | UID Firebase Auth |
| `payload` | map | Dados específicos do template |
| `status` | string | `pending` \| `processing` \| `sent` \| `failed` |
| `createdAt` | timestamp | Criação do item na fila |
| `sentAt` | timestamp \| null | Quando enviado com sucesso |
| `resendId` | string \| null | ID retornado pelo Resend |
| `error` | string \| null | Mensagem de erro se `failed` |

### Status

| Status | Significado |
|--------|-------------|
| `pending` | Aguardando processamento (trigger da Function) |
| `processing` | Function assumiu o envio |
| `sent` | Resend aceitou o e-mail |
| `failed` | Erro no envio (ver `error`) |

---

## Eventos (tipos de e-mail)

### Implementados nesta fase

| `type` | Quando | Payload |
|--------|--------|---------|
| `welcome` | Cadastro concluído (`acceptedSource: signup`) | `{ name, companyName }` |
| `billing_upgrade_requested` | Usuário solicita upgrade (futuro próximo no app) | `{ name, planId, planName }` |

### Planejados (não implementar ainda)

| `type` | Quando |
|--------|--------|
| `payment_success` | Webhook de pagamento confirmado |
| `payment_failed` | Falha de cobrança |
| `subscription_canceled` | Cancelamento de assinatura |

**Fora de escopo:** newsletter, marketing, campanhas, automações, editor de e-mails, unsubscribe, e-mails de pagamento reais.

---

## Cloud Function: `processEmailQueue`

**Arquivo:** `functions/src/processEmailQueue.js`

**Gatilho:** `onDocumentCreated` em `emailQueue/{emailId}` quando `status === "pending"`.

**Fluxo:**

1. Validar documento (`type`, `to`, `payload`).
2. Atualizar `status` → `processing`.
3. Resolver template (`welcomeEmail`, `upgradeRequestedEmail`, …).
4. Enviar via Resend (`RESEND_API_KEY`).
5. Sucesso → `status: sent`, `sentAt`, `resendId`.
6. Erro → `status: failed`, `error`.

---

## Integração no app (cadastro)

Após `createUserProfile` com `acceptedSource === "signup"`:

```javascript
enqueueWelcomeEmail({ to: email, userId, name, companyName: "" })
```

- Se o write na fila falhar, **não bloqueia** o cadastro.
- Erro logado apenas em `NODE_ENV === "development"`.

Serviço: `src/services/email/emailQueueService.js`.

---

## Segurança — Firestore Rules

### Estado atual (fase 1)

O frontend **cria** documentos em `emailQueue` com restrições:

- `request.auth.uid == request.resource.data.userId`
- `request.resource.data.to == request.auth.token.email` (não enviar para terceiros)
- `type` em lista permitida (`welcome`, `billing_upgrade_requested`)
- `status == "pending"`
- Sem campos de servidor (`sentAt`, `resendId`, `error`)

Leitura, update e delete pelo cliente: **negados**.

### Risco

Um usuário autenticado pode enfileirar e-mails **para si mesmo** repetidamente (spam interno / custo Resend). Mitigações futuras:

| Solução | Descrição |
|---------|-----------|
| **Ideal** | Escrita **somente** via Cloud Functions (Callable ou trigger em `users`) |
| Rate limit | Function ou regra que limita N welcome por `userId` |
| Admin-only create | Remover `allow create` do cliente após migrar enqueue para backend |

### Solução futura recomendada

1. Remover `allow create` do cliente em `emailQueue`.
2. Criar Function `onUserCreated` ou Callable `enqueueTransactionalEmail` validada no servidor.
3. Frontend chama Callable ou apenas cria perfil; Function enfileira o welcome.

Documentar esta migração quando billing/webhooks forem implementados.

---

## Como testar o e-mail de welcome

### Pré-requisitos

1. `RESEND_API_KEY` configurada (secret ou `.secret.local`).
2. Domínio verificado **ou** e-mail de destino autorizado no sandbox Resend.
3. Functions deployadas **ou** emuladores rodando com trigger Firestore.

### Passo a passo

1. **Deploy das rules e functions:**
   ```bash
   firebase deploy --only firestore:rules,functions
   ```

2. **Cadastrar usuário** em `/register` (e-mail/senha) ou Google (primeiro acesso).

3. **Verificar Firestore** — documento em `emailQueue`:
   - `type: "welcome"`
   - `status` evolui: `pending` → `processing` → `sent`

4. **Verificar caixa de entrada** do e-mail cadastrado.

5. **Logs:**
   ```bash
   firebase functions:log --only processEmailQueue
   ```

### Emulador local

```bash
# Terminal 1 — emuladores (incluir functions após configurar)
firebase emulators:start --only auth,firestore,functions

# Terminal 2 — app React apontando para emuladores
REACT_APP_USE_FIREBASE_EMULATORS=true yarn start
```

Cadastre um usuário; confira `emailQueue` no Emulator UI (`http://localhost:4000`).

---

## Arquivos da implementação

| Caminho | Função |
|---------|--------|
| `docs/resend-email-plan.md` | Este documento |
| `functions/package.json` | Dependências Node (firebase-functions, resend) |
| `functions/src/index.js` | Export das Functions |
| `functions/src/processEmailQueue.js` | Trigger da fila |
| `functions/src/config/email.js` | Remetente padrão, tipos permitidos |
| `functions/src/email/resendClient.js` | Cliente Resend + secret |
| `functions/src/emailTemplates/shared.js` | Layout HTML/texto compartilhado |
| `functions/src/emailTemplates/welcomeEmail.js` | Template welcome |
| `functions/src/emailTemplates/upgradeRequestedEmail.js` | Template upgrade |
| `functions/src/emailTemplates/index.js` | Roteador de templates |
| `src/services/email/emailQueueService.js` | Enfileirar do frontend |
| `firestore.rules` | Regras `emailQueue` |
| `firebase.json` | Config `functions` |

---

## Checklist de produção

- [ ] Domínio `emails.fivi360.com.br` verificado no Resend
- [ ] `RESEND_API_KEY` em Firebase Secrets
- [ ] `firebase deploy --only functions,firestore:rules`
- [ ] Teste de cadastro real com recebimento do welcome
- [ ] Confirmar: nenhuma variável `RESEND_*` no `.env` do React
- [ ] Monitorar `emailQueue` com `status: failed` periodicamente
