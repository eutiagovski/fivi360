/** @typedef {'private' | 'shared' | 'public'} ProjectVisibility */

export const VISIBILITY_OPTIONS = [
  {
    value: "private",
    label: "Privado",
    description: "Só você acessa",
  },
  {
    value: "shared",
    label: "Compartilhado",
    description: "Acessível por link",
  },
  {
    value: "public",
    label: "Público",
    description: "Acessível por link e aparece no portfólio público",
  },
];

/**
 * @param {ProjectVisibility | string} visibility
 * @returns {string}
 */
export function visibilityToLabel(visibility) {
  const option = VISIBILITY_OPTIONS.find((item) => item.value === visibility);
  return option?.label ?? "Privado";
}

/**
 * @param {string} label
 * @returns {ProjectVisibility}
 */
export function labelToVisibility(label) {
  const option = VISIBILITY_OPTIONS.find((item) => item.label === label);
  return option?.value ?? "private";
}

/**
 * @param {ProjectVisibility | string} visibility
 * @returns {boolean}
 */
export function isPubliclyAccessible(visibility) {
  return visibility === "shared" || visibility === "public";
}

/** Opções de visibilidade para imagens (sem "public"). */
export const IMAGE_VISIBILITY_OPTIONS = VISIBILITY_OPTIONS.filter(
  (option) => option.value !== "public",
);

/**
 * @returns {typeof IMAGE_VISIBILITY_OPTIONS}
 */
export function getImageVisibilityOptions() {
  return IMAGE_VISIBILITY_OPTIONS;
}

/**
 * Opções de visibilidade conforme o plano (Starter oculta "public").
 *
 * @param {boolean} publicVisibilityEnabled
 * @returns {typeof VISIBILITY_OPTIONS}
 */
export function getVisibilityOptionsForPlan(publicVisibilityEnabled) {
  if (publicVisibilityEnabled) {
    return VISIBILITY_OPTIONS;
  }

  return VISIBILITY_OPTIONS.filter((option) => option.value !== "public");
}

/**
 * @param {ProjectVisibility | string} visibility
 * @returns {boolean}
 */
export function isImageShared(visibility) {
  return visibility === "shared" || visibility === "public";
}
