import { ImageIcon } from 'lucide-react';

const VARIANT_CLASSES = {
  card: 'h-48',
  detail: 'h-64 rounded-xl',
  hero: 'h-96 rounded-2xl',
};

/**
 * Área de capa vazia quando o projeto ainda não tem imagens.
 * A capa será definida automaticamente pela primeira imagem (Sprint 3.2).
 */
export const ProjectCoverPlaceholder = ({
  variant = 'card',
  label = 'Sem imagens',
  className = '',
  dataTestId,
}) => {
  const iconSize = variant === 'card' ? 24 : 32;

  return (
    <div
      className={`w-full bg-zinc-800/80 border border-zinc-800 flex flex-col items-center justify-center ${VARIANT_CLASSES[variant]} ${className}`}
      data-testid={dataTestId}
    >
      <ImageIcon size={iconSize} className="text-zinc-600 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
};

/**
 * @param {string | undefined | null} coverImage
 * @returns {boolean}
 */
export function hasProjectCover(coverImage) {
  return Boolean(coverImage?.trim());
}
