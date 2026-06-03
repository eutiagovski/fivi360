# FIVI360 — Architecture

# Stack

Frontend:

* React
* Vite
* React Router

Backend:

* Firebase

---

# Firebase

## Authentication

* Email/Senha
* Google

---

## Firestore

Coleções:

```text
users
slugs
projects
images
```

---

# Slugs

Registro único de endereços públicos do portfólio:

```text
slugs/{slug}
```

```ts
SlugRegistry {
  uid
  createdAt
}
```

* O ID do documento é o slug normalizado (`a-z`, `0-9`, `-`).
* Garante unicidade global — dois usuários não podem usar o mesmo slug.
* Resolução da rota pública `/u/:slug`: `getDoc(slugs/{slug})` → `uid` → projetos do usuário.

Alteração de slug (Settings):

1. Verificar `slugs/{novoSlug}` — bloquear se pertencer a outro usuário.
2. Remover `slugs/{slugAntigo}` se existir e pertencer ao usuário.
3. Criar `slugs/{novoSlug}`.
4. Atualizar `users/{uid}.publicSlug`.

Operação atômica via transação Firestore.

---

# Users

```ts
User {
  id
  name
  email
  companyName
  companyLogo
  plan
  publicSlug
  portfolioEnabled
  createdAt
}
```

---

# Projects

```ts
Project {
  id
  userId
  title
  description
  clientName
  visibility
  coverImage
  createdAt
  updatedAt
}
```

`clientName` representa o nome do cliente, incorporadora ou proprietário do projeto.

---

# Visibilidade

Valores permitidos:

```ts
private   // privado
shared    // compartilhado por link
public    // público — aparece no portfólio
```

Aplicável a projetos e imagens.

---

# Images

```ts
Image {
  id
  userId
  projectId
  title
  description
  visibility
  previewUrl
  originalUrl
  storagePath
  sizeBytes
  width
  height
  originalFileType
  optimizedFileType
  createdAt
}
```

---

# Hotspots

```ts
Hotspot {
  id
  imageId
  type
  pitch
  yaw
  title
  description
  targetImageId
}
```

---

# Upload de Imagem

Fluxo via modal de preview:

1. Usuário seleciona imagem
2. Sistema carrega prévia no modal
3. Usuário define nome (title)
4. Usuário confirma upload
5. Exibir loading durante carregamento e salvamento

Componente sugerido: modal reutilizável com preview, campo de nome e estados de loading.

---

# Substituir Imagem

Permitir trocar o arquivo da imagem sem perder metadados.

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

## Viewer mobile

* Remover controles visuais de zoom e fullscreen
* Exibir no rodapé:
  * nome do projeto
  * nome da imagem

---

# Storage

Estrutura:

```text
users/{userId}/images

users/{userId}/projects/{projectId}
```

---

# Estrutura Frontend

```text
src

components
pages
services
contexts
hooks
utils
```

---

# Pages

```text
/
login
register
forgot-password

dashboard
projects
project-detail
images
viewer

plans
settings

help
terms
privacy

portfolio-public   → /u/:slug (futuro)
share-project
share-image
```
