import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
  getLooseImagesPageByUserId,
  mapImageToCard,
} from "@/services/images/imageService";
import { deduplicateMergeById } from "@/utils/deduplicateById";
import {
  LIST_INITIAL_PAGE_SIZE,
  LIST_LOAD_MORE_PAGE_SIZE,
} from "@/utils/paginationConstants";

/**
 * Lista paginada de imagens soltas para /images (updatedAt DESC).
 */
export function useLooseImagesPage() {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const lastVisibleDocRef = useRef(null);

  const loadFirstPage = useCallback(async () => {
    if (!user?.uid) {
      setImages([]);
      setHasMore(false);
      lastVisibleDocRef.current = null;
      setLoadingInitial(false);
      return;
    }

    setLoadingInitial(true);
    setError(null);

    try {
      const result = await getLooseImagesPageByUserId(user.uid, {
        limitCount: LIST_INITIAL_PAGE_SIZE,
      });

      setImages(result.items);
      lastVisibleDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
      setImages([]);
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
      const result = await getLooseImagesPageByUserId(user.uid, {
        limitCount: LIST_LOAD_MORE_PAGE_SIZE,
        startAfterDoc: lastVisibleDocRef.current,
      });

      setImages((current) => deduplicateMergeById(current, result.items));
      lastVisibleDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, hasMore, loadingMore, loadingInitial]);

  const addImage = useCallback((image) => {
    setImages((current) => [
      {
        ...image,
        updatedAt: image.updatedAt ?? Timestamp.now(),
      },
      ...current.filter((item) => item.id !== image.id),
    ]);
  }, []);

  const updateImage = useCallback((imageId, updates) => {
    setImages((current) => {
      const existing = current.find((image) => image.id === imageId);

      if (!existing) {
        return current;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: updates.updatedAt ?? Timestamp.now(),
      };

      return [updated, ...current.filter((image) => image.id !== imageId)];
    });
  }, []);

  const removeImage = useCallback((imageId) => {
    setImages((current) => current.filter((image) => image.id !== imageId));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) {
        if (!cancelled) {
          setImages([]);
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
        const result = await getLooseImagesPageByUserId(user.uid, {
          limitCount: LIST_INITIAL_PAGE_SIZE,
        });

        if (!cancelled) {
          setImages(result.items);
          lastVisibleDocRef.current = result.lastDoc;
          setHasMore(result.hasMore);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setImages([]);
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

  const cardImages = useMemo(() => images.map(mapImageToCard), [images]);

  return {
    images,
    cardImages,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reloadFirstPage: loadFirstPage,
    addImage,
    updateImage,
    removeImage,
  };
}
