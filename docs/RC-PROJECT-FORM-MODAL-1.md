# RC-PROJECT-FORM-MODAL-1 — Criar e editar projeto em modais

## Resumo

Os fluxos de criação e edição de informações cadastrais básicas do projeto passaram de página dedicada / edição inline para modais responsivos (`AppModal`), com formulário compartilhado, sem desmontar a listagem ou o `ProjectDetail`.

**Build completo:** não executado (orientação da sprint).  
**Deploy:** não realizado.

---

## Fluxo anterior

### Criação

- Rota `/projects/new` → página `NewProject.js` (formulário full-page).
- Entradas: header e empty state em `/projects`, CTAs no Dashboard → `navigate('/projects/new')` ou `actionHref`.
- Após sucesso: toast + `navigate(/projects/:id)`.
- Campos: `title`, `clientName`, `description`, `visibility` (default `private`).

### Edição

- Sem rota `/projects/:id/edit`.
- Edição **inline** no hero de `ProjectDetail` (`isEditing` + inputs no lugar do título/descrição).
- Após sucesso: toast + `refetch()` (já silencioso no hook) + sair do modo edição.
- Exclusão já era ação separada (AlertDialog), fora do formulário.

---

## Fluxo novo

### Criação

1. Usuário clica em “Criar projeto” (Projects, empty state ou Dashboard).
2. Abre `CreateProjectDialog` sobre a tela atual (rota inalterada).
3. Preenche formulário → `createProject` via `projectService`.
4. Sucesso: fecha modal → toast **“Projeto criado com sucesso.”** → `onCreated` (refresh silencioso da listagem, se aplicável) → navega para `/projects/:id` (comportamento anterior preservado).
5. Erro: modal permanece aberto; mensagem no formulário + toast.

### Edição

1. Usuário clica em “Editar” / “Editar projeto” (ProjectDetail ou menu do card em Projects).
2. Abre `EditProjectDialog` com valores atuais.
3. Salva → `updateProject` via `projectService`.
4. Sucesso: fecha modal → toast **“Projeto atualizado com sucesso.”** → `patchProject` / refetch silencioso.
5. `ProjectDetail` não desmonta; tabs/viewer/scroll preservados; sem `AuthLoadingScreen` no save.

---

## Formulário compartilhado

`src/components/projects/ProjectForm.jsx`

- Props: `mode` (`create` | `edit`), `values`, `onChange`, `errors`, `disabled`, `publicVisibilityEnabled`, `autoFocusTitle`.
- Campos preservados (cadastrais básicos atuais):
  - nome do projeto (`title`, obrigatório);
  - nome do cliente (`clientName`);
  - descrição (`description`);
  - visibilidade (`visibility`) — ver decisão abaixo.
- Helpers: `EMPTY_PROJECT_FORM_VALUES`, `projectToFormValues`.
- Acessibilidade: labels associados, `aria-invalid` / `aria-describedby`, `role="alert"` nos erros, foco inicial no nome, radiogroup de visibilidade.

### Decisão — visibilidade no formulário

A preferência da sprint sugere default privado e compartilhamento só no modal próprio. **Mantivemos a visibilidade básica no formulário** porque já existia em criação e edição, e a preferência é “preservar o comportamento atual sempre que possível”.

- Link de compartilhamento, Embed e configurações avançadas **continuam** em `ShareProjectDialog`.
- Default de criação permanece `private`.
- Exclusão **não** entrou no formulário.

---

## Modal de criação

`src/components/projects/CreateProjectDialog.jsx`

| Item | Valor |
|------|--------|
| Título | Criar projeto |
| Descrição | Adicione as informações básicas para começar um novo projeto. |
| Botões | Cancelar · Criar projeto |
| Base | `AppModal` (`size="lg"`, `dismissLocked` enquanto salva) |
| Lock | `submitLockRef` + `isSaving` |
| ID | Gerado por `addDoc` em `createProject` (inalterado) |

---

## Modal de edição

`src/components/projects/EditProjectDialog.jsx`

| Item | Valor |
|------|--------|
| Título | Editar projeto |
| Descrição | Atualize as informações básicas deste projeto. |
| Botões | Cancelar · Salvar alterações |
| Base | `AppModal` (`size="lg"`, `dismissLocked` enquanto salva) |
| Reset | Ao abrir / trocar `project` / fechar — não reaproveita dados anteriores |

---

## Atualização silenciosa

| Contexto | Mecanismo |
|----------|-----------|
| `useProject.refetch` | Já não liga `loading` (sem desmontar a página). |
| `ProjectDetail` após edit | `patchProject(updates)` + `refetch()` silencioso. |
| `useProjectsPage` | Novos `patchProject` e `refreshSilently` (sem `loadingInitial` / sem `AuthLoadingScreen`). |
| Projects após create | `refreshSilently` em `onCreated` antes da navegação. |
| Save | Estado local `isSaving` nos dialogs — **não** reutiliza loading inicial da página. |

Separação conceitual:

- `initialLoading` — carga da página/listagem;
- `saving` — submit do modal;
- `refreshing` — `refreshSilently` / `refetch` sem UI global de loading.

---

## Rotas antigas

| Rota | Decisão |
|------|---------|
| `/projects/new` | **Mantida** como compatibilidade. `NewProject` agora faz `<Navigate to="/projects" replace />`. Abertura do modal por query **não** implementada nesta sprint. |
| `/projects/:id/edit` | **Não existia**; nada a redirecionar. |

Links internos para `/projects/new` removidos (Projects, Dashboard). Favoritos/bookmarks antigos redirecionam para a listagem sem página órfã.

---

## Exclusão

- Continua em `AlertDialog` próprio (listagem e ProjectDetail).
- Não misturada no footer do formulário.
- Cascade (`deleteProjectCascade`) e copy inalterados.
- Menu do card: Ver · Editar · Excluir (exclusão separada).

---

## Pontos de abertura

### Criar → `CreateProjectDialog`

- `Projects` — header (`create-project-btn`)
- `Projects` — empty state (`projects-empty-create-btn`)
- `Dashboard` — section CTA e empty state

### Editar → `EditProjectDialog`

- `ProjectDetail` — botão desktop e item do menu mobile
- `Projects` — menu do `ProjectCard` (“Editar”)

---

## Arquivos alterados / criados

### Criados

- `src/components/projects/ProjectForm.jsx`
- `src/components/projects/CreateProjectDialog.jsx`
- `src/components/projects/EditProjectDialog.jsx`
- `src/components/projects/ProjectForm.test.jsx`
- `src/components/projects/CreateProjectDialog.test.jsx`
- `src/components/projects/EditProjectDialog.test.jsx`
- `docs/RC-PROJECT-FORM-MODAL-1.md`

### Alterados

- `src/pages/Projects.js`
- `src/pages/Dashboard.js`
- `src/pages/ProjectDetail.js`
- `src/pages/NewProject.js` (redirect)
- `src/components/common/ProjectCard.jsx`
- `src/hooks/useProjectsPage.js`

### Não alterados (escopo)

- Schema Firestore / rules / Cloud Functions
- Embed, hotspots, billing, limites de plano, IDs públicos, cascade de exclusão
- `projectService.createProject` / `updateProject` (fluxo de ID e defaults)

---

## Testes executados

Comando (apenas relacionados; sem build completo):

```bash
npm test -- --watchAll=false --testPathPattern="ProjectForm|CreateProjectDialog|EditProjectDialog|useProject.refetch|ShareProjectDialog|projectService"
```

Cobertura dos novos testes:

- Formulário compartilhado (create/edit, foco, erros, plano sem público)
- Create: abre vazio, validação, submit único, anti-duplicação, erro mantém aberto, toast + navigate
- Edit: carrega dados, salva campos corretos, erro mantém aberto, troca de projeto, anti-duplicação
- Regressão: refetch silencioso (`useProject`), Share dialog, projectService

**Resultado:** suites do formulário/dialogs — **3 passed / 15 tests passed** (`ProjectForm`, `CreateProjectDialog`, `EditProjectDialog`). Build completo não executado.

---

## Validação manual (checklist)

- [ ] Criar na listagem — modal, criar, toast, abre projeto, listagem coerente ao voltar
- [ ] Criar pelo empty state — mesmo dialog
- [ ] Criar pelo Dashboard — mesmo dialog
- [ ] Editar no card (menu) — card atualiza silenciosamente
- [ ] Editar no ProjectDetail — página não reinicia; scroll/estado preservados
- [ ] Erro simulado — modal permanece; retry funciona
- [ ] `/projects/new` redireciona para `/projects`
- [ ] Exclusão continua no AlertDialog separado
- [ ] Mobile 320 / 375 / 430 — footer acessível com teclado virtual
- [ ] Escape fecha quando não está salvando; foco retorna ao disparador (AppModal/Radix)

---

## Riscos residuais

1. Favoritos de `/projects/new` não abrem o modal automaticamente (redirect só para listagem) — aceito nesta sprint.
2. Visibilidade permanece no formulário e também no Share — duas UIs para o mesmo campo (já era assim entre create/edit e Share).
3. `createProject` ainda não incrementa `projectCount` via `applyUsageDelta` (gap pré-existente; fora do escopo desta sprint / limites).
4. Dashboard após criar navega para o detalhe; lista recente do Dashboard só atualiza ao remontar.

---

## Confirmações

| Item | Status |
|------|--------|
| Build completo | **Não executado** |
| Deploy | **Não realizado** |
| Schema / rules / functions | Intactos |
| Cascade / IDs / URLs públicas | Intactos |
| Compartilhamento / Embed | Separados (`ShareProjectDialog`) |
| Exclusão | Confirmação própria |
