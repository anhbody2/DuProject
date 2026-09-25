import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

/**
 * Parses a CSS declaration string into a React style object, so components can
 * keep the design's inline styles verbatim. Memoised per string.
 */
export function sx(str: string): CSSProperties {
  let o = cache.get(str);
  if (!o) {
    const out: Record<string, string> = {};
    for (const decl of str.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const k = decl.slice(0, i).trim();
      if (!k) continue;
      const key = k.startsWith('--')
        ? k
        : k.replace(/^-(webkit|moz|ms)-/, (_, p: string) => p[0].toUpperCase() + p.slice(1) + '-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      out[key] = decl.slice(i + 1).trim();
    }
    o = out as CSSProperties;
    cache.set(str, o);
  }
  return o;
}
