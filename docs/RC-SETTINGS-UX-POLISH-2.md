# RC-SETTINGS-UX-POLISH-2 — Ampliar largura útil e limitar scroll ao conteúdo

## Resumo executivo

Ajuste exclusivo de layout da página **Configurações**: remove o limite rígido `max-w-[880px]`, fixa título/descrição/tabs no header da página e concentra o scroll no painel do formulário — no mesmo espírito estrutural da Política de Privacidade (`min-h-0` + `overflow-y-auto`). Lógica, schemas, services e seções permanecem intactos. Build completo e deploy **não** foram executados.

## Limitação anterior de largura

Após RC-SETTINGS-UX-REFINE-1:

- layout geral com `max-w-6xl`
- painel de conteúdo com `max-w-[880px]`
- header da página (`PageHeader`) rolava junto com o formulário no `main` do Layout
- scroll efetivo ocorria no `<main className="overflow-auto">` do app

## Nova largura útil

| Elemento | Antes | Depois |
|----------|-------|--------|
| Página / layout Settings | `max-w-6xl` | `w-full` / `flex-1` (sem teto 880/6xl) |
| Painel de conteúdo | `max-w-[880px]` | largura disponível do `main` |
| Cards | limitados indiretamente | acompanham o painel (`w-full`) |
| Inputs simples | `max-w-xl` | **mantido** |
| Textarea / bio | `max-w-2xl` | **mantido** |
| Grupos de campos | `max-w-3xl` | **mantido** (conforto de leitura) |

## Cadeia de altura

Padrão alinhado a `LegalPageLayout` (sem copiar estilos jurídicos):

1. **Layout app** — `h-dvh max-h-dvh overflow-hidden`
2. Coluna principal — `min-h-0 flex-1 flex-col overflow-hidden`
3. **`<main>`** — `min-h-0 flex-1 flex-col overflow-y-auto` (páginas comuns continuam rolando aqui)
4. **Settings** — `flex-1 min-h-0 flex-col overflow-hidden` (não expande o `main`)
5. Header Settings — `shrink-0`
6. `SettingsLayout` — `flex-1 min-h-0`
7. Painel `[data-testid="settings-content"]` — `min-h-0 flex-1 overflow-y-auto`

Sem `min-h-0` na cadeia, o flex cresce e o scroll volta para o body/`main`.

## Header fixo

Bloco `[data-testid="settings-page-header"]`:

- título e descrição (`PageHeader` com margem reduzida via `className`)
- tabs mobile (`SettingsNav variant="mobile"`)

Permanece fora da área com `overflow-y-auto`. Não usa `position: fixed` na viewport; não sobrepõe o `AppHeader`.

## Scroll interno

- Desktop: sidebar (`240px`, `shrink-0`) estável; formulário rola no painel central
- Mobile: título + tabs estáveis; só o conteúdo abaixo rola
- `overscroll-contain` no painel para reduzir encadeamento de scroll
- Textareas continuam com scroll próprio quando necessário

## Sidebar desktop

- `hidden lg:block`, `w-[240px] shrink-0`
- Fora do painel rolável (irmão no flex)
- Sem `sticky` (desnecessário com scroll só no conteúdo)

## Tabs mobile

- Permanecem no header da página (`lg:hidden` no wrapper)
- Tabs horizontais roláveis; sem scroll horizontal da página

## Troca de seção

- Painéis continuam montados (`hidden`) — rascunhos preservados
- Ao trocar seção: `contentRef.scrollTo({ top: 0 })` — volta ao topo do painel

## Prevenção de scroll duplo

- Settings com `overflow-hidden` + altura contida → `main` não precisa rolar nessa rota
- Um único scroll vertical para o formulário (`settings-content`)
- Layout app passou a `h-dvh` para evitar scroll no `body`

## Arquivos alterados

- `src/components/Layout.js` — cadeia `h-dvh` / `min-h-0`
- `src/pages/Settings.js` — header fixo, scroll no conteúdo, scroll-to-top
- `src/components/settings/SettingsLayout.jsx` — remove 880px; painel `overflow-y-auto`
- `src/components/settings/SettingsNav.jsx` — `variant` mobile/desktop
- `src/components/common/PageHeader.jsx` — `className` opcional
- `src/pages/Settings.test.jsx` — cobertura do polish
- `docs/RC-SETTINGS-UX-POLISH-2.md` — este documento

**Não alterados:** services, schemas, Rules, Cloud Functions, validações, query `?section=`, upload, conteúdo dos campos.

## Testes executados

```text
npx craco test --watchAll=false --testPathPattern="Settings.test" --forceExit
```

Inclui (além da REFINE-1):

- Header fora da área rolável
- Conteúdo com `overflow-y-auto` e `min-h-0`
- Página sem limite 880 / 6xl
- Inputs com `max-w-xl`
- Sidebar fora do painel rolável
- Tabs mobile no header
- Scroll ao topo na troca de seção
- Preservação de rascunhos

## Validação manual (checklist)

### Desktop (1280 / 1440 / ultrawide)

- [ ] Largura útil maior; cards acompanham o painel
- [ ] Título e sidebar estáveis ao rolar
- [ ] Apenas o formulário rola; sem scroll duplo

### Notebook (altura reduzida)

- [ ] Campos e botão salvar acessíveis via scroll do painel

### Mobile (320 / 375 / 390 / 430)

- [ ] Título + tabs fixos; conteúdo rola
- [ ] Teclado / salvar sem overflow horizontal

## Riscos residuais

- Mudança de Layout para `h-dvh` afeta todas as rotas autenticadas: páginas longas passam a rolar no `main` (comportamento esperado). Se alguma página assumia `min-h-screen` no body, validar visualmente Dashboard/Projetos.
- Em viewports muito baixos, header + tabs mobile consomem altura vertical — conteúdo ainda rola.
- Upload de logo permanece stub (pré-existente).

## Build e deploy

- **Build completo:** não executado (orientação da sprint)
- **Deploy:** não realizado
