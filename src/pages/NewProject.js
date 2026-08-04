import { Navigate } from 'react-router-dom';

/**
 * Compatibilidade temporária: /projects/new redireciona para a listagem.
 * A criação acontece via CreateProjectDialog em /projects e /dashboard.
 * Abertura do modal por query string não é obrigatória nesta sprint.
 */
export const NewProject = () => {
  return <Navigate to="/projects" replace />;
};
