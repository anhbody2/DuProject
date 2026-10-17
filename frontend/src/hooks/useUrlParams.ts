import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

type Patch = Record<string, string | number | undefined>;

/**
 * Filter state kept in the URL query, so a filtered view can be linked and survives
 * a reload. Empty values drop the key to keep URLs short. Pass `push` for discrete
 * choices (chips, sort) so Back undoes them.
 */
export function useUrlParams() {
  const [params, setParams] = useSearchParams();

  const update = useCallback((patch: Patch, push = false) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      return next;
    }, { replace: !push, preventScrollReset: true }), [setParams]);

  return {
    params,
    update,
    str: (key: string) => params.get(key) || undefined,
    num: (key: string) => Number(params.get(key)) || undefined,
    /** Value from a fixed set; anything else (typos, stale links) falls back. */
    oneOf: <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
      const v = params.get(key) as T | null;
      return v && allowed.includes(v) ? v : fallback;
    },
  };
}

