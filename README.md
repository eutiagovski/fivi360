# FIVI360 - Plataforma SaaS para Imagens Panorâmicas 360°

## 📖 Sobre o Projeto

FIVI360 é uma interface SaaS moderna e minimalista para arquitetos e designers apresentarem projetos com imagens panorâmicas 360°. O sistema permite organizar projetos, adicionar imagens e compartilhar experiências imersivas por link.

## ✨ Características Principais

### Design
- **Tema Escuro Premium**: Paleta de cores preto e cinza (#050505, #121212, #1A1A1A)
- **Tipografia Elegante**: 
  - Outfit para títulos (font-light, tracking-tighter)
  - Manrope para corpo de texto
- **Minimalista e Futurista**: Interface limpa com espaçamento generoso
- **Responsivo**: Otimizado para desktop e mobile

### Funcionalidades

#### 🏠 Dashboard
- Métricas em cards (Projetos, Imagens, Links, Armazenamento)
- Lista de projetos recentes
- Botão de criação rápida de projetos

#### 📁 Projetos
- Visualização em grid de cards
- Status do projeto (Público, Privado, Não listado)
- Ações: visualizar, editar, excluir
- Criação de novos projetos com upload de capa

#### 📄 Detalhes do Projeto
- Informações do projeto (nome, descrição, capa)
- Galeria de imagens (visualização em grid ou lista)
- Compartilhamento via link
- Adicionar/remover imagens

#### 🌐 Visualizador 360°
- Interface imersiva full-screen
- Controles de zoom (50% - 200%)
- Modo fullscreen
- Navegação intuitiva

#### 🔗 Compartilhamento Público
- Páginas públicas sem elementos administrativos
- Design limpo e focado na experiência
- Branding "Powered by FIVI360"

#### ⚙️ Configurações
- Perfil do usuário
- Informações do escritório
- Upload de logo
- Link externo (site/Instagram)

#### 💳 Planos
- 3 tiers: Gratuito, Profissional, Enterprise
- Visualização de consumo atual
- Gráficos de uso por recurso

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework JavaScript
- **React Router DOM** - Navegação
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Axios** - Requisições HTTP

### Backend (Preparado para integração futura)
- **FastAPI** - Framework Python
- **MongoDB** - Banco de dados
- **Motor** - Driver assíncrono MongoDB

## 📱 Páginas Disponíveis

### Rotas Privadas (Com Sidebar)
- `/dashboard` - Dashboard principal
- `/projects` - Lista de projetos
- `/projects/new` - Criar novo projeto
- `/projects/:id` - Detalhes do projeto
- `/plan` - Planos e consumo
- `/settings` - Configurações

### Rotas Públicas (Sem Sidebar)
- `/viewer/:projectId/:imageId` - Visualizador 360° privado
- `/share/project/:id` - Projeto público compartilhado
- `/share/image/:projectId/:imageId` - Imagem pública compartilhada

## 🎨 Paleta de Cores

```css
Background: #050505
Surface: #121212
Surface Secondary: #1A1A1A
Border: #27272A
Border Hover: #3F3F46
Text Primary: #FFFFFF
Text Secondary: #A1A1AA
Text Muted: #71717A
Primary: #FFFFFF
Primary Foreground: #000000
```

## 🚀 Próximos Passos (Integração via Cursor)

1. **Firebase Storage** - Upload real de imagens
2. **Firebase Authentication** - Sistema de login
3. **Pannellum** - Visualizador 360° interativo real
4. **Mercado Pago** - Assinaturas recorrentes
5. **Backend APIs** - CRUD completo de projetos e imagens

## 📦 Estrutura do Projeto

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   ├── ProjectDetail.js
│   │   │   ├── NewProject.js
│   │   │   ├── Viewer.js
│   │   │   ├── Settings.js
│   │   │   ├── Plan.js
│   │   │   ├── PublicProject.js
│   │   │   └── PublicImage.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
└── backend/
    └── server.py
```

## 📝 Notas de Implementação

- **Dados Mockados**: Todos os dados são mockados para demonstração visual
- **Data-testid**: Todos os elementos interativos possuem data-testid para testes
- **Microinterações**: Hover states, transitions e animações sutis
- **Acessibilidade**: Navegação por teclado e estrutura semântica

## 🎯 Objetivo

MVP simples, limpo e profissional focado na experiência visual e usabilidade, pronto para integração com backend e serviços externos.