# FIVI360 — Product Definition

## Visão Geral

O FIVI360 é uma plataforma SaaS para arquitetos, designers de interiores, incorporadoras, construtoras e profissionais criativos apresentarem projetos através de imagens panorâmicas 360°.

O objetivo é transformar imagens estáticas em experiências imersivas, permitindo navegação intuitiva, compartilhamento por link e criação de portfólios públicos.

---

# Público-alvo

* Arquitetos
* Designers de interiores
* Escritórios de arquitetura
* Construtoras
* Incorporadoras
* Profissionais de visualização arquitetônica

---

# Problema

Atualmente projetos são apresentados através de:

* Imagens estáticas
* PDFs
* Apresentações

Esses formatos não permitem ao cliente explorar o ambiente livremente.

---

# Solução

O FIVI360 permite:

* Upload de imagens panorâmicas 360°
* Organização por projetos
* Navegação imersiva
* Hotspots interativos
* Compartilhamento por link
* Portfólio público

---

# Visibilidade

Projetos e imagens possuem três níveis:

| Valor   | Conceito                    |
| ------- | --------------------------- |
| private | privado                     |
| shared  | compartilhado por link      |
| public  | público — aparece no portfólio |

---

# MVP

## Autenticação

* Cadastro
* Login
* Logout
* Recuperação de senha
* Login Google

## Dashboard

* Resumo de projetos
* Resumo de imagens
* Imagens recentes
* Projetos recentes

## Projetos

* Criar projeto
* Editar projeto
* Excluir projeto
* Compartilhar projeto
* Campo `clientName` — nome do cliente, incorporadora ou proprietário

## Imagens

* Upload via modal de preview
* Renomear
* Substituir arquivo (preservando metadados e hotspots)
* Excluir
* Compartilhar

### Upload

1. Usuário seleciona imagem
2. Sistema carrega prévia
3. Usuário define nome
4. Usuário confirma upload
5. Loading durante carregamento e salvamento

### Substituir imagem

Permite trocar o arquivo sem perder title, description, hotspots, visibility, projectId e userId.

## Viewer

* Visualização 360°
* Fullscreen (desktop)
* Zoom (desktop)
* Compartilhamento

### Mobile

* Sem controles visuais de zoom e fullscreen
* Rodapé com nome do projeto e nome da imagem

## Hotspots

* Informativos
* Navegação entre imagens

## Portfólio Público

* URL oficial: `/u/:slug` (ex.: `/u/tiagomachado`)
* Exibição de projetos públicos
* Clicar na capa abre a primeira imagem do projeto (mobile)
* Slug único registrado na coleção `slugs/{slug}`

---

# Diferenciais

* Interface simples
* Compartilhamento rápido
* Navegação entre ambientes
* Portfólio online
* Experiência premium

---

# Roadmap Futuro

* Stripe
* Analytics
* IA para melhoria de imagens
* Tours avançados
* Mini mapa
* Marca branca
* Domínio personalizado
