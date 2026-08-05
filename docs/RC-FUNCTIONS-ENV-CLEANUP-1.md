# RC-FUNCTIONS-ENV-CLEANUP-1 — Unificar e documentar configuração local das Cloud Functions

**Data:** 2026-08-04  
**Status:** Concluído (sem deploy, sem build completo)  
**Escopo:** `functions/` env/secrets, docs, testes de configuração

---

## 1. Arquivos encontrados (auditoria)

### Dentro de `functions/`

| Arquivo | Existia? | Versionado? | Ignorado? | Papel |
|---------|----------|-------------|-----------|-------|
| `functions/.env` | Sim | Agora **sim** (não sensível) | Não (após cleanup) | Config compartilhada |
| `functions/.env.local` | Sim | Não | Sim | Overrides locais (Price IDs, `APP_BASE_URL`) |
| `functions/.secret.local` | Sim | Não | Sim | Secrets para `defineSecret` (Emulator) |
| `functions/.env.example` | Criado | **Sim** | Não | Template documentado |
| `functions/.secret` | Não | — | Ignorado preventivamente | N/A |

### Raiz do projeto (frontend CRA — fora do escopo de runtime das Functions)

| Arquivo | Notas |
|---------|-------|
| `.env.example` | Template frontend (`REACT_APP_*`) |
| `.env.local` | Frontend local (ignorado) |
| `.env.production` / `.env.production.local` | Frontend |

### Scripts / CI / docs que mencionavam env Functions

| Local | Uso |
|-------|-----|
| `docs/stripe-local-setup.md` | Guia Stripe + `.secret.local` |
| `docs/resend-email-plan.md` | Guia Resend + `.secret.local` |
| `docs/firebase-foundation.md` | Env frontend; agora também aponta Functions |
| `docs/AUDITORIA_PRE_DEPLOY_BETA.md` | Checklist secrets produção |
| `craco.config.js` | `dotenv` só no **frontend** (`require("dotenv").config()`) |
| CI (`.github`) | Ausente neste repo |

Nenhum script fazia parsing manual de `.secret.local` ou `dotenv` dentro de `functions/`.

---

## 2. Forma real de carregamento

| Mecanismo | Quem carrega | Arquivos | Quando |
|-----------|--------------|----------|--------|
| Firebase Emulator (dotenv integrado) | Firebase CLI | `.env`, depois `.env.local` | Start / discovery das Functions |
| Firebase Emulator (secrets) | Firebase CLI | `.secret.local` | Override de `defineSecret` (não usa `.env.local`) |
| `defineSecret(...).value()` | Runtime da Function | Secret Manager (prod) / `.secret.local` (emulador) | Só em Functions que declaram `secrets: [...]` |
| `defineString(...).value()` | Runtime | `.env` / `.env.local` / params de deploy | Functions com `params: [...]` |
| `process.env.APP_BASE_URL` / `RESEND_FROM_EMAIL` | Código | Injetados pelo Emulator a partir de `.env*` | Import / handler |
| `dotenv` manual em `functions/` | — | Nenhum | — |

Produção **não** depende de `.env.local` nem `.secret.local`. Secrets: Google Secret Manager via `defineSecret` + `firebase functions:secrets:set`.

---

## 3. Ordem de precedência (local)

Para variáveis **não secret** (params / `process.env`):

1. `.env` (base)
2. `.env.local` (**sobrescreve** `.env`)

Log típico do Emulator:

```text
Loaded environment variables from .env, .env.local
```

Para **secrets** (`defineSecret`):

1. `.secret.local` (override local)
2. Caso contrário, tentativa de Secret Manager com ADC (pode falhar offline)

**Não** há carregamento duplicado via `dotenv` no código das Functions. Nenhuma remoção de loader manual foi necessária.

Testes Jest setam `process.env` diretamente; não leem os arquivos `.env*` das Functions.

---

## 4. Papel do `.secret` / `.secret.local`

### `.secret.local` é necessário? **SIM**

| Pergunta | Resposta |
|----------|----------|
| Nome/caminho | `functions/.secret.local` |
| Conteúdo estrutural (só nomes) | `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Quem lê | Firebase CLI / Emulator (automático) |
| Código do app faz parse? | Não |
| Firebase reconhece automaticamente? | **Sim** — mecanismo oficial para override de `defineSecret` |
| Equivalente em `.env.local`? | **Não** — secrets em `.env.local` **não** alimentam `defineSecret` |

**Por quê manter:** a estrutura desejada (secrets só em `.env.local`) **não é compatível** com o runtime atual (`defineSecret` + Emulator). Remover `.secret.local` quebraria Stripe/Resend locais ou forçaria acesso ao Secret Manager de produção.

**Padronização:** documentar quatro arquivos — `.env`, `.env.example`, `.env.local`, **e** `.secret.local` (obrigatório para secrets).

Arquivo bare `.secret` não existia; regra de ignore preventiva adicionada.

---

## 5. Estrutura final

```text
functions/
├── .env              # não sensível, versionado
├── .env.example      # template, versionado
├── .env.local        # overrides locais, gitignored
└── .secret.local     # secrets locais (defineSecret), gitignored
```

Produção: Secret Manager + params Firebase — nunca arquivos locais versionados com secrets.

---

## 6. Matriz de variáveis

| Variável | `.env` | `.env.local` | `.secret.local` | Consumidor | Classificação | Ação |
|----------|--------|--------------|-----------------|------------|---------------|------|
| `APP_BASE_URL` | Sim (default localhost) | Override local | — | `config/app.js` | NON_SECRET_SERVER_CONFIG | Manter |
| `RESEND_FROM_EMAIL` | Opcional | Opcional | — | `config/email.js` | NON_SECRET_SERVER_CONFIG | Documentar (nome ≠ `RESEND_FROM`) |
| `STRIPE_PRICE_PROFESSIONAL` | Placeholder | Valores de conta | — | `defineString` / `stripeBilling.js` | NON_SECRET_SERVER_CONFIG | Manter em `.env.local` localmente |
| `STRIPE_PRICE_STUDIO` | Placeholder | Valores de conta | — | `defineString` | NON_SECRET_SERVER_CONFIG | Manter |
| `STRIPE_PRICE_STUDIO_MONTHLY` | — | Pode existir | — | Alias em `stripeBilling.js` | NON_SECRET_SERVER_CONFIG | Documentar como fallback opcional |
| `STRIPE_PRICE_PROFESSIONAL_MONTHLY` | — | Pode existir | — | Nenhum | LOCAL_ONLY / obsoleto | Não usar; documentar |
| `STRIPE_PRICE_ENTERPRISE` / `_MONTHLY` | — | Pode existir | — | Nenhum | LOCAL_ONLY / obsoleto | Não usar; documentar |
| `STRIPE_SECRET_KEY` | — | — | Sim | `defineSecret` / Stripe clients | SECRET | Manter só em `.secret.local` / Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | — | — | Sim | `defineSecret` / webhook | SECRET | Idem |
| `RESEND_API_KEY` | — | — | Sim | `defineSecret` / `processEmailQueue` | SECRET | Idem |

Price IDs: classificados como **não secret**, mas específicos de conta — preferir `.env.local` no dev; produção via `defineString` / config de deploy.

Duplicidade `APP_BASE_URL` em `.env` e `.env.local`: intencional; **`.env.local` vence**.

---

## 7. Classificação de segurança (resumo)

| Variável | Classificação | Local | Produção |
|----------|---------------|-------|----------|
| `STRIPE_SECRET_KEY` | SECRET | `.secret.local` | Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | SECRET | `.secret.local` | Secret Manager |
| `RESEND_API_KEY` | SECRET | `.secret.local` | Secret Manager |
| `APP_BASE_URL` | NON_SECRET_SERVER_CONFIG | `.env` / `.env.local` | Config/param de deploy |
| `RESEND_FROM_EMAIL` | NON_SECRET_SERVER_CONFIG | `.env` / `.env.local` | Config/param |
| `STRIPE_PRICE_*` | NON_SECRET_SERVER_CONFIG | `.env` / `.env.local` | `defineString` / config |

Não há `PUBLIC_CONFIG` no lado Functions (nada exposto ao browser). Frontend continua com `REACT_APP_*` na raiz.

---

## 8. Produção e Secret Manager

- `defineSecret("STRIPE_SECRET_KEY")`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- Binding via `secrets: [...]` nas Functions que precisam
- `defineString` para Price IDs
- **Nenhuma migração** de secrets de produção nesta sprint
- Deploy **não** executado

---

## 9. Alterações no `.gitignore`

### `functions/.gitignore`

- Remove catch-all `.env` / `.env.*` (que também ignorava `.env.example`)
- Ignora: `.secret.local`, `.secret`, `.env.local`, `.env.*.local`
- Permite: `.env`, `.env.example`

### Raiz `.gitignore`

- Escopo com `/` (`/.env`, `/.env.local`, …) para não bloquear `functions/.env`

---

## 10. Arquivos removidos

Nenhum. `.secret.local` **mantido** (necessário). Não havia `.secret` bare.

---

## 11. Código

| Mudança | Motivo |
|---------|--------|
| `functions/src/config/requireConfiguredSecret.js` | Validação lazy, mensagem clara, sem log de valor |
| `stripe/client.js` | Usa helper; retorna `null` se secret ausente |
| `stripeWebhook.js` | Erro controlado 500 se webhook secret ausente |
| `processEmailQueue.js` | Falha controlada no handler se `RESEND_API_KEY` ausente |
| `config/app.js` / `email.js` | Comentários de precedência / nome da env |

Sem validação global no import de `index.js`. Sem mudança de lógica de negócio.

---

## 12. Scripts e docs atualizados

- `functions/.env.example` (novo)
- `functions/.env` (base segura versionada)
- `docs/stripe-local-setup.md`
- `docs/resend-email-plan.md`
- `docs/firebase-foundation.md`
- `README.md` (seção onboarding Functions)
- Este documento

### Fluxo onboarding

```powershell
cd functions
npm install
Copy-Item .env.example .env.local
# Preencher .env.local (não secrets)
# Criar .secret.local (secrets de teste)
# Na raiz: npm run emulators
# Stripe CLI → atualizar STRIPE_WEBHOOK_SECRET em .secret.local → reiniciar Emulator
```

---

## 13. Testes executados

Arquivo: `tests/functions/envConfig.test.js`

Cobertura:

- Chaves em `.env.example` sem valores reais
- `.env.local` / `.secret.local` ignorados
- `.env.example` não ignorado
- `requireConfiguredSecret` (ok / ausente / erro)
- `APP_BASE_URL` via `process.env` e fallback
- `getStripeClient` → `null` sem secret
- `index.js` carrega exports sem secrets / sem chamadas externas
- Ausência Stripe não bloqueia embed; ausência Resend não bloqueia Stripe export

Comando (somente testes Functions relacionados):

```bash
npx jest --config tests/functions/jest.config.js --runInBand envConfig
```

**Build completo:** não executado (orientação da sprint).  
**Deploy:** não realizado.

---

## 14. Validação manual (checklist)

### Ambiente completo

- [ ] Iniciar Functions Emulator
- [ ] Confirmar log `Loaded environment variables from .env, .env.local`
- [ ] Confirmar exports carregadas
- [ ] Testar Stripe / Resend / Embed

### Secret ausente

- [ ] Remover temporariamente uma chave de `.secret.local`
- [ ] Reiniciar Emulator — Functions ainda carregam
- [ ] Invocar só a Function dependente — erro controlado

### Novo arquivo

- [ ] `Copy-Item .env.example .env.local`, preencher, criar `.secret.local`, subir Emulator

*(Checklist deixado para o desenvolvedor na máquina local; valores de secrets não foram impressos nesta entrega.)*

---

## 15. Riscos residuais

| Risco | Mitigação / nota |
|-------|------------------|
| Alguém colocar secrets em `.env` versionado | Docs + `.env.example` deixam claro; code review |
| Aliases obsoletos ainda em `.env.local` local | Documentados; código ignora Enterprise / Professional_MONTHLY |
| Histórico Git de secrets | `functions/.secret.local` e `.env.local` **nunca** estiveram tracked (`git ls-files`). Sem evidência de secret versionado → sem rotação automática |
| Produção `APP_BASE_URL` | Fallback localhost no código; garantir config de deploy em produção (já listado em auditorias anteriores) |

---

## 16. Confirmações de aceite

| Critério | Status |
|----------|--------|
| Papel de cada arquivo documentado | Sim |
| `.secret.local` removido **ou** justificado | **Justificado (SIM necessário)** |
| Não sensível separado de secrets | Sim |
| `.env.local` ignorado | Sim |
| `.env.example` completo e sem valores reais | Sim |
| Sem duplicidades ambíguas (precedência documentada) | Sim |
| Produção sem dependência de arquivo local | Sim |
| Functions carregam sem validação global no bootstrap | Sim |
| Onboarding documentado | Sim |
| Testes relacionados | Ver §13 |
| Build completo não executado | Confirmado |
| Deploy não realizado | Confirmado |
| Secrets de produção não alterados | Confirmado |
| Valores de secrets não expostos | Confirmado |
