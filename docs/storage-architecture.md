# Arquitetura de Storage — imagens 360°

## Princípio

O **Firebase Storage** armazena apenas o arquivo da imagem. A **organização** (galeria solta vs. projeto) é controlada exclusivamente pelo **Firestore**, no campo `projectId` do documento `images/{imageId}`.

| Campo Firestore | Função |
| --- | --- |
| `projectId` | `null` = imagem solta; ID = imagem vinculada ao projeto |
| `storagePath` | Onde o arquivo está fisicamente no bucket |
| `originalUrl` / `previewUrl` | URLs de download (podem incluir token) |

## Path padrão (novos uploads)

Todos os novos uploads usam um único path por usuário:

```
users/{userId}/images/{imageId}.webp
```

Independente de a imagem ser enviada em `/images` (galeria) ou em `/projects/:id`.

## Paths legados

Imagens criadas antes desta padronização podem ter:

```
users/{userId}/projects/{projectId}/images/{imageId}.webp
```

**Não há migração em massa.** O sistema continua funcionando enquanto o documento Firestore mantiver o `storagePath` correto.

Operações em imagens existentes **sempre** usam `image.storagePath` salvo no Firestore para:

- abrir / exibir
- excluir individual
- excluir em cascata (projeto)
- substituir arquivo

Nunca montar o path manualmente a partir de `projectId` para dados já persistidos.

## Mover imagem entre galeria e projeto

Move é **somente Firestore**:

- **Galeria → projeto:** atualiza `projectId`, `projectVisibility`, `updatedAt`
- **Projeto → galeria:** `projectId: null`, remove `projectVisibility`, `updatedAt`

Não copia, não deleta e não altera `storagePath`, `originalUrl` ou `previewUrl`.

## Substituir arquivo (replace)

O novo arquivo vai para o path padrão `users/{userId}/images/{imageId}.webp`.

Se a imagem ainda estiver em path legado, o replace:

1. envia o novo arquivo para o path único
2. atualiza `storagePath` e URLs no Firestore
3. tenta remover o arquivo legado (falha no delete não interrompe o fluxo)

## Exclusão

- **Imagem individual:** `deleteImageFile(image.storagePath)`
- **Projeto em cascata:** para cada imagem vinculada, deleta pelo `storagePath` do documento, depois hotspots, documentos e o projeto

## Regras de Storage

Ver `storage.rules`. Acesso read/write restrito ao dono (`users/{userId}/**`). Paths legados sob `users/{userId}/projects/...` permanecem cobertos pela mesma regra de owner.

## Migração futura (opcional)

Uma migração offline pode copiar arquivos legados para `users/{userId}/images/{imageId}.webp` e atualizar `storagePath` no Firestore. Não é necessária para o funcionamento atual.

## Referências

- Implementação: `src/services/images/imageService.js`
- Storage helpers: `src/services/storage/storageService.js`
- Exclusão em cascata: `src/services/projects/projectService.js`
