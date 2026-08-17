import { Navigate } from 'react-router-dom';

/** Compat: a Central de Ajuda pública vive em /ajuda. */
export const Help = () => {
  return <Navigate to="/ajuda" replace />;
};
