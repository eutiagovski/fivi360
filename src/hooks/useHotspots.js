import { useCallback, useEffect, useState } from "react";
import { getHotspotsByImage } from "@/services/hotspots/hotspotService";

/**
 * Carrega hotspots de uma imagem 360°.
 *
 * @param {string | undefined} imageId
 * @returns {{
 *   hotspots: import("@/services/hotspots/hotspotService").Hotspot[],
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useHotspots(imageId) {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!imageId) {
      setHotspots([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getHotspotsByImage(imageId);
      setHotspots(data);
    } catch (err) {
      setHotspots([]);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os hotspots.",
      );
    } finally {
      setLoading(false);
    }
  }, [imageId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { hotspots, loading, error, refresh };
}
