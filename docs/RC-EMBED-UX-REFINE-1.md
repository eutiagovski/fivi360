# RC-EMBED-UX-REFINE-1 — Refinamento da experiência de compartilhamento e incorporação

## Resumo executivo

Reorganização exclusiva da UX do modal **Compartilhar projeto**, separando duas jornadas independentes via **tabs** acessíveis (Radix):

1. **Compartilhar por link** — visibilidade + link + cópia  
2. **Incorporar no website** — ativação, configurações, aviso, prévia e código HTML  

A lógica de negócio, segurança, schema `embedSettings`, Cloud Functions, Firestore Rules e gerador de snippet permanecem **inalterados**. Nenhum deploy foi executado.

## Problemas da experiência anterior

- Link e incorporação empilhados na mesma coluna longa  
- Incorporação visualmente “escondida” no meio do modal  
- Pouca hierarquia entre ativação, configs e código  
- Termo “Imagem inicial” pouco intuitivo para arquitetos  
- Código HTML e aviso de acesso sem destaque adequado  
- Prévia secundária e pouco contextualizada  
- Benefício Professional+ pouco evidente  
- Modal dependente de rolagem excessiva  

## Estrutura nova do modal

| Camada | Conteúdo |
|--------|----------|
| Header | Título `Compartilhar projeto` + descrição compacta das duas jornadas |
| Tabs | `Compartilhar por link` \| `Incorporar no website` |
| Painel link | Visibilidade + link do projeto |
| Painel embed | Benefício premium + ativação + (se ativo) configs / aviso / prévia / código |
| Tamanho | `AppModal` size `xl` (`max-w-2xl`) |
| Scroll | Conteúdo com `max-h-[min(70vh,85dvh)]`; header/tabs permanecem acima do scroll do painel |

## Estratégia de tabs

- Componentes: `@/components/ui/tabs` (Radix Tabs — teclado, semântica `tab`/`tabpanel`)  
- Tab inicial ao abrir: **Compartilhar por link**  
- `forceMount` nos painéis para **preservar estado local** ao trocar de aba  
- Painel inativo: `data-[state=inactive]:hidden` (sem desmontar)  

## Fluxo de compartilhamento por link

1. Título: **Quem pode visualizar?**  
2. Cards compactos (Privado / Compartilhado / Público) com área clicável integral e indicador visual  
3. Botão **Salvar visibilidade** apenas quando houver alteração (comportamento anterior)  
4. **Link do projeto** + **Copiar link** (toast “Link copiado”)  
5. Aviso se privado: link não funciona para visitantes  
6. Sem código HTML nesta aba  

## Fluxo de incorporação

Hierarquia:

1. Título + badge **Professional+** + copy comercial  
2. Card **Ativar incorporação** (switch)  
3. Se ativo → **Configurações da visualização**  
4. Aviso de acesso (ícone informativo)  
5. **Prévia** (sob demanda)  
6. **Código de incorporação**  

## Estado bloqueado por plano

- Sem switch, select, checkboxes, preview ou snippet  
- Mensagem: valor comercial + “Disponível a partir do plano Professional.”  
- CTA: **Conhecer o Professional** (`/plan`)  
- Se `embedSettings.enabled` já era `true` e o plano caiu: mensagem de indisponibilidade temporária (preservada)  
- Elegibilidade continua em `projectEmbedEnabled` / backend  

## Estado ativado / desativado

| Estado | UI |
|--------|----|
| Desativado | Apenas card de ativação + texto “Ative a incorporação para configurar…” |
| Ativado | Revela configs, aviso, prévia e código com transição discreta |
| Salvando | Switch/controles `disabled` + “Salvando…” |
| Sucesso (auto-save) | Feedback discreto “Alterações salvas.” (sem toast a cada checkbox) |
| Desativar | Toast explicativo (comportamento anterior) |
| Erro | Toast destrutivo / plan limit toast |

Persistência: **imediata por alteração** via `updateProjectEmbedSettings` (sem novo fluxo de save).

## Preview

- Seção **Prévia** com proporção 16:9  
- iframe real em `/embed/:projectId` **somente sob demanda** (“Abrir prévia”)  
- Não carrega com incorporação desativada nem para plano bloqueado  
- Ação **Abrir em nova aba** com a mesma URL  
- Decisão de performance: carga sob demanda no modal para evitar múltiplas instâncias desnecessárias do Pannellum  

## Código de incorporação

- Bloco próprio com fundo/borda/mono/altura limitada  
- Visível **somente** com incorporação ativa e plano elegível  
- Botão **Copiar código** → toast “Código de incorporação copiado.”  
- Fallback Clipboard API: foca/seleciona o textarea + instrução manual  
- Snippet gerado por `buildEmbedSnippet` (idêntico)  

## Responsividade

- Desktop: `max-w-2xl`  
- Mobile: tabs em duas colunas com tipografia reduzida; cards full-width; code com scroll; botão copiar full-width no mobile  
- Modal: `w-[calc(100%-2rem)]`, altura limitada à viewport  

## Acessibilidade

- Tabs Radix (setas/teclado, `aria-selected`)  
- Labels associados a switch/select  
- `aria-label` nos controles  
- Aviso com `role="note"`  
- Status de save com `aria-live="polite"`  
- Code block selecionável; foco visível nos campos  
- Badge **não** é a única indicação de bloqueio (copy + CTA)  
- Focus trap do `Dialog`/`AppModal` preservado  

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/projects/ShareProjectDialog.jsx` | Tabs, copy do header, painel de link refinado, size `xl` |
| `src/components/projects/ProjectEmbedSettingsSection.jsx` | Hierarquia premium, Ambiente inicial, prévia, código, feedback de save |
| `src/components/common/AppModal.jsx` | Novo size `xl` (`max-w-2xl`) |
| `src/components/projects/ShareProjectDialog.test.jsx` | Testes da UX (novo) |
| `docs/RC-EMBED-UX-REFINE-1.md` | Este documento |

## Testes adicionados / atualizados

**Novo:** `ShareProjectDialog.test.jsx` (14 testes)

- Tabs: início, separação link/embed, preservação de estado, descrição  
- Plano: bloqueio sem código/configs + badge  
- Ativação: ocultar/mostrar, persistência, loading, erro  
- Configs: Ambiente inicial, fullscreen, navegação  
- Código: snippet idêntico, copy + fallback clipboard  
- Preview: sob demanda, URL correta, ausente se bloqueado  

**Regressão relacionada:** `embed.test.js`, `canUseProjectEmbed.test.js`, `embedSettings.test.js`

## Resultados dos testes

```text
ShareProjectDialog.test.jsx — 14 passed
embed.test.js / canUseProjectEmbed.test.js / embedSettings.test.js — 20 passed
```

## Resultado do build

```text
npm run build — sucesso (exit 0)
Warnings pré-existentes em PublicContactSection / PublicImageViewer / PublicPortfolio / Viewer
(nenhum warning novo nos arquivos desta sprint)
```

## Validação manual

Checklist sugerido (ambiente local):

- [ ] Alternar Privado / Compartilhado / Público e salvar  
- [ ] Copiar link e abrir em aba anônima  
- [ ] Professional — embed desativado: copy, badge, configs ocultas; ativar  
- [ ] Professional — embed ativo: ambiente, fullscreen, navegação, prévia, código, nova aba  
- [ ] Starter: bloqueio + CTA, sem código  
- [ ] Mobile 320 / 375 / 430: tabs, controles, code block, prévia  

## Confirmação de ausência de alteração funcional

- Rota `/embed/:projectId` intacta  
- Snippet / URLs / `showBranding: true` intactos  
- `initialImageId` continua o campo persistido (apenas label UI → Ambiente inicial)  
- Visibilidade e cópia de link com a mesma lógica  
- Auto-save de embed e save explícito de visibilidade preservados  

## Confirmação de ausência de alteração em backend / Rules

- Sem mudanças em Cloud Functions  
- Sem mudanças em Firestore Rules  
- Sem mudanças no schema `embedSettings`  
- Sem mudanças em `canUseProjectEmbed` / limites de plano  

## Riscos residuais

- Prévia sob demanda ainda instancia Pannellum ao abrir o iframe no modal (mitigado por não carregar automaticamente)  
- `forceMount` mantém o painel embed montado (estado preservado; custo de memória baixo)  
- Validação manual mobile/real iframe depende do ambiente com Functions/Hosting locais  

## Confirmação de ausência de deploy

**Nenhum deploy** (Hosting, Functions ou Rules) foi executado nesta sprint.
