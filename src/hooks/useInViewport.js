import { useEffect, useState } from "react";

/**
 * Observa se um elemento entrou no viewport (IntersectionObserver).
 *
 * @param {import("react").RefObject<Element | null>} ref
 * @param {{ rootMargin?: string, threshold?: number }} [options]
 * @returns {boolean}
 */
export function useInViewport(ref, { rootMargin = "200px", threshold = 0 } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin, threshold]);

  return inView;
}
