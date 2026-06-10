import { useCallback, useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
  getLooseImagesByUserId,
  mapImageToCard,
} from "@/services/images/imageService";
import { sortImagesByCreatedAt } from "@/utils/imageCreatedSort";

/**
 * Carrega imagens soltas (projectId == null) e expõe helpers para atualização local.
 */
export function useLooseImages() {
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
      const data = await getLooseImagesByUserId(user.uid);
      setImages(sortImagesByCreatedAt(data));
    } catch (err) {
      setError(err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

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
        const data = await getLooseImagesByUserId(user.uid);
        if (!cancelled) {
          setImages(sortImagesByCreatedAt(data));
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
  }, [user?.uid]);

  const addImage = useCallback((image) => {
    setImages((current) =>
      sortImagesByCreatedAt([
        {
          ...image,
          updatedAt: image.updatedAt ?? Timestamp.now(),
        },
        ...current.filter((item) => item.id !== image.id),
      ]),
    );
  }, []);

  const updateImage = useCallback((imageId, updates) => {
    setImages((current) =>
      current.map((image) =>
        image.id === imageId
          ? {
              ...image,
              ...updates,
              updatedAt: updates.updatedAt ?? Timestamp.now(),
            }
          : image,
      ),
    );
  }, []);

  const removeImage = useCallback((imageId) => {
    setImages((current) => current.filter((image) => image.id !== imageId));
  }, []);

  const cardImages = useMemo(() => images.map(mapImageToCard), [images]);

  return {
    images,
    cardImages,
    loading,
    error,
    refetch,
    addImage,
    updateImage,
    removeImage,
  };
}
