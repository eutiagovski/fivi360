# RC-LP-PRELAUNCH-FORM-1 — Formulário de acesso antecipado e pós-cadastro

## Objetivo

Entregar o componente de conversão da LP `/lp/acesso-antecipado`: formulário real, estados de sucesso/duplicidade, CTA opcional de WhatsApp e integração com `submitPrelaunchLead`, sem o layout editorial completo da Sprint 4.

**Build completo:** não executado.  
**Deploy:** não realizado.

---

## 1. Componentes criados

| Arquivo | Papel |
|---|---|
| `components/AccessEarlyForm.jsx` | Formulário apresentacional |
| `components/AccessEarlySuccess.jsx` | Sucesso / duplicidade + CTA WhatsApp |
| `hooks/useAccessEarlyForm.js` | Estado `idle \| submitting \| success \| duplicate \| error` |
| `utils/validateAccessEarlyForm.js` | Validação UX |
| `utils/formatBrazilPhoneMask.js` | Máscara visual BR |

`AccessEarlyLandingPage.jsx` integra shell temporário + formulário (design final na Sprint 4).

---

## 2. Campos

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Nome | text | sim | `autocomplete="name"` |
| E-mail | email | sim | sem normalização destrutiva no UI |
| WhatsApp | tel | sim | máscara `(21) 99999-9999`; `inputMode="tel"` |
| Profissão | Select | sim | ver §3 |
| Marketing | checkbox | não | default `false` |

---

## 3. Profissões

```text
Arquiteto(a)
Designer de interiores
Escritório de arquitetura
Renderista / Artista 3D
Estudante
Outro → campo "Qual a sua profissão?"
```

Valor enviado em `profession`:

- opção fixa → label;
- Outro → texto complementar.

Schema backend inalterado (`profession: string`).

---

## 4. Validação frontend

Bloqueia submit com erros por campo:

- nome vazio;
- e-mail vazio / inválido;
- WhatsApp vazio / não plausível (10–11 dígitos);
- profissão não selecionada;
- Outro sem texto.

Backend permanece fonte de verdade.

---

## 5. Integração com service

`useAccessEarlyForm` → `submitPrelaunchLead({ name, email, phone, profession, marketingConsent, attribution })`.

- `campaignId` via service/`ACCESS_EARLY_CAMPAIGN`;
- proteção double-submit (`submittingRef` + botão disabled);
- loading: **Enviando...**

Não cria Auth / `users/{uid}` / sessão / projeto.

---

## 6. Attribution

No submit: `getPrelaunchAttribution()` (helper existente).

Não reconstrói UTMs no componente.  
Não usa `utm_campaign` como `campaignId`.

---

## 7. Consentimento

Copy:

> Quero receber novidades, conteúdos e promoções do FIVI360 por e-mail.

- unchecked por padrão;
- `marketingConsent: false` não impede cadastro;
- independente de `users/{uid}` e de visitante autenticado.

Pré-cadastro ≠ opt-in de marketing promocional geral.

---

## 8. Estados do formulário

```text
idle → submitting → success | duplicate | error
```

`error` preserva campos e permite retry.

---

## 9. Novo cadastro

`alreadyRegistered === false` → substitui formulário por sucesso:

- “Você está na lista! 🎉”
- aviso de notificação do acesso antecipado
- menção genérica a “condição especial” (sem %, meses, preço ou cupom)

---

## 10. Duplicidade

`alreadyRegistered === true` → estado positivo (não erro):

- “Você já está na lista! 🎉”
- sem revelar PII / origem / consentimento anteriores
- também oferece CTA WhatsApp se configurado

---

## 11. Tratamento de erro

Mensagem amigável + **Tentar novamente**.  
Sem FirebaseError/HttpsError/stack na UI.  
Log sanitizado só em development.

---

## 12. WhatsApp pós-cadastro

Somente após success/duplicate.

`handleWhatsAppGroupClick()` encapsula o clique (tracking futuro `prelaunch_whatsapp_group_click`).  
Não grava em `prelaunchLeads`.

CTA: `target="_blank"` + `rel="noopener noreferrer"`.

---

## 13. Configuração `whatsappGroupUrl`

```js
ACCESS_EARLY_CONFIG = {
  videoUrl: "",
  whatsappGroupUrl: "",
  campaignId: ACCESS_EARLY_CAMPAIGN.id,
}
```

Vazio → bloco/CTA não renderizam. Sem URL fictícia.

---

## 14. Privacidade

Nota abaixo do formulário com link para `/privacidade`.  
Não substitui o checkbox de marketing.  
Não cria documento jurídico novo.

---

## 15. Mobile / acessibilidade

- inputs full-width sem overflow;
- `type=email` / `inputMode=tel`;
- labels associados; `aria-invalid` / `aria-describedby` em erros;
- checkbox com label;
- sucesso com `role="status"` + `aria-live="polite"`;
- botão disabled durante submit.

---

## 16. Testes

### Frontend (CRA)

```bash
npm test -- --watchAll=false --testPathPattern="access-early|getPrelaunchAttribution|normalizeLeadEmail|PublicAlwaysRoute|routeArchitecture.lpRouting"
```

**9 suites / 47 passed** — campos, validação, marketing, attribution, double-submit, success/duplicate, erro/retry, WhatsApp CTA, privacidade, sem Auth.

### Backend (regressão)

```bash
npx jest --config tests/functions/jest.config.js --runInBand submitPrelaunchLead
```

**26 passed** — sem alteração de backend nesta sprint.

---

## 17. Validação manual (Emulator — checklist)

URL:

`/lp/acesso-antecipado?utm_source=instagram&utm_medium=stories&utm_campaign=prelaunch_2026&utm_content=editorial_01`

1. Novo e-mail → success + doc com attribution/`campaignId`/phoneNormalized  
2. Mesmo e-mail → duplicate; um doc; origem original preservada  
3. Marketing desmarcado → cadastro ok  
4. Erro Function → campos permanecem; retry  
5. Usuário autenticado → formulário funciona igual  

---

## 18. Pendências para Sprint 4

- Hero / benefícios / editorial / screenshots  
- Vídeo YouTube (`videoUrl`)  
- Layout visual definitivo  
- SEO  
- Analytics completo + evento WhatsApp  
- URL real do grupo WhatsApp  
- Cupom / e-mail automático  
- Rate limiting avançado (P1 da DATA-1)  

---

## 19–20. Confirmações

| Item | Status |
|---|---|
| Formulário real | Feito |
| Success / duplicate / erro | Feito |
| CTA WhatsApp preparado (oculto se vazio) | Feito |
| Sem Auth/user no submit | Feito |
| Backend inalterado | Confirmado |
| Build completo | **Não executado** |
| Deploy | **Não realizado** |
