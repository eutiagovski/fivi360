# Foundation Step 01

**Sprint:** 0 — Foundation  
**Data:** 31/05/2026  
**Escopo:** Análise estrutural — nenhum código alterado  
**Objetivo:** Mapear padrões visuais repetidos no protótipo para orientar a extração de componentes na reconstrução funcional.

---

## Page Headers

Padrão visual dominante: `h1` com `text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white` + parágrafo `text-base text-zinc-400`.

### Variante A — Header simples (H1 + subtítulo)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Dashboard.js` | 1 | 32–37 |
| `src/pages/Settings.js` | 1 | 27–32 |
| `src/pages/NewProject.js` | 1 | 42–47 |

**Estrutura comum:**

```jsx
<div className="mb-12">
  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white mb-2" data-testid="...">
    {título}
  </h1>
  <p className="text-base text-zinc-400">{subtítulo}</p>
</div>
```

**Diferenças:**

| Arquivo | Título | Subtítulo | Extras |
|---------|--------|-----------|--------|
| Dashboard | Dashboard | Visão geral dos seus projetos | — |
| Settings | Configurações | Gerencie suas informações pessoais e do escritório | — |
| NewProject | Criar novo projeto | Preencha as informações do seu projeto | Link «Voltar para projetos» acima do header (linhas 32–39) |

---

### Variante B — Header com ação lateral (H1 + subtítulo + CTA)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Projects.js` | 1 | 56–71 |

**Diferenças em relação à Variante A:**

- Container usa `flex items-center justify-between mb-12` em vez de `mb-12` simples
- H1 e subtítulo ficam dentro de um `<div>` filho
- Botão «Criar projeto» (`Link` com ícone `Plus`) alinhado à direita
- Mesmas classes tipográficas do H1 e subtítulo

**Duplicação relacionada:** o botão «Criar projeto» também aparece em `Dashboard.js` (linhas 88–95), mas no contexto de um **section header** (H2), não no page header.

---

### Variante C — Header centralizado

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Plan.js` | 1 | 56–61 |

**Diferenças:**

- Container com `text-center mb-12`
- H1 com `mb-4` (em vez de `mb-2`)
- Sem ação lateral

---

### Variante D — Header público (logo)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/PublicProject.js` | 1 | 38–44 |

**Diferenças:**

- Elemento `<header>` com `border-b border-zinc-800 p-6`
- H1 menor: `text-2xl font-light tracking-tighter`
- Conteúdo: logo «FIVI**360**» (sem subtítulo)
- Layout: `max-w-7xl mx-auto flex items-center justify-between`

**Relacionado (não é page header de página autenticada):** logo idêntico em `src/components/Layout.js` (linhas 40–44), dentro da sidebar.

---

### Variante E — Hero de projeto (ProjectDetail)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/ProjectDetail.js` | 1 | 52–89 |

**Diferenças significativas:**

- Não segue o padrão H1 + subtítulo isolado
- Card container: `bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8`
- Layout flex com imagem de capa (`lg:w-1/3`) + metadados
- H1 com classes reduzidas: `text-4xl sm:text-5xl` (sem `lg:text-6xl`)
- Badge de status inline (não overlay na imagem)
- Botão «Compartilhar» no canto superior direito
- Descrição e contador de imagens abaixo

**Relacionado (página pública):** `PublicProject.js` (linhas 49–66) possui hero sem card wrapper — capa full-width (`h-96`), H1 padrão grande, descrição e crédito do escritório.

---

### Variante F — Toolbar do viewer (overlay fixo)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Viewer.js` | 1 | 38–59 |
| `src/pages/PublicImage.js` | 1 | 37–53 |

**Diferenças entre versões:**

| Aspecto | Viewer.js | PublicImage.js |
|---------|-----------|----------------|
| Botão voltar | «Voltar» → `/projects/:id` | «Voltar ao projeto» → `/share/project/:id` |
| Lado direito | Botão «Compartilhar» | Badge «Powered by FIVI360» |
| Estilo botão voltar | Idêntico (`bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl`) | Idêntico |

---

### Section headers (H2) — padrão secundário repetido

| Arquivo | Ocorrências | Linhas | Conteúdo |
|---------|-------------|--------|----------|
| `src/pages/Dashboard.js` | 1 | 84–96 | «Projetos recentes» + botão Criar projeto |
| `src/pages/Plan.js` | 1 | 135–137 | «Seu consumo atual» |
| `src/pages/ProjectDetail.js` | 1 | 93–126 | «Imagens panorâmicas» + toggle grid/lista + botão Adicionar |
| `src/pages/PublicProject.js` | 1 | 70–72 | «Imagens panorâmicas (N)» |

**Classe comum do H2:** `text-2xl sm:text-3xl font-light tracking-tight text-white`

---

### Resumo — Page Headers

| Padrão | Arquivos | Total de blocos |
|--------|----------|-----------------|
| H1 + subtítulo simples | Dashboard, Settings, NewProject | 3 |
| H1 + subtítulo + CTA | Projects | 1 |
| H1 centralizado | Plan | 1 |
| Logo público | PublicProject (+ Layout sidebar) | 2 |
| Hero de projeto | ProjectDetail, PublicProject | 2 |
| Toolbar viewer | Viewer, PublicImage | 2 |
| Section H2 | Dashboard, Plan, ProjectDetail, PublicProject | 4 |

---

## Stat Cards

Dois padrões distintos de cards de estatística, ambos com container `bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6`.

### Variante A — Stat card com ícone (Dashboard)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Dashboard.js` | 4 | 41–79 |

**Estrutura:**

```
[ícone em caixa zinc-800] + label (text-sm text-zinc-400)
valor grande (text-5xl font-light text-white)
```

**Instâncias:**

| data-testid | Ícone | Label | Valor |
|-------------|-------|-------|-------|
| stat-projects | FolderOpen | Projetos | 24 |
| stat-images | Image | Imagens | 156 |
| stat-links | Link2 | Links compartilhados | 18 |
| stat-storage | HardDrive | Armazenamento | 2.4 GB (valor composto com span menor) |

**Diferença na 4ª instância:** valor com unidade inline (`2.4` + `GB` em `text-2xl text-zinc-400`).

---

### Variante B — Stat card com barra de progresso (Plan)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/pages/Plan.js` | 4 | 139–181 |

**Estrutura:**

```
label (text-sm text-zinc-400 mb-2)
valor atual / limite (text-3xl + text-sm text-zinc-500)
barra de progresso (h-2 bg-zinc-800 + fill branco)
```

**Instâncias:**

| Métrica | Valor | Limite | Progresso |
|---------|-------|--------|-----------|
| Projetos | 2 | / 3 | 66% |
| Imagens | 24 | / 30 | 80% |
| Links ativos | 5 | ilimitado | 100% |
| Armazenamento | 320 MB | / 500 MB | 64% |

**Diferenças em relação à Variante A:**

- Sem ícone
- Valor menor (`text-3xl` vs `text-5xl`)
- Exibe consumo vs limite do plano
- Barra de progresso horizontal
- Sem `data-testid` individual

---

### Resumo — Stat Cards

| Variante | Arquivo | Ocorrências | Propósito |
|----------|---------|-------------|-----------|
| Com ícone | Dashboard.js | 4 | Métricas absolutas do dashboard |
| Com progresso | Plan.js | 4 | Consumo vs limites do plano |
| **Total** | 2 arquivos | **8 instâncias** | 2 implementações distintas |

---

## Project Cards

Padrão base: `bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden card-hover` + imagem `h-48` + badge de status + nome + contagem de imagens.

### Variante A — Card clicável simples (Dashboard)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/Dashboard.js` | 3 (mockProjects) | 100–120 |

**Estrutura:**

- Wrapper: `<Link>` (card inteiro é link)
- Imagem com `image-zoom-hover`
- Badge status: `absolute top-3 right-3` — pill `bg-black/60 backdrop-blur-xl`
- Corpo: `p-6` — título `text-xl font-medium` + `{N} imagens`
- Sem menu de ações
- `data-testid`: `project-card-{id}`

---

### Variante B — Card com menu de ações (Projects)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/Projects.js` | 6 (mockProjects) | 76–121 |

**Diferenças em relação à Variante A:**

- Wrapper: `<div className="... relative">` + `<Link className="block">` interno
- Menu de ações: botão `MoreVertical` em `absolute bottom-4 right-4`
- Classe extra: `group relative`
- Mesma estrutura visual de imagem, badge e corpo

---

### Dados mock duplicados

Os arrays `mockProjects` são **cópias independentes** em cada arquivo:

| Arquivo | Projetos no mock | Observação |
|---------|------------------|------------|
| Dashboard.js | 3 | IDs 1–3 |
| Projects.js | 6 | IDs 1–6 (primeiros 3 idênticos ao Dashboard) |

Campos comuns: `id`, `name`, `cover`, `images`, `status`.

---

### Resumo — Project Cards

| Variante | Arquivo | Renderizações | Menu |
|----------|---------|---------------|------|
| Link simples | Dashboard.js | 3 | Não |
| Com menu | Projects.js | 6 | Sim (Ver, Excluir) |
| **Total** | 2 arquivos | **9 instâncias** | 2 templates |

**Nota:** `PublicProject.js` exibe um único projeto em layout hero — não usa project cards em grid.

---

## Image Cards

Padrão base: card com imagem panorâmica `h-48`, nome da imagem, link para viewer.

### Variante A — Card privado com menu (ProjectDetail — grid)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/ProjectDetail.js` | 4 (mockProject.images) | 132–179 |

**Estrutura:**

- Wrapper: `<div className="... card-hover group relative">`
- Link interno → `/viewer/:projectId/:imageId`
- Imagem sem overlay de hover especial
- Corpo: `p-4` — título `text-lg font-medium`
- Menu: botão `MoreVertical` em `absolute top-3 right-3` (estilo escuro com backdrop)
- Dropdown: Visualizar, Renomear, Excluir
- `data-testid`: `image-card-{id}`

---

### Variante B — Card público com hover overlay (PublicProject)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/PublicProject.js` | 4 (mockProject.images) | 75–96 |

**Diferenças em relação à Variante A:**

- Wrapper: `<Link>` (card inteiro é link)
- Rota: `/share/image/:projectId/:imageId`
- Hover overlay: `bg-black/20` + ícone `ExternalLink` em círculo branco
- Sem menu de ações
- Mesmo padding e tipografia do corpo (`p-4`, `text-lg font-medium`)
- `data-testid`: `public-image-{id}`

---

### Variante C — Linha de lista (ProjectDetail — list view)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/ProjectDetail.js` | 4 (mockProject.images) | 187–218 |

**Diferenças:**

- Não é um card — layout de linha dentro de container único
- Thumbnail `w-24 h-16` + nome + ícones de ação inline
- Alternativa ao grid via toggle «Grid / Lista»
- `data-testid`: `image-row-{id}`

---

### Resumo — Image Cards

| Variante | Arquivo | Renderizações | Menu | Link destino |
|----------|---------|---------------|------|--------------|
| Grid privado | ProjectDetail.js | 4 | Sim (3 itens) | `/viewer/...` |
| Grid público | PublicProject.js | 4 | Não | `/share/image/...` |
| List row | ProjectDetail.js | 4 | Ícones inline | `/viewer/...` |
| **Total grid cards** | 2 arquivos | **8 instâncias** | — | — |

---

## Menus

Nenhum componente shadcn (`DropdownMenu`, `ContextMenu`) é utilizado nas páginas. Todos os menus são implementações manuais com `useState` + posicionamento absoluto.

### Menu 1 — Sidebar de navegação (Layout)

| Arquivo | Ocorrências | Linhas |
|---------|-------------|--------|
| `src/components/Layout.js` | 1 menu / 4 itens | 9–14, 47–71 |

**Itens:** Dashboard, Projetos, Plano, Configurações

**Comportamento:**

- Destaque do item ativo: `bg-white text-black rounded-xl`
- Ícones lucide por item
- Drawer mobile com overlay (`sidebarOpen` state)
- `data-testid`: `nav-{nome}`

**Diferença:** único menu de navegação global — não é menu de contexto.

---

### Menu 2 — Ações de projeto (Projects)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/Projects.js` | 6 (1 por project card) | 98–119 |

**Trigger:** botão `MoreVertical` — `p-2 bg-zinc-800 rounded-xl`

**Posição dropdown:** `absolute bottom-full right-0 mb-2`

**Itens:**

| Item | Ícone | Estilo |
|------|-------|--------|
| Ver projeto | Eye | text-zinc-300 |
| Excluir | Trash2 | text-red-400 |

**Estado:** `openMenu` — toggle por `project.id`

**Container dropdown:** `w-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl`

**Limitações:** sem fechar ao clicar fora; sem ações funcionais (botões sem handlers).

---

### Menu 3 — Ações de imagem (ProjectDetail)

| Arquivo | Ocorrências renderizadas | Linhas do template |
|---------|--------------------------|-------------------|
| `src/pages/ProjectDetail.js` | 4 (1 por image card) | 150–177 |

**Trigger:** botão `MoreVertical` — `p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white`

**Posição dropdown:** `absolute top-full right-0 mt-2` (+ `z-10`)

**Itens:**

| Item | Ícone | Estilo |
|------|-------|--------|
| Visualizar | ExternalLink | Link para viewer |
| Renomear | Edit2 | text-zinc-300 |
| Excluir | Trash2 | text-red-400 |

**Estado:** `openImageMenu` — toggle por `image.id`

**Diferenças em relação ao Menu 2:**

| Aspecto | Menu projeto | Menu imagem |
|---------|--------------|-------------|
| Posição do trigger | bottom-4 right-4 | top-3 right-3 |
| Estilo do trigger | bg-zinc-800 sólido | bg-black/60 com blur |
| Direção dropdown | abre para cima | abre para baixo |
| Itens | 2 | 3 |
| Primeiro item | button | Link |

---

### Resumo — Menus

| Tipo | Arquivo | Instâncias | Implementação |
|------|---------|------------|---------------|
| Sidebar nav | Layout.js | 4 itens fixos | Link + state mobile |
| Contexto projeto | Projects.js | 6 | useState manual |
| Contexto imagem | ProjectDetail.js | 4 | useState manual |
| **Total dropdowns contextuais** | 2 arquivos | **10 triggers** | 2 templates similares |

**Componentes shadcn disponíveis mas não usados:** `dropdown-menu.jsx`, `context-menu.jsx`, `navigation-menu.jsx`, `menubar.jsx`

---

## Dialogs

### Estado atual nas páginas

**Nenhum dialog implementado nas páginas da aplicação.**

Busca em `src/pages/` e `src/components/Layout.js`: zero importações ou uso de `Dialog`, `AlertDialog` ou modais.

---

### Componentes shadcn instalados (infraestrutura apenas)

| Arquivo | Tipo | Usado em páginas? |
|---------|------|-------------------|
| `src/components/ui/dialog.jsx` | Dialog genérico (Radix) | Não |
| `src/components/ui/alert-dialog.jsx` | Confirmação (Radix) | Não |
| `src/components/ui/command.jsx` | CommandDialog (compõe Dialog) | Não |

O `CommandDialog` em `command.jsx` é a única referência interna a Dialog — compõe o primitivo shadcn, sem uso externo.

---

### Dialogs previstos pela reconstrução (ausentes no protótipo)

Conforme `docs/audit-report.md` e `docs/rebuild-plan-v2.md`, os seguintes modais serão necessários mas **não existem hoje**:

| Dialog previsto | Contexto | Componente alvo |
|-----------------|----------|-----------------|
| Upload de imagem (preview) | ProjectDetail, NewProject | `Dialog` |
| Compartilhar (copy link) | ProjectDetail, Viewer | `Dialog` |
| Confirmar exclusão | Projects, ProjectDetail | `AlertDialog` |
| Renomear imagem | ProjectDetail | `Dialog` |
| Upload logo escritório | Settings | `Dialog` ou inline |

---

### Padrões visuais que simulam interação modal (não são dialogs)

| Padrão | Arquivo | Linhas | Observação |
|--------|---------|--------|------------|
| Dropdown inline | Projects.js, ProjectDetail.js | — | Menu flutuante, não modal |
| Sidebar drawer mobile | Layout.js | 76–81 | Overlay + painel lateral |
| Upload zone inline | NewProject.js, Settings.js | — | Área dashed, sem modal |

---

### Resumo — Dialogs

| Categoria | Quantidade |
|-----------|------------|
| Dialogs implementados em páginas | **0** |
| Primitivos shadcn instalados | 2 (+ CommandDialog) |
| Dialogs necessários identificados | 5+ |

---

## Recomendações

Prioridades para a Fase 0 da reconstrução, com base na análise acima. **Nenhuma ação de código nesta etapa** — apenas direcionamento.

### 1. Extrair componentes de alto impacto (duplicação confirmada)

| Componente proposto | Origem | Variantes a unificar |
|---------------------|--------|----------------------|
| `PageHeader` | Dashboard, Projects, Settings, Plan, NewProject | simples, com ação, centralizado |
| `SectionHeader` | Dashboard, Plan, ProjectDetail, PublicProject | com/sem ações laterais |
| `StatCard` | Dashboard, Plan | ícone vs progresso |
| `ProjectCard` | Dashboard, Projects | com/sem menu |
| `ImageCard` | ProjectDetail, PublicProject | privado vs público |
| `ContextMenu` / `ActionMenu` | Projects, ProjectDetail | unificar dropdown manual |

### 2. Preservar identidade visual existente

- Manter tokens: `bg-zinc-900/50`, `border-zinc-800`, `rounded-2xl`, `card-hover`
- Manter utilitários de `App.css`: `.card-hover`, `.btn-scale`, `.fade-in`, `.image-zoom-hover`
- Preservar ~70 `data-testid` existentes ao extrair componentes

### 3. Adotar shadcn onde há gap funcional

| Área atual | Substituir por |
|------------|----------------|
| Menus manuais (useState) | `DropdownMenu` |
| Dialogs ausentes | `Dialog` + `AlertDialog` |
| Cards inline | Considerar `Card` shadcn como base estrutural |

### 4. Unificar layouts por contexto

| Layout | Páginas |
|--------|---------|
| `AuthenticatedLayout` | Dashboard, Projects, Settings, Plan, NewProject, ProjectDetail |
| `PublicLayout` | PublicProject (+ header/footer) |
| `ViewerLayout` | Viewer, PublicImage (toolbar + overlay) |

### 5. Eliminar duplicação de dados mock

- `mockProjects` duplicado em Dashboard (3) e Projects (6)
- `mockProject.images` duplicado em ProjectDetail e PublicProject (4 imagens idênticas)
- `mockImage` duplicado em Viewer e PublicImage

Centralizar mocks em `src/mocks/` na próxima fase preparatória reduzirá divergência durante a extração.

### 6. Mapear gaps funcionais nos padrões repetidos

Os padrões visuais existem, mas faltam comportamentos que os dialogs e menus deverão implementar:

- Botões «Compartilhar», «Excluir», «Renomear» — UI presente, sem lógica
- Menus não fecham ao clicar fora ou pressionar Escape
- Upload zones sem preview modal
- Params de URL (`:id`, `:imageId`) ignorados — componentes extraídos devem receber props dinâmicas

### 7. Ordem sugerida de extração (Sprint 0 — próximos passos)

1. `PageHeader` + `SectionHeader` — menor risco, maior repetição tipográfica
2. `StatCard` — 2 variantes bem definidas
3. `ProjectCard` + `ImageCard` — cards com maior duplicação estrutural
4. `ActionMenu` via shadcn `DropdownMenu` — substituir implementação manual
5. `Dialog` / `AlertDialog` — criar shells para fluxos futuros (upload, share, delete)
6. Layouts (`AuthenticatedLayout`, `PublicLayout`, `ViewerLayout`) — refatorar `Layout.js` e páginas públicas

---

**Próximo documento sugerido:** `foundation-step-02.md` — inventário de tokens, utilitários CSS, `data-testid` e dependências shadcn não utilizadas.
