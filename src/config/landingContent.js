/**
 * Copy estático centralizado da Landing Page.
 * Fonte: docs/LANDING_REBUILD.md §7.3, §7.1.1, §7.4
 */

export const LANDING_FEATURES_SECTION = {
  title: "Recursos",
  subtitle:
    "Tudo o que você precisa para apresentar projetos em 360° — do upload ao compartilhamento.",
};

export const LANDING_FEATURES = [
  {
    icon: "Orbit",
    title: "Viewer 360° imersivo",
    description:
      "Navegação fluida com Pannellum — zoom e tela cheia no desktop.",
  },
  {
    icon: "MapPin",
    title: "Hotspots interativos",
    description:
      "Pontos de informação e saltos entre ambientes (Professional).",
  },
  {
    icon: "FolderKanban",
    title: "Projetos organizados",
    description: "Capa, descrição, cliente e galeria de panoramas.",
  },
  {
    icon: "Share2",
    title: "Compartilhamento instantâneo",
    description: "Links públicos limpos, sem barreiras para o cliente.",
  },
  {
    icon: "Briefcase",
    title: "Portfólio online",
    description:
      "Sua página em fivi360.com/u/seu-nome com projetos públicos.",
  },
  {
    icon: "Eye",
    title: "Controle de visibilidade",
    description: "Privado, compartilhado por link ou público no portfólio.",
  },
  {
    icon: "Upload",
    title: "Upload inteligente",
    description:
      "Preview antes de enviar; substitua arquivos sem perder hotspots.",
  },
  {
    icon: "LayoutDashboard",
    title: "Dashboard completo",
    description: "Métricas de projetos, imagens, links e armazenamento.",
  },
];

export const LANDING_SHOWCASE = {
  title: "Experimente uma apresentação 360°",
  subtitle:
    "Navegue por um projeto real, explore hotspots e veja como seus clientes podem visualizar ambientes de forma interativa.",
  fallbackMessage: "Demonstração temporariamente indisponível.",
  openProjectLabel: "Abrir projeto demo",
  portfolioLabel: "Ver portfólio FIVI360",
};

export const LANDING_HOW_IT_WORKS_SECTION = {
  title: "Como funciona",
  subtitle: "Do cadastro ao compartilhamento em quatro passos simples.",
};

export const LANDING_HOW_IT_WORKS_STEPS = [
  {
    title: "Cadastre-se",
    description: "Crie sua conta gratuita em menos de um minuto.",
  },
  {
    title: "Suba seus panoramas",
    description: "Organize por projeto e adicione capas.",
  },
  {
    title: "Enriqueça com hotspots",
    description: "Guias informativos e tours entre cenas.",
  },
  {
    title: "Compartilhe",
    description: "Envie um link ou ative seu portfólio público.",
  },
];

export const LANDING_PORTFOLIO = {
  title: "Seu portfólio profissional, sempre online",
  description:
    "Escolha quais projetos são públicos e tenha uma página dedicada com sua marca. Clientes veem apenas o essencial — sem distrações.",
  bullets: [
    "Slug personalizado",
    "Páginas limpas sem painel admin",
    "Compartilhamento de projetos e imagens individuais",
  ],
  portfolioCtaLabel: "Ver portfólio FIVI360",
  registerCtaLabel: "Criar meu portfólio",
};

export const LANDING_PRICING_SECTION = {
  title: "Planos e preços",
  subtitle: "Comece grátis e evolua conforme sua demanda cresce.",
  footnote:
    "Cobrança online em breve. Limites do plano Starter já estão ativos.",
};

/** Bullets de marketing por plano (complementa PLAN_LIMITS na landing). */
export const LANDING_PRICING_MARKETING = {
  starter: {
    priceLabel: "R$ 0",
    featureBullets: [
      "3 projetos",
      "10 imagens",
      "50 MB",
      "Compartilhamento por link",
    ],
    ctaLabel: "Começar grátis",
    ctaTo: "/register",
    ctaDisabled: false,
    highlighted: false,
  },
  professional: {
    priceLabel: "R$ 49",
    featureBullets: [
      "Projetos ilimitados",
      "Imagens ilimitadas",
      "500 MB",
      "Hotspots interativos",
      "Portfólio público",
    ],
    ctaLabel: "Em breve",
    ctaDisabled: true,
    highlighted: true,
    badge: "Recomendado",
  },
  enterprise: {
    priceLabel: "R$ 149",
    featureBullets: [
      "Tudo do Professional",
      "5 GB",
      "Múltiplos usuários",
      "White label",
      "Suporte prioritário",
    ],
    ctaLabel: "Falar com a gente",
    ctaDisabled: true,
    highlighted: false,
  },
};

export const LANDING_FAQ_SECTION = {
  title: "Perguntas frequentes",
  subtitle: "Tire suas dúvidas antes de criar sua conta.",
};

export const LANDING_FAQ_ITEMS = [
  {
    question: "O que é uma imagem panorâmica 360°?",
    answer:
      "É um formato equirectangular que permite olhar em todas as direções, como se você estivesse dentro do ambiente.",
  },
  {
    question: "Preciso de equipamento especial?",
    answer:
      "Você pode usar uma câmera 360° ou exportar renders equirectangulares de softwares de visualização e arquitetura.",
  },
  {
    question: "O plano gratuito tem limites?",
    answer:
      "Sim: 3 projetos, 10 imagens e 50 MB de armazenamento. Consulte a tabela de planos acima para comparar.",
  },
  {
    question: "O que são hotspots?",
    answer:
      "São marcadores no viewer com texto informativo ou link para outra cena. Disponíveis no plano Professional.",
  },
  {
    question: "Meus clientes precisam de conta?",
    answer:
      "Não. Links compartilhados e o portfólio público são acessíveis sem login.",
  },
  {
    question: "Posso substituir uma imagem?",
    answer:
      "Sim. Você pode trocar o arquivo sem perder nome, descrição ou hotspots já configurados.",
  },
  {
    question: "Posso compartilhar apenas uma imagem?",
    answer:
      "Sim. Cada panorama pode ter um link público próprio, independente do projeto ou do portfólio.",
  },
  {
    question: "O FIVI360 funciona no celular?",
    answer:
      "Sim. O viewer é otimizado para mobile, com controles adaptados à tela touch.",
  },
  {
    question: "Como funciona o portfólio público?",
    answer:
      "Ative em Configurações, defina seu slug personalizado e marque os projetos que deseja exibir publicamente.",
  },
];

export const LANDING_FINAL_CTA = {
  title: "Pronto para impressionar seus clientes?",
  description:
    "Crie sua conta gratuita e publique seu primeiro projeto hoje.",
  buttonLabel: "Começar Gratuitamente",
  footnote: "Sem cartão de crédito.",
};
