# RC-SETTINGS-UX-REFINE-1 — Refinar layout e hierarquia da página de Configurações

## Resumo executivo

Reorganização exclusiva da UX da página **Configurações** (`/settings`): navegação interna por seções, formulários com largura limitada, cards semânticos e hierarquia mais clara — sem alterar schemas, services, regras de plano, Cloud Functions, Firestore Rules ou lógica de salvamento. Nenhum build completo nem deploy foi executado.

## Problemas anteriores

- Formulário ocupava quase toda a largura disponível
- Campos excessivamente longos
- Pouca separação entre perfil, escritório e portfólio
- Hierarquia visual fraca (blocos similares empilhados)
- Sensação de página vazia / pouco refinada
- Desktop não aproveitava bem o espaço
- Sem navegação interna por área

## Nova estrutura

| Área | Conteúdo |
|------|----------|
| Header | Título `Configurações` + descrição da página |
| Desktop | Sidebar interna (~240 px) + conteúdo (`max-w-[880px]`) |
| Mobile | Tabs horizontais roláveis (uma seção por vez) |
| Página | Centralizada (`max-w-6xl`) |

```text
┌──────────────────────┬──────────────────────────────────────┐
│ Navegação interna    │ Conteúdo da seção                    │
│ Perfil               │ Título + descrição                   │
│ Escritório           │ Cards + formulário (max-width)       │
│ Portfólio público    │ Ações de salvar                      │
└──────────────────────┴──────────────────────────────────────┘
```

## Navegação interna

- Estado local `activeSection` (troca imediata, sem desmontar painéis)
- Query opcional: `/settings?section=office` | `portfolio` (perfil = default sem query)
- Seções ocultas com `hidden` / `aria-hidden` — **permanecem montadas** (preserva rascunhos locais)
- Desktop: lista vertical com `aria-current="page"`
- Mobile: `role="tablist"` / `role="tab"` com `aria-selected`
- Foco visível via `focus-visible:ring`

## Seções

### Perfil

- Nome completo
- E-mail (somente leitura)

### Escritório

Card **Identidade do escritório**:

- Logo (preview 96×96 + botão Alterar / Fazer upload — pipeline inalterado)
- Nome do escritório | Website (grid 2 colunas no desktop)
- Descrição (`bio`)

### Portfólio público

Card **Presença pública**:

- Status (Ativo / Inativo — texto + indicador, não só cor)
- Endereço público + Copiar link
- Slug + disponibilidade
- Switch `portfolioEnabled` + `UpgradePrompt` / modal premium (entitlement intacto)

Card **Redes sociais**:

- Instagram, YouTube, LinkedIn, WhatsApp (grid 1–2 colunas)

### Preferências / Conta

**Não criadas nesta sprint.** Não havia UI existente de `marketingPreferences`, exclusão de conta, segurança ou plano nesta página. Criar só para preencher espaço violaria o escopo (“não criar funcionalidades novas”). Marketing continua em signup / LegalConsentGate.

## Largura dos formulários

| Elemento | Limite |
|----------|--------|
| Conteúdo da seção | `max-w-[880px]` |
| Campos simples | `max-w-xl` (~576 px) |
| Textarea | `max-w-2xl` |
| Blocos de card | `max-w-3xl` |
| Layout geral | `max-w-6xl` |

Evita `w-full` sem container com `max-width`.

## Cards

- `SettingsCard` apenas para grupos semânticos
- Sem card por campo; identidade escura preservada (`bg-zinc-900/50`, `border-zinc-800`)

## Upload de logo

- Preview claro (imagem se `companyLogo` existir; ícone caso contrário)
- Botão compacto: “Fazer upload” / “Alterar logo”
- **Pipeline de upload não alterado** (botão permanece stub como antes)
- Sem botão Remover (não existia handler)

## Portfólio público

- Status, link, slug, switch e entitlement preservados
- `portfolioAvailable` continua server-side (callable / rules) — UI não promove
- Slug: debounce + `checkSlugAvailability` inalterados
- Copiar link: toast “Link copiado”

## Preferências de marketing

- Schema e services **não alterados**
- Sem editor novo em Settings (sem UI prévia)
- Independência de e-mails transacionais permanece nos fluxos existentes

## Salvamento

- Submit manual único (`saveUserSettings`) — estratégia anterior
- Footer `SettingsSaveActions`: alinhado à direita no desktop; largura total no mobile
- Feedback via toast de sucesso/erro (como antes)
- Sem loading global que desmonte a página
- Erros localizados (toast); formulário preservado

## Responsividade

| Viewport | Comportamento |
|----------|----------------|
| ≥1024 px (`lg`) | Sidebar + conteúdo |
| Tablet / mobile | Tabs horizontais roláveis |
| Campos | Uma coluna; grid 2 cols só em `md+` quando cabe |

## Acessibilidade

- Navegação por teclado (botões / tabs)
- Estado ativo perceptível (fundo + `aria-*`)
- Labels associados aos inputs
- `sr-only` no hint de status do portfólio
- Copy link com feedback (toast)
- Contrastes alinhados ao tema escuro atual

## Componentes

| Arquivo | Papel |
|---------|--------|
| `SettingsLayout.jsx` | Duas áreas (nav + conteúdo) |
| `SettingsNav.jsx` | Sidebar / tabs |
| `SettingsSection.jsx` | Título + descrição + painel |
| `SettingsCard.jsx` | Agrupamento semântico |
| `SettingsSaveActions.jsx` | Botão salvar |
| `settingsSections.js` | Catálogo e `resolveSettingsSection` |
| `SocialPrefixedInput.jsx` | Reutilizado |

Sem novas bibliotecas; sem Pannellum/gráficos/animações pesadas.

## Arquivos alterados

- `src/pages/Settings.js` — layout + seções (lógica de load/save preservada)
- `src/components/settings/SettingsLayout.jsx` — novo
- `src/components/settings/SettingsNav.jsx` — novo
- `src/components/settings/SettingsSection.jsx` — novo
- `src/components/settings/SettingsCard.jsx` — novo
- `src/components/settings/SettingsSaveActions.jsx` — novo
- `src/components/settings/settingsSections.js` — novo
- `src/pages/Settings.test.jsx` — novo
- `docs/RC-SETTINGS-UX-REFINE-1.md` — este documento

**Não alterados:** `userService`, `marketingPreferences`, mappers, Cloud Functions, Firestore Rules, schemas `users` / `publicProfiles`, billing, plan limits.

## Testes executados

```text
npx craco test --watchAll=false --testPathPattern="Settings.test|marketingPreferences.test|portfolio.test" --forceExit
```

Resultado: **4 suites / 46 testes passed** (inclui `Settings.test.jsx`, `marketingPreferences.test.js`, `portfolio.test.js`, `embedSettings.test.js` via padrão).

Cobertura em `Settings.test.jsx`:

- Navegação interna renderiza
- Seções Perfil / Escritório / Portfólio abrem
- Troca de seção preserva painéis montados e valor local
- Max-width do conteúdo
- `saveUserSettings` chamado corretamente
- Erro localizado + formulário preservado
- Loading não deixa a página montada de forma inconsistente
- Logo preview + botão
- Slug unavailable desabilita save
- `portfolioEnabled` + bloqueio sem entitlement
- Copiar link
- `aria-selected` / `aria-current`
- Mobile tablist
- Ausência de Preferências/Conta/danger zone inventadas

## Validação manual (checklist)

### Desktop

- [ ] Abrir Configurações
- [ ] Navegar entre Perfil / Escritório / Portfólio
- [ ] Editar e salvar; confirmar ausência de flash/desmonte
- [ ] Campos com largura adequada (não full-bleed)

### Mobile (320 / 375 / 430)

- [ ] Tabs horizontais
- [ ] Editar + teclado + salvar
- [ ] Copiar link

### Portfólio

- [ ] Ativar/desativar conforme plano
- [ ] Editar slug; entitlement intacto

### Erro

- [ ] Falha de salvamento → toast; formulário preservado

## Riscos residuais

- Upload de logo continua stub (comportamento pré-existente)
- Preferências de marketing não editáveis em Settings (intencional nesta sprint)
- Query `?section=` sincroniza via efeito; deep-link funciona, mas histórico usa `replace`
- Toast ainda usado no save (estratégia atual; sem autosave)

## Build e deploy

- **Build completo:** não executado (orientação da sprint)
- **Deploy:** não realizado
