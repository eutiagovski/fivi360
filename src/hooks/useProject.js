import { useCallback, useEffect, useState } from "react";
import { getOwnedOrAccessibleProject } from "@/services/projects/projectService";

/**
 * Carrega um projeto pelo ID da rota interna, com validação de ownership/membership.
 * Visibilidade pública não concede acesso.
 *
 * @param {string | undefined} projectId
 * @param {string | undefined} userId
 */
export function useProject(projectId, userId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!projectId || !userId) {
      setProject(null);
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Refetch silencioso: não alterna `loading` para evitar desmontar
    // diálogos abertos (ex.: compartilhar / prévia do Embed).
    setError(null);

    try {
      const data = await getOwnedOrAccessibleProject(projectId, userId);

      if (!data) {
        setProject(null);
        setNotFound(true);
      } else {
        setProject(data);
        setNotFound(false);
      }
    } catch (err) {
      setError(err);
      setProject(null);
    }
  }, [projectId, userId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId || !userId) {
        if (!cancelled) {
          setProject(null);
          // Sem userId: aguarda auth (ProtectedRoute). Sem projectId: not found.
          setNotFound(!projectId);
          setLoading(Boolean(projectId) && !userId);
          if (!projectId) {
            setLoading(false);
          }
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
        setNotFound(false);
        // Evita flash de dados de um projeto anterior ao trocar o ID.
        setProject(null);
      }

      try {
        const data = await getOwnedOrAccessibleProject(projectId, userId);

        if (cancelled) {
          return;
        }

        if (!data) {
          setProject(null);
          setNotFound(true);
        } else {
          setProject(data);
          setNotFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setProject(null);
          setNotFound(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId, userId]);

  const patchProject = useCallback((updates) => {
    setProject((current) => (current ? { ...current, ...updates } : current));
  }, []);

  return { project, loading, error, notFound, refetch, patchProject };
}
