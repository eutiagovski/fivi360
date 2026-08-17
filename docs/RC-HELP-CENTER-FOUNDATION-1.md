# RC-HELP-CENTER-FOUNDATION-1 — Fundação da Central de Ajuda FIVI360

**Data:** 17 de agosto de 2026  
**Escopo:** arquitetura, home, categorias, artigos, busca local, renderer, estrutura de vídeo e primeiros conteúdos  
**Restrição:** sem CMS, sem Firestore de artigos, sem admin, sem Algolia, sem YouTube, sem Cookie Banner, sem analytics novo, sem backend, sem subdomínio, sem build completo, sem deploy  

---

## 1. Arquitetura

A Central de Ajuda é um **bounded context** isolado:

```text
src/help/
  config/help.js              caminhos, SEO, e-mail, data de conteúdo
  content/
    categories.js             9 categorias
    softwareGuides.js         9 softwares de exportação
    articles/                 conteúdo estruturado (sem JSX)
  components/                 apresentação
  pages/                      home, categoria, artigo, app de rotas
  utils/                      paths, busca, SEO, blocos, factory
  index.js                    fachada pública
```

Hoje o módulo é montado no SPA em `fivi360.com.br/ajuda`.

Foi criado para migrar depois para `apps/help/` no monorepo, com destino:

**ajuda.fivi360.com.br**

Não há CMS, Firestore, Markdown runtime nem `dangerouslySetInnerHTML`. O conteúdo vive no Git, como o módulo legal.

### Isolamento

O módulo **não** importa:

- dashboard;
- billing;
- `useAuth` / AuthContext;
- project management;
- Firebase.

Reutiliza apenas peças visuais e de plataforma desacopladas: `BrandLogo`, `usePageSeo`, `cn`, `Collapsible`.

O header **não** lê estado de autenticação. Links estáticos: Voltar ao FIVI360 (`/`) e Entrar (`/login`). Isso evita acoplar a Central ao app autenticado.

---

## 2. Rotas

| Rota | Tipo | Comportamento |
|---|---|---|
| `/ajuda` | PUBLIC_ALWAYS | Home da Central |
| `/ajuda/:categorySlug` | PUBLIC_ALWAYS | Lista da categoria |
| `/ajuda/:categorySlug/:articleSlug` | PUBLIC_ALWAYS | Artigo (conteúdo dirige a URL) |
| `/help` e `/help/*` | redirect | Compatibilidade → `/ajuda` |

`/ajuda/*` usa `PublicAlwaysRoute` + `HelpCenterApp`. Não passa por `ProtectedRoute`, `GuestRoute` nem `LegalConsentGate`. Usuário autenticado **não** é redirecionado ao Dashboard.

Não existe uma rota React manual por artigo.

Links atualizados para `/ajuda`:

- rodapé da Home institucional;
- item Ajuda do header autenticado.

---

## 3. Modelo de conteúdo

Cada artigo:

```js
{
  slug,
  category,
  title,
  description,
  keywords,
  updatedAt,
  videoUrl,          // string; vazio = sem player
  status,            // "published" | "coming-soon"
  listed,            // false = fora da home/categoria (stubs de software)
  blocks,
  relatedArticles,   // slugs; sem bidirecional automático
}
```

**Conteúdo** fica em `src/help/content/`.  
**Apresentação** fica em `src/help/components/` e `pages/`.

---

## 4. Renderer

`HelpArticleBody` aceita:

- `paragraph`
- `heading`
- `list`
- `steps`
- `note`
- `tip`
- `warning`
- `image-placeholder`
- `link`
- `software-export` (bloco especial da listagem de softwares)

Inlines: texto, `emphasis`, `link`, `email`.

---

## 5. Busca

Busca **local**, no browser, sem Algolia/Firebase/backend.

Campos: `title`, `description`, `keywords`, nome da categoria.

Resultados instantâneos: título, categoria, descrição curta. Clique abre o artigo. Sem matches: mensagem amigável.

---

## 6. Categorias

1. Primeiros passos  
2. Projetos  
3. Imagens 360°  
4. Hotspots  
5. Compartilhamento  
6. Incorporação  
7. Portfólio  
8. Planos e armazenamento  
9. Conta e configurações  

---

## 7. Artigos iniciais

**39 artigos listados** + **9 guias de software em breve** = **48** no catálogo.

Visibilidade documentada conforme o produto: **Privado**, **Compartilhado**, **Público** (`private` | `shared` | `public`). Não há “unlisted”.

Hotspots: **Informação** e **Navegação** (nomenclatura do viewer).

Especificações de imagem (código):

- formatos: JPG, JPEG, PNG, WEBP;
- bloqueados: HEIC, HEIF, BMP, TIFF;
- proporção recomendada 2:1 (aviso, não bloqueio);
- resolução recomendada 3000×1500 (aviso);
- sem limite fixo por arquivo além da cota do plano;
- otimização após o envio (sem expor `originalSizeBytes`).

Planos: sem preços hardcoded; referência à [página vigente](/#precos).

Exclusão de conta: **não existe** self-service. O artigo de perfil aponta para `contato@fivi360.com.br`.

---

## 8. Vídeo

Todo artigo aceita `videoUrl`.

- vazio → não renderiza player nem placeholder;
- preenchido → área reservada no topo, **sem iframe YouTube** nesta RC.

Nenhum vídeo foi publicado agora.

---

## 9. Exportação por software

Artigo hub: `/ajuda/imagens-360/como-exportar-uma-imagem-360-do-seu-software`

Cards (todos **Em breve**):

- SketchUp + Enscape  
- SketchUp + V-Ray  
- Revit + Enscape  
- Revit + Twinmotion  
- 3ds Max + Corona  
- 3ds Max + V-Ray  
- Lumion  
- D5 Render  
- Twinmotion  

Cada guia já tem esqueleto: objetivo, câmera 360°, projeção, resolução, formato, render/export, verificação, upload, problemas comuns, vídeo tutorial. Sem passos técnicos inventados.

---

## 10. UI

- Header: FIVI360 + Central de Ajuda; Voltar ao FIVI360; Entrar  
- Home: “Como podemos ajudar?” + busca em destaque + categorias  
- Desktop: sidebar de categorias  
- Mobile: navegação compacta (collapsible)  
- Artigo: breadcrumb, categoria, título, resumo, data, vídeo opcional, conteúdo, relacionados, CTA  
- CTA: “Não encontrou o que precisava?” → `contato@fivi360.com.br`  
- 404 interno da Central (não cai no 404 genérico do app)  
- SEO via `usePageSeo` (`title` + `description`)

---

## 11. Testes

Executados (sem build completo):

- rota pública `/ajuda`
- home, categorias, busca, keyword, vazio
- artigo por slug, breadcrumb, related
- `videoUrl` vazio não renderiza iframe
- cards de software + “Em breve”
- 404 interno
- links institucionais
- isolamento do módulo
- catálogo (slugs únicos, visibilidade real)

---

## 12. Pendências

- Tutoriais de exportação por software (pesquisa e redação validada)
- Vídeos (`videoUrl` + player, sem YouTube nesta fundação)
- Imagens ilustrativas nos artigos
- Conteúdo mais profundo de recursos avançados
- CTA Entrar/Dashboard autenticado, se um gancho de auth desacoplado for criado
- Migração para `apps/help/` e `ajuda.fivi360.com.br`
- Cookie Banner / analytics da Central: fora de escopo

---

## 13. Futura migração

`src/help/` deve ser extraído para `apps/help/` com o mesmo contrato de conteúdo e rotas.

Ajustes previstos:

- `HELP_BASE_PATH` de `/ajuda` para `""` ou `/`
- host `ajuda.fivi360.com.br`
- manter o catálogo JS versionado no Git
- não introduzir dependências do app autenticado até lá

**Build completo não executado. Deploy não realizado.**
