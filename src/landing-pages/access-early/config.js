/**
 * Configuração da Landing Page de acesso antecipado.
 *
 * URLs sociais vazias → CTAs visíveis mas disabled (sem links quebrados).
 *
 * `ACCESS_EARLY_CAMPAIGN.id` é o identificador oficial de deduplicação.
 * Não usar `utm_campaign` da URL como campaignId.
 */

export const ACCESS_EARLY_CAMPAIGN = Object.freeze({
  id: "prelaunch_2026",
});

export const ACCESS_EARLY_SUCCESS_PATH = "/lp/acesso-antecipado/sucesso";

export const ACCESS_EARLY_CONFIG = {
  videoUrl: "",
  whatsappGroupUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  campaignId: ACCESS_EARLY_CAMPAIGN.id,
};

/**
 * Opções de profissão do formulário (valor enviado = label, exceto Outro).
 * Em "Outro", o texto complementar vira o `profession` final.
 */
export const ACCESS_EARLY_PROFESSIONS = Object.freeze([
  { id: "arquiteto", label: "Arquiteto(a)" },
  { id: "designer_interiores", label: "Designer de interiores" },
  { id: "escritorio", label: "Escritório de arquitetura" },
  { id: "renderista", label: "Renderista / Artista 3D" },
  { id: "estudante", label: "Estudante de Arquitetura, Design ou curso superior relacionado" },
  { id: "outro", label: "Outro" },
]);

export const ACCESS_EARLY_PROFESSION_OTHER_ID = "outro";
