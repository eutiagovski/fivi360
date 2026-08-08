/**
 * Copy e âncoras da LP de acesso antecipado.
 */

export const ACCESS_EARLY_FORM_ANCHOR = "acesso-antecipado";

export const ACCESS_EARLY_SEO = Object.freeze({
  title: "FIVI360 | Apresentações 360° para Arquitetura",
  description:
    "Transforme imagens 360° em experiências interativas para apresentar e compartilhar seus projetos de arquitetura.",
});

export const ACCESS_EARLY_CONTENT = Object.freeze({
  hero: {
    headline: "Apresente seus projetos de um jeito que o cliente possa explorar.",
    subheadline:
      "Transforme imagens 360° em experiências interativas para apresentar, compartilhar e incorporar seus projetos.",
    cta: "Quero acesso antecipado",
    microcopy:
      "Entre para a lista de pré-lançamento e tenha acesso a uma condição especial.",
  },
  video: {
    title: "Veja como funciona",
    subtitle:
      "Conheça em poucos minutos como o FIVI360 transforma uma apresentação estática em uma experiência interativa.",
    placeholder: "Vídeo de apresentação em breve.",
  },
  demo: {
    title: "Experimente você mesmo",
    subtitle:
      "Não precisa imaginar. Clique, arraste e explore um projeto como seu cliente exploraria.",
    loading: "Carregando experiência 360°...",
    error: "Não foi possível carregar a demonstração agora.",
    ctaAfter: "Quero acesso antecipado",
  },
  benefits: {
    title: "Por que o FIVI360",
    items: [
      {
        id: "explore",
        title: "Explore",
        copy: "Permita que seu cliente navegue pelos ambientes e entenda o projeto de forma muito mais intuitiva.",
      },
      {
        id: "share",
        title: "Compartilhe",
        copy: "Envie seus projetos por link e apresente sua proposta de qualquer lugar.",
      },
      {
        id: "embed",
        title: "Incorpore",
        copy: "Adicione a experiência 360° ao seu próprio website e transforme seu portfólio em uma apresentação interativa.",
        note: "Disponível no plano Professional.",
      },
    ],
  },
  howItWorks: {
    title: "Do render à experiência interativa em poucos passos.",
    steps: [
      {
        id: "01",
        title: "Envie suas imagens 360°",
        copy: "Faça upload dos panoramas do seu projeto e organize os ambientes.",
      },
      {
        id: "02",
        title: "Conecte seus ambientes",
        copy: "Crie hotspots e permita a navegação entre diferentes ambientes do projeto.",
      },
      {
        id: "03",
        title: "Compartilhe com seu cliente",
        copy: "Envie um link ou incorpore a experiência no seu site.",
      },
    ],
  },
  transition: {
    title: "Quer apresentar seus próprios projetos assim?",
    subtitle: "Entre para a lista de acesso antecipado do FIVI360.",
    cta: "Quero acesso antecipado",
  },
  conversion: {
    title: "Seja um dos primeiros a usar o FIVI360.",
    subtitle:
      "Cadastre-se para receber acesso antecipado e uma condição especial de lançamento.",
    perk: "Benefício exclusivo para participantes do pré-lançamento.",
  },
  footer: {
    tagline: "Apresentações 360° para arquitetura e interiores.",
  },
});

/**
 * Scroll suave até o formulário de conversão.
 */
export function scrollToAccessEarlyForm() {
  if (typeof document === "undefined") {
    return;
  }

  document
    .getElementById(ACCESS_EARLY_FORM_ANCHOR)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
