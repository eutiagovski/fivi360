/**
 * Seções da página de Configurações (RC-SETTINGS-UX-REFINE-1).
 * Apenas seções com conteúdo já existente na página.
 */

/** @typedef {'profile' | 'office' | 'portfolio'} SettingsSectionId */

/**
 * @type {ReadonlyArray<{
 *   id: SettingsSectionId,
 *   label: string,
 *   title: string,
 *   description: string,
 * }>}
 */
export const SETTINGS_SECTIONS = Object.freeze([
  {
    id: 'profile',
    label: 'Perfil',
    title: 'Perfil',
    description:
      'Atualize suas informações pessoais e os dados usados na sua conta.',
  },
  {
    id: 'office',
    label: 'Escritório',
    title: 'Escritório',
    description:
      'Identidade do escritório exibida no seu portfólio e materiais públicos.',
  },
  {
    id: 'portfolio',
    label: 'Portfólio público',
    title: 'Portfólio público',
    description:
      'Endereço, redes sociais e visibilidade da sua página pública.',
  },
]);

/** @type {SettingsSectionId} */
export const DEFAULT_SETTINGS_SECTION = 'profile';

/**
 * @param {string | null | undefined} value
 * @returns {SettingsSectionId}
 */
export function resolveSettingsSection(value) {
  const match = SETTINGS_SECTIONS.find((section) => section.id === value);
  return match?.id ?? DEFAULT_SETTINGS_SECTION;
}
