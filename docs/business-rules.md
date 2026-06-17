# FIVI360 — Business Rules

# Visibilidade

Todos os projetos e imagens possuem:

```ts
private
shared
public
```

Nomes conceituais:

| Valor    | Conceito                    |
| -------- | --------------------------- |
| private  | privado                     |
| shared   | compartilhado por link      |
| public   | público — aparece no portfólio |

---

## Private

Apenas o proprietário pode visualizar.

---

## Shared

Qualquer pessoa com o link pode visualizar.

Não aparece em portfólio público.

---

## Public

Pode ser acessado por link.

Pode aparecer no portfólio público.

---

# Projetos

## Regras

Um projeto:

* pertence a um único usuário
* possui várias imagens
* pode existir sem imagens
* possui `clientName` — nome do cliente, incorporadora ou proprietário

---

# Imagens

## Regras

Uma imagem:

* pertence a um único usuário
* pode pertencer a um projeto
* pode existir sem projeto

```ts
projectId = null
```

---

# Hotspots

Tipos:

```ts
info
scene
```

---

## Info

Exibe informações.

---

## Scene

Navega para outra imagem do **mesmo projeto**.

Ao mover uma imagem de projeto para a galeria (imagem solta):

* hotspots `scene` na própria imagem são removidos;
* hotspots `scene` em outras imagens do projeto que apontam para ela são removidos;
* hotspots `info` são preservados;
* a movimentação só ocorre após a limpeza, em batch atômico no Firestore.

Mover imagem da galeria para um projeto **não** cria hotspots automaticamente — apenas preserva os existentes.

---

# Planos

## Starter

* limite de imagens
* sem hotspots
* sem portfólio público

---

## Professional

* hotspots
* portfólio público
* maior limite de imagens

---

# Portfólio Público

Cada usuário pode possuir um slug único persistido em `publicProfiles/{uid}.slug` (exposto na UI como `publicSlug`).

URL oficial:

```text
/u/:slug
```

Exemplos:

```text
/u/tiagomachado
/u/fivistudio
/u/arquiteta-rj
```

---

## Coleção `slugs`

Registro único para garantir que dois usuários não compartilhem o mesmo endereço:

```text
slugs/{slug}
```

```ts
{
  uid
  type        // "user"
  createdAt
}
```

O ID do documento é o slug normalizado. A rota `/u/:slug` resolve `slugs/{slug}.uid` → `publicProfiles/{uid}`.

---

## Regras

Slug:

* obrigatório para portfólio
* único no sistema (coleção `slugs`)
* formato: apenas `a-z`, `0-9` e `-`
* normalização automática: minúsculas, espaços → hífen, remoção de caracteres inválidos

Exemplos válidos:

```text
tiago-machado
studio360
arquiteta-rj
```

Exemplos inválidos:

```text
Tiago Machado   → normalizado para tiago-machado
tiago_machado   → inválido
tiago@machado   → inválido
```

---

# Compartilhamento

Projeto compartilhado:

```text
/share/project/:projectId
```

Imagem compartilhada:

```text
/share/image/:imageId
```

Ambos devem funcionar sem login.

Projetos e imagens com visibilidade `shared` ou `public` podem ser acessados por link.

---

# Upload

Formatos permitidos:

* JPG
* JPEG
* PNG

Não permitir:

* HEIC
* TIFF
* BMP

---

## Fluxo de upload

1. Usuário seleciona imagem
2. Sistema carrega prévia em modal
3. Usuário define nome
4. Usuário confirma upload
5. Exibir loading durante carregamento e salvamento

---

# Substituir Imagem

Permitir substituir o arquivo da imagem sem perder metadados.

Preservar:

* title
* description
* hotspots
* visibility
* projectId
* userId

Atualizar apenas:

* previewUrl
* originalUrl
* storagePath
* sizeBytes
* width
* height
* originalFileType
* optimizedFileType

---

# Mobile

## Página pública do projeto

Clicar na capa deve abrir a primeira imagem do projeto no viewer.

---

## Viewer mobile

* Remover controles visuais de zoom e fullscreen
* Exibir no rodapé:
  * nome do projeto
  * nome da imagem

---

# Qualidade

Se resolução inferior à recomendada:

Exibir aviso:

"A qualidade da imagem pode não proporcionar a melhor experiência de visualização."
