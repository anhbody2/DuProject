import { useEffect, useState } from 'react';
import { norm } from '@/lib/format';

/** Province with its wards, names only (that's what addresses store). */
export interface Province { name: string; wards: string[] }

// Vietnam's 2-level units since 2025-07-01: 34 provinces, 3,321 wards / communes / special zones.
// Source: provinces.open-api.vn (v2). Loaded on demand: it's only needed by address forms.
let cache: Promise<Province[]> | null = null;
const load = () => (cache ??= import('@/lib/vn-admin-units.json').then((m) => m.default as Province[]));

export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  useEffect(() => {
    let live = true;
    load().then((p) => live && setProvinces(p));
    return () => { live = false; };
  }, []);
  return provinces;
}

const PREFIX = /^(thanh pho|tinh|phuong|xa|dac khu|thi tran)\s+/;
/** Accent-, case- and prefix-free key: "Thành Phố Hồ Chí Minh" and "TP Hồ Chí Minh" -> "ho chi minh". */
const key = (name: string) => norm(name).replace(/^tp\.?\s+/, '').replace(PREFIX, '').trim();

/** The list entry that `name` refers to (as spelled by VietMap or an old record), or null. */
export function matchName(names: string[], name: string | null | undefined): string | null {
  if (!name) return null;
  const n = norm(name);
  const exact = names.find((x) => norm(x) === n);
  if (exact) return exact;
  // Loose match only when unambiguous (a province may have both "Phường X" and "Xã X").
  const k = key(name);
  const loose = names.filter((x) => key(x) === k);
  return loose.length === 1 ? loose[0] : null;
}

/** Search filter for the dropdowns: accent-insensitive, so "ben thanh" finds "Phường Bến Thành". */
export const filterName = (input: string, option?: { label?: unknown }) =>
  norm(String(option?.label ?? '')).includes(norm(input));
