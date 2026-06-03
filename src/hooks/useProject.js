import { useCallback, useEffect, useState } from "react";
import { getProjectById } from "@/services/projects/projectService";

/**
 * Carrega um projeto pelo ID da rota.
 *
 * @param {string | undefined} projectId
 */
export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await getProjectById(projectId);

      if (!data) {
        setProject(null);
        setNotFound(true);
      } else {
        setProject(data);
      }
    } catch (err) {
      setError(err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        if (!cancelled) {
          setProject(null);
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
        setNotFound(false);
      }

      try {
        const data = await getProjectById(projectId);

        if (cancelled) {
          return;
        }

        if (!data) {
          setProject(null);
          setNotFound(true);
        } else {
          setProject(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setProject(null);
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
  }, [projectId]);

  const patchProject = useCallback((updates) => {
    setProject((current) => (current ? { ...current, ...updates } : current));
  }, []);

  return { project, loading, error, notFound, refetch, patchProject };
}
