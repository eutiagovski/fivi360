import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getProjectsByUserId,
  mapProjectToCard,
} from "@/services/projects/projectService";

/**
 * Lista projetos do usuário autenticado.
 */
export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getProjectsByUserId(user.uid);
      setProjects(data);
    } catch (err) {
      setError(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.uid) {
        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await getProjectsByUserId(user.uid);
        if (!cancelled) {
          setProjects(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const cardProjects = useMemo(
    () => projects.map(mapProjectToCard),
    [projects],
  );

  return { projects, cardProjects, loading, error, refetch };
}
