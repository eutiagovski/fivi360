export const DEFAULT_SITE_TITLE =
  "FIVI360 | Apresente seus projetos de forma imersiva e profissional";

export const DEFAULT_SITE_DESCRIPTION =
  "Plataforma para arquitetos e designers apresentarem projetos imersivos, hotspots, compartilhamento por link e portfólio online. Comece grátis.";

const PORTFOLIO_TITLE_SUFFIX = "Portfólio Público";

/**
 * Nome público do escritório/usuário (companyName > displayName).
 *
 * @param {{ companyName?: string, displayName?: string } | null | undefined} profile
 * @returns {string}
 */
export function resolvePublicDisplayName(profile) {
  return profile?.companyName?.trim() || profile?.displayName?.trim() || "";
}

/**
 * @param {{ companyName?: string, displayName?: string } | null | undefined} profile
 * @returns {string}
 */
export function buildPortfolioTitle(profile) {
  const name = resolvePublicDisplayName(profile);
  return name ? `${name} | ${PORTFOLIO_TITLE_SUFFIX}` : PORTFOLIO_TITLE_SUFFIX;
}

/**
 * @param {{ companyName?: string, displayName?: string, bio?: string } | null | undefined} profile
 * @returns {string}
 */
export function buildPortfolioDescription(profile) {
  const bio = profile?.bio?.trim();
  if (bio) {
    return bio;
  }

  const name = resolvePublicDisplayName(profile);
  if (name) {
    return `Conheça os projetos de ${name} em visualização 360°.`;
  }

  return "Conheça projetos em visualização 360° no FIVI360.";
}

/**
 * @param {{ title?: string } | null | undefined} project
 * @param {{ companyName?: string, displayName?: string } | null | undefined} owner
 * @returns {string}
 */
export function buildProjectTitle(project, owner) {
  const projectName = project?.title?.trim() || "Projeto";
  const office = resolvePublicDisplayName(owner);

  return office ? `${projectName} | ${office}` : projectName;
}

/**
 * @param {{ title?: string, description?: string } | null | undefined} project
 * @param {{ companyName?: string, displayName?: string } | null | undefined} owner
 * @returns {string}
 */
export function buildProjectDescription(project, owner) {
  const description = project?.description?.trim();
  if (description) {
    return description;
  }

  const projectName = project?.title?.trim() || "este projeto";
  const office = resolvePublicDisplayName(owner);

  if (office) {
    return `Explore ${projectName} por ${office} em visualização 360°.`;
  }

  return `Explore ${projectName} em visualização 360°.`;
}

/**
 * @param {{ title?: string } | null | undefined} image
 * @param {{ companyName?: string, displayName?: string } | null | undefined} owner
 * @returns {string}
 */
export function buildImageTitle(image, owner) {
  const imageName = image?.title?.trim() || "Imagem 360°";
  const office = resolvePublicDisplayName(owner);

  return office ? `${imageName} | ${office}` : imageName;
}

/**
 * @param {{ title?: string } | null | undefined} image
 * @param {{ companyName?: string, displayName?: string } | null | undefined} owner
 * @returns {string}
 */
export function buildImageDescription(image, owner) {
  const imageName = image?.title?.trim() || "esta imagem";
  const office = resolvePublicDisplayName(owner);

  if (office) {
    return `Visualize ${imageName} em 360° por ${office}.`;
  }

  return `Visualize ${imageName} em visualização 360°.`;
}
