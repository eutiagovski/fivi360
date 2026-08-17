# RC-LEGAL-DOCS-GOLIVE-1 — Refatoração do módulo legal e documentos 1.1

**Data:** 17 de agosto de 2026  
**Escopo:** separar conteúdo legal da apresentação React; atualizar Termos e Política para o primeiro go-live  
**Restrição:** sem Cookie Banner, sem CMP, sem GA4, sem checkout, sem exclusão automática de conta, sem CMS, sem build completo, sem deploy  

---

## 1. Arquitetura antiga

`PrivacyPolicy.jsx` e `TermsOfUse.jsx` concentravam, no mesmo arquivo:

- texto jurídico;
- índice;
- data;
- e-mail de contato;
- marcação JSX;
- apresentação via `LegalPageLayout` / `LegalSection`.

A identidade jurídica (CNPJ, razão social) não existia. A versão de aceite (`LEGAL_VERSIONS` = `1.0`) vivia só em `src/config/legal.js` e não aparecia nas páginas. Qualquer correção de cláusula exigia editar JSX de página.

O sistema de consentimento (`LegalConsentGate`, `LegalConsentCheckbox`, `isLegalConsentCurrent`) **não foi redesenhado**.

---

## 2. Arquitetura nova

```text
src/legal/
  legalEntity.js              identidade jurídica centralizada
  legalDocument.js            helpers de blocos + flatten/TOC
  privacyPolicyContent.js     Política 1.1 (dados, sem JSX)
  termsOfUseContent.js        Termos 1.1 (dados, sem JSX)

src/components/legal/
  LegalPageLayout.jsx         layout existente + versão discreta
  LegalSection                permanece no layout
  LegalDocumentRenderer.jsx   monta layout, índice e blocos

src/pages/
  PrivacyPolicy.jsx           wrapper fino
  TermsOfUse.jsx              wrapper fino

src/config/legal.js           LEGAL_VERSIONS 1.1 (aceite)
```

Os documentos continuam versionados no Git, revisáveis em PR e empacotados com o frontend. Não há Firestore, CMS, Markdown runtime nem fetch remoto.

---

## 3. Conteúdo separado do React

O conteúdo é um objeto JS com `title`, `version`, `lastUpdated` e `sections[]`.

Cada seção tem `id`, `title`, `label` (índice) e `blocks`.

Blocos suportados:

- `paragraph`
- `list` (não ordenada; ordenada disponível)
- `note`
- inlines: texto, `emphasis`, `link`, `email`

Não há JSX no objeto de conteúdo. Não há `dangerouslySetInnerHTML`. Não há parser Markdown.

As pages ficaram:

```jsx
export function PrivacyPolicy() {
  return <LegalDocumentRenderer document={PRIVACY_POLICY_CONTENT} />;
}
```

---

## 4. `LEGAL_ENTITY`

`src/legal/legalEntity.js`:

```js
{
  productName: "FIVI360",
  legalName: "49.712.355 INOVA SIMPLES (I.S.)",
  cnpj: "49.712.355/0001-00",
  contactEmail: "contato@fivi360.com.br",
}
```

Política e Termos interpolam esses campos. O renderer usa `LEGAL_ENTITY.contactEmail` nos nós `{ type: "email" }`.

Não foram adicionados endereço físico, DPO, CPF ou outros dados não fornecidos.

---

## 5. Renderer

`LegalDocumentRenderer`:

- recebe o documento estruturado;
- gera o índice com `getLegalTocSections`;
- monta `LegalPageLayout`;
- renderiza `LegalSection`, parágrafos, listas, ênfase, links internos (`Link`) e `mailto`.

A tipografia atual do layout foi preservada. `LegalSection` permanece em `LegalPageLayout.jsx`.

`LegalPageLayout` passou a exibir discretamente `Versão 1.1` ao lado da data.

---

## 6. Política 1.1

Estrutura (17 seções):

1. Introdução e âmbito  
2. Quem é o responsável  
3. Dados que coletamos  
4. Como utilizamos os dados  
5. Conteúdo enviado pelo usuário  
6. Conteúdo público, links, portfólio e Embed  
7. Pré-lançamento e campanhas  
8. Comunicações e marketing  
9. Cookies e tecnologias semelhantes  
10. Prestadores de serviço e infraestrutura  
11. Retenção e exclusão  
12. Segurança  
13. Direitos do titular  
14. Exclusão de conta e conteúdo  
15. Pessoas menores de 18 anos  
16. Alterações desta Política  
17. Contato  

Âmbito explícito: site, app autenticado, landing pages, share, portfólio, Embed e demais recursos públicos.

---

## 7. Termos 1.1

Estrutura (17 seções):

1. Aceitação  
2. Sobre o FIVI360  
3. Cadastro e conta  
4. Planos, recursos e limites  
5. Cobrança, quando disponibilizada  
6. Conteúdo do usuário  
7. Publicação, compartilhamento, portfólio e Embed  
8. Processamento técnico de imagens  
9. Uso aceitável  
10. Propriedade intelectual  
11. Disponibilidade  
12. Suspensão e encerramento  
13. Exclusão de conta  
14. Limitação de responsabilidade  
15. Política de Privacidade  
16. Alterações dos Termos  
17. Contato  

Aceite alinhado ao `LegalConsentGate`: mudança material pode exigir novo aceite explícito; uso continuado não o substitui quando o app o solicita.

---

## 8. Decisões incorporadas

| Decisão | Como entrou nos documentos |
|---------|----------------------------|
| Controlador = 49.712.355 INOVA SIMPLES (I.S.), CNPJ 49.712.355/0001-00 | Política §2 e §17; Termos §2 e §17 |
| Contato = contato@fivi360.com.br | `LEGAL_ENTITY` |
| 18 anos ou mais | Política §15; Termos §3 |
| Sem age gate / sem data de nascimento | Sem mecanismo novo; sem coleta de documento de idade |
| Analytics desativado no go-live | Política não afirma GA4 ativo; cláusula futura neutra |
| Sem Cookie Banner / CMP | Sem implementação; linguagem de cookies e tecnologias semelhantes |
| Sem cookies próprios de publicidade | Política §9 |
| Checkout pago indisponível | Cláusula condicional (“quando planos pagos e cobrança forem disponibilizados”) |
| YouTube inativo (`videoUrl` vazio) | Não mencionado como fornecedor |
| Exclusão de conta por e-mail | Política §14; Termos §13 |
| Marketing opcional; revogação por e-mail enquanto não houver UI | Política §8 |
| Sem backups técnicos prometidos | Afirmação removida |
| Arquivos originais: usuário deve manter cópia | Termos §8 |
| `plan.source = "manual"` | Não mencionado |
| Licença técnica (sem “distribuir” amplo) | Termos §6 |
| Planos sem preços/limites hardcoded | Termos §4 remete à página vigente |
| LP “Estudante…” | Apenas o label; `id` e schema inalterados |

---

## 9. Versionamento

```js
LEGAL_VERSIONS = {
  termsVersion: "1.1",
  privacyVersion: "1.1",
}
```

Data exibida nos dois documentos: **17 de agosto de 2026**.

A versão do conteúdo vem de `LEGAL_VERSIONS`, para não divergir do aceite. A data vive no conteúdo estruturado, não nas pages.

---

## 10. Reaceite

A lógica de `isLegalConsentCurrent` / `LegalConsentGate` **não foi alterada**.

Efeito do bump:

- `legalConsent` 1.0 → desatualizado → modal obrigatório;
- `legalConsent` 1.1 → atual → app libera;
- após aceitar 1.1 → versões persistidas por `saveLegalConsent` / `buildLegalConsent` e o gate libera.

---

## 11. Alteração da LP

Em `ACCESS_EARLY_PROFESSIONS`, a opção `estudante` passou de `Estudante` para:

**Estudante de Arquitetura, Design ou curso superior relacionado**

O valor enviado em `profession` continua sendo o label. Schema, backend e tipo do campo não mudaram.

---

## 12. Arquivos alterados

### Criados

- `src/legal/legalEntity.js`
- `src/legal/legalDocument.js`
- `src/legal/privacyPolicyContent.js`
- `src/legal/termsOfUseContent.js`
- `src/legal/legalContent.test.js`
- `src/legal/legalDocument.test.js`
- `src/components/legal/LegalDocumentRenderer.jsx`
- `src/components/legal/LegalDocumentRenderer.test.jsx`
- `src/components/legal/LegalPageLayout.version.test.jsx`
- `src/pages/PrivacyPolicy.test.jsx`
- `src/pages/TermsOfUse.test.jsx`
- `src/pages/legalRoutes.test.js`
- `src/utils/legalConsent.test.js`
- `docs/RC-LEGAL-DOCS-GOLIVE-1.md`

### Modificados

- `src/config/legal.js`
- `src/pages/PrivacyPolicy.jsx`
- `src/pages/TermsOfUse.jsx`
- `src/components/legal/LegalPageLayout.jsx`
- `src/components/legal/LegalConsentGate.test.jsx`
- `src/utils/legalConsentGateState.test.js`
- `src/landing-pages/access-early/config.js`
- `src/landing-pages/access-early/components/AccessEarlyForm.test.jsx`
- `src/landing-pages/access-early/utils/validateAccessEarlyForm.test.js`

---

## 13. Testes

Suites relacionadas executadas (sem build completo):

**18 suites / 110 testes — PASS**

Cobertura desta RC:

- pages usam o renderer compartilhado e não hardcoded o texto jurídico;
- renderer monta índice, parágrafos, listas, links e e-mail institucional de `LEGAL_ENTITY`;
- Política 1.1 contém controlador, CNPJ, contato, pré-lançamento, WhatsApp, UTMs/origem, Embed, Resend, Firebase, Google Sign-In, 18 anos, exclusão por e-mail e marketing opcional;
- Termos 1.1 contém maioridade, titularidade do conteúdo, processamento/conversão/compressão, Share, Portfólio, Embed, planos vigentes, cobrança condicional, exclusão por e-mail e vínculo com a Política;
- ausências: backups técnicos de curto prazo, exclusão pelas Configurações, “não há cobrança online integrada”, GA4, YouTube, plano manual;
- consentimento 1.0 desatualizado; 1.1 atual; aceite 1.1 libera o app;
- LP exibe e envia o novo label de estudante como `profession`;
- rotas `/termos` e `/privacidade` permanecem públicas.

---

## 14. Validação manual

Checklist (não executada automaticamente nesta RC):

- [ ] Abrir `/privacidade`: índice, scroll, versão 1.1, data, links, mobile, CNPJ, responsável, conteúdo atualizado
- [ ] Abrir `/termos`: índice, scroll, versão 1.1, data, links, mobile, maioridade, cláusulas novas
- [ ] Usuário com `legalConsent` 1.0: modal obrigatório → aceitar → 1.1 persistido → reload sem modal

---

## 15. Pendências futuras

Fora desta RC, e ainda relevantes após o go-live:

- Cookie Banner / CMP se Analytics ou YouTube forem ativados
- Consentimento GA4 se `REACT_APP_FIREBASE_MEASUREMENT_ID` entrar no bundle
- Self-host de fontes (hoje Google Fonts externo)
- YouTube na LP quando `videoUrl` for preenchido
- Checkout Stripe quando `PAID_CHECKOUT_ENABLED=true`
- Exclusão de conta no app
- UI de revogação de marketing
- Histórico de consentimentos
- Política de retenção automática / TTL de `prelaunchLeads`
- Endereço físico ou DPO, se vierem a ser exigidos
- Age gate técnico (explicitamente não criado aqui)

---

## 16. Build não executado

Build completo **não** foi executado, conforme o escopo da RC.

---

## 17. Ausência de deploy

Nenhum deploy (Hosting, Functions ou regras) foi realizado.
