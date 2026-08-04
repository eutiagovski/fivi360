# RC-EMBED-UX-POLISH-2 — Sobreposição no Viewer e prévia estável

## Causa da sobreposição

No `EmbedProject`, o título do ambiente ficava em uma faixa **full-width** (`left-3 right-3`) com `z-[6]`, acima dos controles nativos do Pannellum (`z-index: 4`, topo-direita).

Com nomes longos (ou mesmo curtos sem `max-width` efetivo), o texto avançava sobre zoom/fullscreen. A navegação entre ambientes também competia pelo canto direito.

## Causa do reload da prévia

Dois fatores no frontend (sem mudança de `src` por fullscreen/navegação):

1. **`useProject.refetch` ligava `loading = true`**, e `ProjectDetail` renderiza `<AuthLoadingScreen />` enquanto `loading` — **desmontando** o `ShareProjectDialog` e o iframe a cada save de embed (`onVisibilitySaved={refetch}`).
2. **`ShareProjectDialog` resetava a tab** para “Compartilhar por link” em todo `project` update (`useEffect([project, open])`), gerando flash de troca de aba.

O `src` do iframe já dependia só de `projectId` + base URL; toggles de fullscreen/navegação **não** mudavam a URL. O remount vinha do desmonte do modal.

## Estratégia adotada

### Título (Viewer Embed)

- Container só no **topo-esquerdo**
- `max-w-[min(70%,calc(100%-5.5rem))]` reserva a direita para Pannellum
- `line-clamp-2` + `break-words` + `title` nativo
- `pointer-events-none`
- Nav de ambientes em `right-14` / `sm:right-16` (fora da coluna dos controles Pannellum)

### Prévia (Opção A + B pontual)

- **A:** iframe estável; `src`/`key` não mudam em fullscreen/navegação
- **B:** ao mudar **ambiente inicial**, debounce ~600 ms + overlay discreto “Atualizando prévia…”
- `refetch` silencioso (sem `loading`)
- Tab só reinicia quando o **modal abre** (`open`), não quando o projeto é atualizado
- Sync de `settings` evita replace desnecessário do state

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/EmbedProject.jsx` | Layout do título / nav |
| `src/hooks/useProject.js` | Refetch sem `loading` |
| `src/components/projects/ShareProjectDialog.jsx` | Reset de tab só no open |
| `src/components/projects/ProjectEmbedSettingsSection.jsx` | Prévia estável + debounce ambiente |
| `src/pages/EmbedProject.title.test.jsx` | Testes do título |
| `src/hooks/useProject.refetch.test.jsx` | Teste refetch silencioso |
| `src/components/projects/ShareProjectDialog.test.jsx` | Estabilidade da prévia / tab |
| `docs/RC-EMBED-UX-POLISH-2.md` | Este documento |

## Não alterado

Backend, Cloud Functions, Rules, schema, elegibilidade, rota, Pannellum core, snippet, layout geral das tabs.

## Testes executados

```text
npm test -- --watchAll=false --testPathPattern="EmbedProject.title|useProject.refetch|ShareProjectDialog.test"
→ 3 suites, 20 passed
```

(sem build completo — orientação do projeto)

## Validação manual

- [ ] Título curto e longo sem cobrir zoom/fullscreen
- [ ] Mobile: título legível, controles clicáveis
- [ ] Alternar fullscreen/navegação várias vezes sem flash do iframe
- [ ] Trocar ambiente inicial → um reload com “Atualizando prévia…”
- [ ] Tab Embed permanece após salvar
- [ ] Feedback “Salvando…” / “Alterações salvas.”

## Riscos residuais

- Fullscreen/navegação no iframe só refletem após reload manual/ambiente (desejado)
- Debounce de 600 ms no ambiente inicial pode atrasar levemente a atualização visual
- Controles Pannellum e nav ainda compartilham a metade direita; padding `right-14` assume largura padrão dos controles

## Confirmação de ausência de deploy

**Nenhum deploy** foi executado.

## Build

**Build completo não executado**, conforme orientação desta sprint.
