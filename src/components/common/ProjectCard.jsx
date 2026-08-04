import { Link } from 'react-router-dom';
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  hasProjectCover,
  ProjectCoverPlaceholder,
} from '@/components/common/ProjectCoverPlaceholder';

export const ProjectCard = ({
  project,
  href,
  showMenu = false,
  isMenuOpen = false,
  onMenuToggle,
  onEdit,
  onDelete,
  dataTestId,
}) => {
  const hasCover = hasProjectCover(project.cover);

  const cardBody = (
    <>
      <div className="relative h-48 overflow-hidden">
        {hasCover ? (
          <img
            src={project.cover}
            alt={project.name}
            className="w-full h-full object-cover image-zoom-hover"
          />
        ) : (
          <ProjectCoverPlaceholder variant="card" dataTestId={`${dataTestId}-cover-empty`} />
        )}
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-xs text-white">
          {project.status}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium text-white mb-2">{project.name}</h3>
        <p className="text-sm text-zinc-400">{project.images} imagens</p>
      </div>
    </>
  );

  if (!showMenu) {
    return (
      <Link
        to={href}
        data-testid={dataTestId}
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden card-hover group"
      >
        {cardBody}
      </Link>
    );
  }

  return (
    <div
      data-testid={dataTestId}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden card-hover group relative"
    >
      <Link to={href} className="block">
        {cardBody}
      </Link>

      <div className="absolute bottom-4 right-4">
        <button
          data-testid={`project-menu-${project.id}`}
          onClick={(e) => {
            e.preventDefault();
            onMenuToggle?.();
          }}
          className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <MoreVertical size={18} />
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl z-10">
            <Link
              to={href}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Eye size={16} />
              Ver projeto
            </Link>
            {onEdit ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
                data-testid={`edit-project-menu-${project.id}`}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Pencil size={16} />
                Editar
              </button>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete?.();
              }}
              data-testid={`delete-project-menu-${project.id}`}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
