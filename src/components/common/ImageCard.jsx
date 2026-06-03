import { Link } from 'react-router-dom';
import {
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  Share2,
  FolderPlus,
  FolderOutput,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ImageCard = ({
  image,
  href,
  variant = 'private',
  isMenuOpen = false,
  onMenuToggle,
  onEdit,
  onReplace,
  onShare,
  onAddToProject,
  onMoveToLoose,
  onDelete,
  dataTestId,
}) => {
  if (variant === 'public') {
    return (
      <Link
        to={href}
        data-testid={dataTestId}
        className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden card-hover"
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover image-zoom-hover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white rounded-full">
              <ExternalLink size={20} className="text-black" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-white">{image.name}</h3>
        </div>
      </Link>
    );
  }

  const handleMenuOpenChange = (open) => {
    if (open !== isMenuOpen) {
      onMenuToggle?.();
    }
  };

  const menuItemClass =
    'gap-3 rounded-lg px-4 py-3 text-sm text-zinc-300 cursor-pointer focus:bg-zinc-800 focus:text-white';

  return (
    <div
      data-testid={dataTestId}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden card-hover group relative"
    >
      <Link to={href} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover image-zoom-hover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-white break-words">{image.name}</h3>
        </div>
      </Link>

      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid={`image-menu-${image.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            className="w-48 min-w-0 max-w-[min(12rem,calc(100vw-2rem))] rounded-xl border-zinc-800 bg-zinc-900 p-1 text-zinc-300 shadow-xl z-50"
            data-testid={`image-menu-content-${image.id}`}
          >
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link to={href} data-testid={`image-view-${image.id}`}>
                <ExternalLink size={16} />
                Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={menuItemClass}
              onSelect={() => onEdit?.()}
              data-testid={`image-edit-${image.id}`}
            >
              <Edit2 size={16} />
              Editar
            </DropdownMenuItem>
            {onReplace && (
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => onReplace?.()}
                data-testid={`image-replace-${image.id}`}
              >
                <RefreshCw size={16} />
                Substituir arquivo
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => onShare?.()}
                data-testid={`image-share-${image.id}`}
              >
                <Share2 size={16} />
                Compartilhar
              </DropdownMenuItem>
            )}
            {onAddToProject && (
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => onAddToProject?.()}
                data-testid={`image-add-to-project-${image.id}`}
              >
                <FolderPlus size={16} />
                Adicionar a projeto
              </DropdownMenuItem>
            )}
            {onMoveToLoose && (
              <DropdownMenuItem
                className={menuItemClass}
                onSelect={() => onMoveToLoose?.()}
                data-testid={`image-move-to-loose-${image.id}`}
              >
                <FolderOutput size={16} />
                Mover para imagens soltas
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className={`${menuItemClass} text-red-400 focus:text-red-300`}
              onSelect={() => onDelete?.()}
              data-testid={`image-delete-${image.id}`}
            >
              <Trash2 size={16} />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
