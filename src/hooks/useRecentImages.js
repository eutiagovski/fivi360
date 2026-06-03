import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getRecentImagesByUserId,
  mapImageToCard,
} from "@/services/images/imageService";

/**
 * Carrega as imagens mais recentes do usuário (projetos e soltas).
 *
 * @param {number} [limit]
 */
export function useRecentImages(limit = 3) {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setImages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getRecentImagesByUserId(user.uid, limit);
      setImages(data);
    } catch (err) {
      setError(err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, limit]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) {
        if (!cancelled) {
          setImages([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await getRecentImagesByUserId(user.uid, limit);
        if (!cancelled) {
          setImages(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setImages([]);
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
  }, [user?.uid, limit]);

  const cardImages = useMemo(() => images.map(mapImageToCard), [images]);

  return { images, cardImages, loading, error, refetch };
}
