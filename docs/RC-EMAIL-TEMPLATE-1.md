# RC-EMAIL-TEMPLATE-1 — Design System dos e-mails transacionais

Sprint de **template / copy / apresentação**. Sem alteração de regras de negócio, Stripe, Resend, webhooks, billing ou destinos.

**Build completo:** não executado.  
**Deploy:** não realizado.

---

## 1. Templates encontrados

| E-mail | Trigger | Template | CTA | Status |
|---|---|---|---|---|
| `payment_success` | Stripe `invoice.paid` → `emailQueue` | `email/templates/paymentSuccess.js` | Gerenciar assinatura → `${APP_BASE_URL}/plan` | Migrado |
| `payment_failed` | Stripe `invoice.payment_failed` | `email/templates/paymentFailed.js` | Atualizar forma de pagamento → `/plan` | Migrado |
| `subscription_canceled` | Stripe `customer.subscription.deleted` | `email/templates/subscriptionCanceled.js` | Reativar assinatura → `/plan` | Migrado |
| `subscription_cancellation_scheduled` | Callable `cancelStripeSubscription` | `email/templates/subscriptionCancellationScheduled.js` | Gerenciar assinatura → `/plan` | Migrado |
| `welcome` | Pós-verificação / Google (client ou Admin) | `emailTemplates/welcomeEmail.js` | Acessar meu painel → `https://fivi360.com.br/dashboard` | Migrado |
| `verify_email` | Signup / resend | `emailTemplates/verifyEmail.js` | Confirmar e-mail → link Auth | Migrado |
| `password_reset` | Callable `requestPasswordResetEmail` | `emailTemplates/passwordResetEmail.js` | Redefinir senha → link Auth | Migrado |
| `billing_upgrade_requested` | Helper existe; **sem trigger ativo na app** | `emailTemplates/upgradeRequestedEmail.js` | Ver planos → `https://fivi360.com.br/plan` | Migrado |

Pipeline: `emailQueue` → `processEmailQueue` → `resolveEmailTemplate` → Resend (`html` + `text`).

---

## 2. Arquitetura anterior

- Layout único em `emailTemplates/shared.js` (`wrapEmailHtml` + `buildPlainText`).
- Aparência genérica: brand textual pequeno à esquerda, título colado, CTA `inline-block` (tendia a alinhar à esquerda), footer mínimo sem links legais.
- Summary de cobrança com coluna cinza estilo tabela administrativa.
- **Sem** `escapeHtml` — interpolação direta de `name`, `companyName`, `planName`.
- Sem preview/fixtures.

---

## 3. Design system criado

Arquivo central: `functions/src/emailTemplates/shared.js`.

| Peça | Helper |
|---|---|
| Layout | `wrapEmailHtml` |
| Brand header | `buildBrandHeader` (interno) |
| Status / heading | `buildStatusHeader` (`success` / `warning` / `neutral`) |
| Summary | `buildSummaryCard` |
| CTA | `buildPrimaryButton` |
| Footer | `buildEmailFooter` |
| Text | `buildPlainText` |
| Segurança | `escapeHtml`, `escapeHref` |

Princípio visual: **FIVI360 reconhecível, premium e minimalista** — branco, preto, cinzas, respiro; sem gradientes, glass, banners ou look promocional.

---

## 4. Compatibilidade de e-mail

- Tabelas `role="presentation"` para estrutura.
- Estilos inline; stack `Arial, Helvetica, system-ui, …`.
- Largura `max-width: 560px`; fundo externo `#f0f0f0`; card branco.
- Sem flex/grid crítico, sem CSS variables, sem JS, sem fontes externas obrigatórias.
- Bloco condicional mínimo MSO para font-family no Outlook.
- `color-scheme: light` (sem dark mode dual elaborado).

---

## 5. Brand header

- Wordmark textual **FIVI360** centralizado, letter-spacing ampliado, peso maior.
- **Sem `<img>`**: o logo oficial (`src/assets/img/fivi360_logo.png`) só existe como asset webpack com hash — **não há URL HTTPS pública estável**. Evita imagem quebrada.
- Fallback textual elegante documentado como decisão consciente.

---

## 6. Status header

Variantes monocromáticas:

| Variant | Marca | Uso |
|---|---|---|
| `success` | ✓ (`&#10003;`) | pagamento confirmado, welcome |
| `warning` | `!` | falha de cobrança |
| `neutral` | — (`&#8212;`) | cancelamentos, verify, reset, upgrade |

Sem emojis estruturais; sem biblioteca de ícones.

---

## 7. Summary card

`buildSummaryCard(heading, rows)` — borda sutil, fundo `#fafafa`, labels discretos à esquerda, valores com peso à direita. Sem coluna cinza administrativa.

---

## 8. PrimaryButton

- Preto `#1a1a1a`, texto branco, `border-radius: 8px`.
- Tabela `width: 100%` + link `display: block; width: 100%; text-align: center` para CTA **full-width** (desktop e mobile), evitando desalinhamento à esquerda.
- `escapeHref` rejeita schemes não `http(s)`.

---

## 9. Footer

Compartilhado em todos os templates:

- FIVI360  
- Tagline institucional  
- fivi360.com.br  
- Política de Privacidade · Termos de Uso (`https://fivi360.com.br/privacidade`, `/termos`)  
- © {ano} FIVI360  

Discreto; não é footer de newsletter.

---

## 10. Copy

### Tagline (decisão)

**Não** usar “Apresente. Explore. Compartilhe.” — não é tagline oficial.

**Usar** a linha do footer da LP de acesso antecipado:

> Apresentações 360° para arquitetura e interiores.

### Pagamento confirmado

- Subject preservado: `Pagamento confirmado — FIVI360 {Plano}`
- Saudação: `Olá, {nome}.`
- Corpo alinhado ao brief (assinatura ativa + experiências 360°).
- Antes do CTA: “Você pode consultar suas cobranças e gerenciar sua assinatura a qualquer momento.”
- Removida a instrução “Configurações → Assinatura” (CTA já leva a `/plan`).

---

## 11. Templates migrados

Todos os 8 tipos acima passam por `wrapEmailHtml` com status/footer/CTA compartilhados. Dados financeiros, subjects (salvo copy de corpo), triggers e URLs de CTA preservados.

`getAppBaseUrl()` em `config/app.js` resolve a base na hora do render (CTAs de billing).

---

## 12. Escaping

- `escapeHtml` em nome, plano, companyName, títulos, preheader, valores do summary, labels de botão.
- `escapeHref` em CTAs.
- Risco anterior de HTML injection via campos de usuário **corrigido**.

---

## 13. text/plain

Preservado em todos os templates (`text` enviado ao Resend). Footer textual inclui tagline + privacy + terms. Copy atualizada para equivalência semântica com o HTML.

---

## 14. Preview local

Não existia preview. Criado mecanismo simples:

```bash
node functions/scripts/preview-emails.js
```

Gera `functions/email-previews/*.html` (+ `.txt` + `index.html`) com fixtures fictícios. Pasta no `.gitignore`. **Não envia e-mail real.**

Validação manual sugerida: abrir `payment-success.html` no browser (largura desktop + DevTools mobile).

Fixture de referência:

- Nome: Tiago Machado  
- Plano: Studio  
- Valor: R$ 199,00  
- Data: 4 de agosto de 2026 (com horário, America/Sao_Paulo)

---

## 15. Testes

Arquivo: `tests/functions/emailTemplates.test.js`.

Cobertura de contrato: render payment success; nome/plano/valor/data; CTA + URL; brand/footer/privacy/terms; sem localhost com `APP_BASE_URL` de produção; sem `undefined` / `[object Object]`; escaping; demais templates no layout compartilhado; text/plain.

Rodar (sem build completo):

```bash
npx jest --config tests/functions/jest.config.js --runInBand tests/functions/emailTemplates.test.js
```

---

## 16. Validação manual

1. `node functions/scripts/preview-emails.js`
2. Abrir `functions/email-previews/index.html`
3. Conferir payment-success: brand, hierarquia, summary, CTA full-width, footer/links
4. Conferir mobile (~375px) sem scroll horizontal
5. Opcional: Litmus/Gmail se houver fluxo de teste — fora do escopo obrigatório desta RC

---

## 17. Limitações de clientes de e-mail

- Dark mode automático de clientes pode inverter cores; priorizamos fundos sólidos e contraste alto, sem CSS dual-theme.
- `border-radius` pode ser ignorado no Outlook clássico.
- `width: 100%` em `<a>` tem suporte bom em Gmail/Apple Mail; Outlook usa `bgcolor` na `<td>` como reforço.
- Sem logo imagem até existir asset público estável (ex.: `public/email/fivi360-logo.png` + CDN/hosting).

---

## 18. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `functions/src/emailTemplates/shared.js` | Design system |
| `functions/src/emailTemplates/welcomeEmail.js` | Migração + escape |
| `functions/src/emailTemplates/verifyEmail.js` | Migração + escape |
| `functions/src/emailTemplates/passwordResetEmail.js` | Migração |
| `functions/src/emailTemplates/upgradeRequestedEmail.js` | Migração + escape |
| `functions/src/email/templates/paymentSuccess.js` | Copy + summary + status |
| `functions/src/email/templates/paymentFailed.js` | Summary + status |
| `functions/src/email/templates/subscriptionCanceled.js` | Layout + status |
| `functions/src/email/templates/subscriptionCancellationScheduled.js` | Layout + status |
| `functions/src/config/app.js` | `getAppBaseUrl()` |
| `functions/scripts/preview-emails.js` | Preview local (novo) |
| `functions/.gitignore` | `email-previews/` |
| `tests/functions/emailTemplates.test.js` | Contratos (novo) |
| `docs/RC-EMAIL-TEMPLATE-1.md` | Este documento |

Wrappers finos (`paymentSuccessEmail.js`, etc.) e `processEmailQueue` / Stripe / Resend **não** alterados na lógica de envio.

---

## 19. Build

**Build completo da aplicação não foi executado**, conforme escopo da RC.

---

## 20. Deploy

**Nenhum deploy foi realizado** (Functions, Hosting ou outros).
