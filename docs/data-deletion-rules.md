# Regras de exclusão de dados

Este documento descreve o comportamento de exclusão em cascata no Fivi360 e limitações da implementação atual.

## Exclusão de projeto

Quando o usuário exclui um projeto, **todo o conteúdo vinculado é removido**. Imagens **não** são movidas para a galeria solta.

### O que é excluído

| Recurso | Local |
|--------|--------|
| Projeto | `projects/{projectId}` |
| Imagens do projeto | `images` onde `projectId == projectId` |
| Hotspots | Subcoleção `images/{imageId}/hotspots/{hotspotId}` |
| Arquivos no Storage | Paths em `storagePath`, `originalStoragePath`, `previewStoragePath` (quando presentes) |

### Fluxo (`deleteProjectCascade`)

Implementado em `src/services/projects/projectService.js`:

1. Validar que o projeto existe e pertence ao `userId` autenticado.
2. Buscar todas as imagens do projeto (`getImagesByProjectId`).
3. Para cada imagem:
   - Excluir todos os hotspots (`deleteAllHotspotsForImage`).
   - Excluir arquivos do Storage de forma tolerante (`deleteImageFilesTolerant`).
   - Excluir documento `images/{imageId}`.
4. Excluir documento `projects/{projectId}`.
5. A UI emite `fivi360:project-deleted` para atualizar listas em cache (Dashboard, projetos).

### Comportamento em falhas

- **Storage:** se um arquivo não existir ou a exclusão falhar por outro motivo transitório, o fluxo **continua**. Em desenvolvimento, warnings são registrados no console.
- **Firestore:** falha ao excluir imagem ou projeto interrompe a operação e o usuário vê mensagem de erro clara.

### Exclusão de imagem individual

Fora do escopo deste documento, mas relevante para comparação: `deleteImage` em `imageService.js` exige sucesso no Storage antes de remover o documento Firestore (comportamento mais restritivo, adequado à exclusão unitária).

## Implementação futura recomendada

A exclusão em cascata hoje roda no **cliente** (SDK Firebase no browser), sujeita a:

- Interrupção se o usuário fechar a aba no meio do processo.
- Ausência de atomicidade entre Storage e Firestore.
- Dependência das regras de segurança do Firestore para autorização.

**Recomendação:** migrar `deleteProjectCascade` para uma **Cloud Function** (ou Callable Function) que:

- Valide o token do usuário no servidor.
- Execute a mesma ordem de exclusão com credenciais admin.
- Registre falhas parciais para reconciliação.
- Opcionalmente use filas / retries para Storage.

Até essa migração, o client permanece como única via de exclusão em cascata de projeto.

## O que não acontece na exclusão de projeto

- Imagens **não** são desvinculadas nem movidas para galeria solta.
- Hotspots de outras imagens (fora do projeto) **não** são alterados.
- Links públicos deixam de funcionar quando os documentos são removidos.

## UI

Modais de confirmação em `/projects` e `/projects/:id` informam que imagens, hotspots e arquivos serão removidos permanentemente.
