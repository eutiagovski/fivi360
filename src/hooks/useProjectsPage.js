import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getProjectsPageByUserId,
  mapProjectToCard,
} from "@/services/projects/projectService";
import { deduplicateMergeById } from "@/utils/deduplicateById";
import { PROJECT_DELETED_EVENT } from "@/utils/dataSyncEvents";
import {
  LIST_INITIAL_PAGE_SIZE,
  LIST_LOAD_MORE_PAGE_SIZE,
} from "@/utils/paginationConstants";

/**
 * Lista paginada de projetos para /projects (updatedAt DESC).
 */
export function useProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const lastVisibleDocRef = useRef(null);

  const loadFirstPage = useCallback(async () => {
    if (!user?.uid) {
      setProjects([]);
      setHasMore(false);
      lastVisibleDocRef.current = null;
      setLoadingInitial(false);
      return;
    }

    setLoadingInitial(true);
    setError(null);

    try {
      const result = await getProjectsPageByUserId(user.uid, {
        limitCount: LIST_INITIAL_PAGE_SIZE,
      });

      setProjects(result.items);
      lastVisibleDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
      setProjects([]);
      setHasMore(false);
      lastVisibleDocRef.current = null;
    } finally {
      setLoadingInitial(false);
    }
  }, [user?.uid]);

  const loadMore = useCallback(async () => {
    if (
      !user?.uid ||
      !hasMore ||
      loadingMore ||
      loadingInitial ||
      !lastVisibleDocRef.current
    ) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const result = await getProjectsPageByUserId(user.uid, {
        limitCount: LIST_LOAD_MORE_PAGE_SIZE,
        startAfterDoc: lastVisibleDocRef.current,
      });

      setProjects((current) => deduplicateMergeById(current, result.items));
      lastVisibleDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, hasMore, loadingMore, loadingInitial]);

  const removeProject = useCallback((projectId) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
  }, []);

  useEffect(() => {
    const handleProjectDeleted = (event) => {
      const { projectId } = event.detail ?? {};

      if (!projectId) {
        return;
      }

      removeProject(projectId);
    };

    window.addEventListener(PROJECT_DELETED_EVENT, handleProjectDeleted);

    return () => {
      window.removeEventListener(PROJECT_DELETED_EVENT, handleProjectDeleted);
    };
  }, [removeProject]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) {
        if (!cancelled) {
          setProjects([]);
          setHasMore(false);
          lastVisibleDocRef.current = null;
          setLoadingInitial(false);
        }
        return;
      }

      if (!cancelled) {
        setLoadingInitial(true);
        setError(null);
      }

      try {
        const result = await getProjectsPageByUserId(user.uid, {
          limitCount: LIST_INITIAL_PAGE_SIZE,
        });

        if (!cancelled) {
          setProjects(result.items);
          lastVisibleDocRef.current = result.lastDoc;
          setHasMore(result.hasMore);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setProjects([]);
          setHasMore(false);
          lastVisibleDocRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const cardProjects = useMemo(
    () => projects.map(mapProjectToCard),
    [projects],
  );

  return {
    projects,
    cardProjects,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reloadFirstPage: loadFirstPage,
    removeProject,
  };
}
