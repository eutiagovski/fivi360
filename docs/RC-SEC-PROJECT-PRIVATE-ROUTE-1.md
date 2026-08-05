# RC-SEC-PROJECT-PRIVATE-ROUTE-1 — Impedir acesso a projetos de terceiros pela rota interna

## Causa raiz

A rota `/projects/:projectId` estava protegida apenas por autenticação (`ProtectedRoute`), sem validação de ownership/membership.

O fluxo usava `useProject` → `getProjectById`, que devolve qualquer documento legível pelas Firestore Rules. As Rules permitem `get` em projetos `shared`/`public` (necessário para `/share` e portfólio). Sem filtro de ownership na camada de app, um usuário autenticado abria a UI administrativa de um projeto público/compartilhado de terceiro.

## Fluxo vulnerável (antes)

```text
GET /projects/:id
  → ProtectedRoute (só sessão + e-mail)
  → ProjectDetail
  → useProject → getProjectById
  → Firestore allow get se owner OR shared/public
  → UI admin renderiza título, capa, menus (imagens vazias por filtro userId)
```

Edição/upload falhavam depois (Rules/service), mas metadados já tinham vazado.

## Distinção privado × público

| Contexto | Rotas | Autorização |
|----------|-------|-------------|
| Interno | `/projects/:id`, `/viewer/:imageId` | Owner (Beta) ou membership futura |
| Público | `/share/project/:id`, `/u/:slug/...` | `visibility` shared/public (+ regras de portfólio) |
| Embed | `/embed/:id` | Cloud Function / elegibilidade (inalterado) |

**Regra formal interna:**

```text
canAccessInternalProject =
  isAuthenticated
  AND isProjectOwnerOrAuthorizedMember

# NÃO inclui: OR project.visibility === "public"
```

## Regra de acesso interno

Função central: `canUserAccessProjectInternally` em `src/utils/projectAccess.js`.

- **Beta:** apenas `project.userId === userId`
- Membership explícita com role autorizado fica preparada para colaboração futura
- `activeWorkspaceId` sozinho **não** concede acesso
- Visibilidade pública **não** concede acesso interno

## Services alterados

| Função | Uso |
|--------|-----|
| `getOwnedOrAccessibleProject(projectId, uid)` | Rota interna / viewer interno |
| `getPublicSharedProject(projectId)` | Helper público (shared/public); rotas públicas existentes mantêm `getProjectById` + `canAccessSharedProject` para preservar mensagens (`private` vs `not_found`) |
| `getProjectById` | Leitura bruta; mutações e contextos que já filtram depois |

Rotas públicas **não** mudaram de comportamento.

## Viewer interno

`useViewerImage`:

1. Carrega imagem
2. Se `image.userId !== auth.uid` → `not_found` (sem renderizar dados)
3. Se há `projectId` → `getOwnedOrAccessibleProject` (público de terceiro bloqueia)
4. Só então define state de imagem/projeto

`Viewer.js` só chama `useHotspots` após imagem autorizada.

Mensagem genérica: “Imagem não encontrada ou você não possui acesso.”

## Imagens e hotspots

- `useProjectImages` só recebe `projectId` depois do acesso interno confirmado
- Listagem já filtrava por `userId`; agora nem dispara query antecipada
- Hotspots internos não carregam para `imageId` de terceiro
- Mutações de hotspot já exigiam ownership da imagem

## Rules

**Nenhuma Rule foi ampliada nem restrita nesta sprint.**

Motivo: `allow get` em shared/public continua necessário para `/share` e portfólio anônimo (Opção C atual).

Defesa desta correção: camada de aplicação na rota privada.

Risco residual documentado em `docs/security-rules-notes.md` (cliente ainda pode `getDoc` direto em shared/public via SDK). Mitigações futuras: Opção A (projeção pública) ou Opção B (endpoint Admin, padrão do Embed).

## Mensagem de bloqueio

Em `/projects/:id` sem acesso:

- Título: “Projeto não encontrado”
- Texto: “Projeto não encontrado ou você não possui acesso.”
- Botão: “Voltar para projetos”
- Sem redirecionamento para `/share/project/:id`
- Sem revelar dono, visibilidade ou existência diferenciada

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/utils/projectAccess.js` | Novo helper de acesso interno + log DEV |
| `src/utils/projectAccess.test.js` | Testes da regra |
| `src/services/projects/projectService.js` | `getOwnedOrAccessibleProject`, `getPublicSharedProject` |
| `src/services/projects/projectService.test.js` | Testes dos getters |
| `src/hooks/useProject.js` | Exige `userId`; usa getter interno; limpa state antes do load |
| `src/hooks/useProject.refetch.test.jsx` | Atualizado + caso terceiro |
| `src/hooks/useViewerImage.js` | Ownership + projeto interno; `not_found` genérico |
| `src/hooks/useViewerImage.test.jsx` | Novo |
| `src/pages/ProjectDetail.js` | Passa `user.uid`; gate de imagens; mensagem |
| `src/pages/Viewer.js` | Gate de hotspots; mensagem genérica |
| `docs/security-rules-notes.md` | Nota da defesa app-layer |
| `docs/RC-SEC-PROJECT-PRIVATE-ROUTE-1.md` | Este documento |

## Testes executados

```text
npm test -- --watchAll=false --testPathPattern="projectAccess|useProject.refetch|useViewerImage|projectService.test|publicAccess.test"
→ 5 suites, 46 passed
```

Cobertura relacionada:

- Owner acessa internamente
- Terceiro com projeto público/shared/private negado
- Public visibility não concede acesso interno
- `getPublicSharedProject` / `canAccessSharedProject` intactos
- Viewer bloqueia imagem estrangeira sem setar state
- Refetch silencioso preservado

**Build completo não executado** (orientação da sprint).

**Firestore Rules suite** não reexecutada: Rules não foram alteradas.

## Validação manual

Checklist sugerido (dois usuários A/B):

- [ ] A: `/projects/:id` (privado / shared / public / embed) — OK
- [ ] B: `/projects/:id` do A — mensagem genérica, sem dados, sem ações
- [ ] B: `/share/project/:id` — conforme visibilidade
- [ ] B: `/embed/:id` — conforme configuração/plano
- [ ] B: `/viewer/:imageId` de A — bloqueado sem dados
- [ ] Sem redirect automático para share

## Riscos residuais

1. Cliente autenticado ainda pode ler documento `projects/{id}` shared/public via SDK (Rules Opção C).
2. Colaboração por membership ainda não é produto Beta — só preparada na função central.
3. `getPublicSharedProject` existe mas páginas públicas ainda usam o fluxo anterior de propósito (mensagens `private` vs `not_found`).

## Confirmações

- **Build completo:** não executado
- **Deploy:** não realizado
- **Rotas públicas:** comportamento preservado
- **Schema / billing / hotspots product logic / IDs:** não alterados além da autorização da cadeia interna
