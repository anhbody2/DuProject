import { useEffect, useRef } from 'react';

/**
 * Calls `onVisible` whenever the returned ref's element scrolls into view (within `rootMargin`
 * of the viewport). Put it on a sentinel at the end of a list to load the next page.
 * Pass `enabled: false` while a page is loading or when there is nothing more to load.
 */
export function useOnVisible<T extends Element>(onVisible: () => void, enabled = true, rootMargin = '200px') {
  const ref = useRef<T>(null);
  const callback = useRef(onVisible);
  callback.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) callback.current();
    }, { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
