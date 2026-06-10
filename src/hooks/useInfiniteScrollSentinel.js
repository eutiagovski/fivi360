import { useEffect, useRef } from "react";

/**
 * Observa um sentinel no fim da lista e dispara carregamento incremental.
 *
 * @param {{ hasMore: boolean, loadingMore: boolean, onLoadMore: () => void, rootMargin?: string }} options
 * @returns {import("react").RefObject<HTMLDivElement | null>}
 */
export function useInfiniteScrollSentinel({
  hasMore,
  loadingMore,
  onLoadMore,
  rootMargin = "200px",
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element || !hasMore || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, onLoadMore, rootMargin]);

  return sentinelRef;
}
