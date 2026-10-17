import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

export const PAGE_SIZE = 15;

/**
 * List state (page, search text, filters) kept in the URL so a filtered view can
 * be linked to and survives a reload. Search is debounced before it hits the URL.
 */
export function useListParams<F extends string>(filterKeys: readonly F[]) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';
  const filters = Object.fromEntries(filterKeys.map((k) => [k, params.get(k) || undefined])) as Record<F, string | undefined>;

  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  const update = (patch: Record<string, string | number | undefined>, resetPage = true) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      if (resetPage && !('page' in patch)) next.delete('page');
      return next;
    }, { replace: true });

  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => update({ q: text.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return {
    page,
    q,
    filters,
    /** Search box value (updates the URL after a short pause). */
    text,
    setText,
    setFilter: (key: F, value: string | undefined) => update({ [key]: value }),
    setPage: (p: number) => update({ page: p === 1 ? undefined : p }, false),
    /** Spread into an API query. */
    query: { page, limit: PAGE_SIZE, q: q || undefined, ...filters },
  };
}
