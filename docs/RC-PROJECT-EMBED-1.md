# RC-PROJECT-EMBED-1 — Incorporação de projetos em websites

## Visão geral

Recurso Beta que permite incorporar a visualização 360° de um projeto em websites externos via código responsivo (`iframe`), disponível a partir do plano **Professional**.

Mensagem comercial:

> Permite adicionar a visualização do projeto dentro de um website existente.

## Modelo de dados

Campo em `projects/{projectId}`:

```js
embedSettings: {
  enabled: boolean,
  initialImageId: string | null,
  allowFullscreen: boolean,
  allowNavigation: boolean,
  showBranding: true, // obrigatório nesta sprint
  updatedAt: Timestamp | null,
}
```

Projetos sem o campo usam fallback seguro (enabled=false, fullscreen/navegação=true, branding=true). Sem migração em massa.

## Rota

| Rota | Auth | Descrição |
|------|------|-----------|
| `/embed/:projectId` | Pública | Redireciona para imagem inicial |
| `/embed/:projectId/image/:imageId` | Pública | Viewer Embed |

Sem Layout/sidebar/dashboard.

## Código de incorporação

Gerado por `buildEmbedSnippet` (`src/utils/embed.js`), com base em:

1. `REACT_APP_APP_BASE_URL`
2. `REACT_APP_PUBLIC_URL`
3. `window.location.origin`

Inclui `loading="lazy"`, `allow="fullscreen"`, `allowfullscreen` e `title` escapado.

## Validação de plano

- Fonte de verdade: `users.plan` (string ou `{ id, status }`)
- Helper: `canUseProjectEmbed(plan)` / flag `projectEmbedEnabled`
- Status ativos: `active`, `trialing` (mesmo padrão do portfólio)
- Professional, Studio e Enterprise elegíveis
- UI e `updateProjectEmbedSettings` bloqueiam Starter
- Cloud Function revalida no servidor

## Comportamento após cancelamento

- `embedSettings.enabled` **permanece** salvo
- Rota pública fica indisponível enquanto o plano não for elegível
- Ao reativar Professional, o Embed volta sem reconfiguração
- UI do dono: mensagem de indisponibilidade temporária (não exposta na rota pública)

## Segurança

### Decisão arquitetural

Leitura pública do Embed via **Cloud Function HTTP** `getPublicEmbeddedProject` (Admin SDK):

1. Valida `embedSettings.enabled`
2. Valida plano do proprietário
3. Retorna DTO mínimo (sem `userId`, billing, e-mail, etc.)
4. Funciona com projeto `private` + Embed ativo (independente de listagem/portfólio)

Firestore Rules **não** ampliam get anônimo para projetos private. Writes de `embedSettings` só pelo owner; `showBranding` deve ser `true`.

### DTO público

```ts
EmbeddedProjectDTO = {
  id, name, initialImageId,
  images: [{ id, name, panoramaUrl, order, hotspots }],
  embedSettings: { enabled, initialImageId, allowFullscreen, allowNavigation, showBranding }
}
```

## Headers (Firebase Hosting)

| Path | CSP |
|------|-----|
| `/embed/**` | `frame-ancestors *` |
| Rotas admin (`/dashboard`, `/projects`, `/viewer`, …) | `frame-ancestors 'self'` |

**Limitação:** headers path-scoped no Hosting; em `localhost` (CRA) não se aplicam. Não usamos `frame-ancestors 'self'` em `/**` junto com `/embed/**` para evitar combinação restritiva de múltiplos CSP.

**Risco residual:** páginas públicas (`/`, `/share`, `/u`) ainda podem ser framed até política mais granular.

## Estados de erro (rota pública)

| Caso | Mensagem |
|------|----------|
| Desativado / plano / inexistente | Esta visualização não está disponível. |
| Sem imagens | Este projeto ainda não possui imagens disponíveis para visualização. |
| Erro de carga | Não foi possível carregar esta visualização. Tente novamente mais tarde. |

Motivo de plano **nunca** é revelado publicamente.

## Limitações do Beta

- Marca **Powered by FIVI360** obrigatória
- Sem restrição por domínio (allowlist)
- Sem white-label
- Sem analytics avançado do Embed
- Quem tem o link/código pode visualizar
- Exige plano Professional (ou superior)
- Storage continua via download URLs (padrão atual do share)

## Próximos passos

- White-label / remoção da marca
- Allowlist de domínios
- Analytics / postMessage
- Customização visual
- Senha / expiração
- Página `/para-arquitetos`
- Subdomínio dedicado do Viewer

## Deploy

Nenhum deploy foi realizado nesta sprint.
