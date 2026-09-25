import type { Product, Store, User } from '@/store/types';

/** Mirrors the backend's DELIVERY_FEE_PER_STORE; the real fee is computed at checkout. */
export const DELIVERY_FEE_PER_STORE = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE_PER_STORE ?? 15000);

export const fmt = (v: number) => Math.round(v).toLocaleString('vi-VN') + 'đ';

/** Lowercase, accent-free text for Vietnamese search matching. */
export const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const priceOf = (p: Pick<Product, 'price' | 'salePrice'>) => p.salePrice ?? p.price;

export const imageOf = (p: { images?: { imageUrl: string }[] }) => p.images?.[0]?.imageUrl ?? null;

const WEEK = 7 * 24 * 3600 * 1000;

/** Badge shown on a dish tile, derived from what the API knows about it. */
export function tagOf(p: Product): string {
  if (p.status === 'out_of_stock' || p.stock <= 0) return 'Hết hàng';
  if (p.salePrice != null && p.salePrice < p.price) return 'Giảm giá';
  if (Date.now() - new Date(p.createdAt).getTime() < WEEK) return 'Mới';
  return '';
}

export function displayName(u: User): string {
  const full = [u.profile?.lastName, u.profile?.firstName].filter(Boolean).join(' ');
  return full || u.username;
}

export const primaryLocation = (s: Store) => s.locations?.find((l) => l.isPrimary) ?? s.locations?.[0];

export const dateVN = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Rough centre of each district, used to place a newly suggested store on the map.
export const DISTRICTS: Record<string, [number, number]> = {
  'Quận 1': [10.7757, 106.7004],
  'Quận 3': [10.7843, 106.6844],
  'Bình Thạnh': [10.8106, 106.7091],
  'Phú Nhuận': [10.7991, 106.6802],
  'Quận 10': [10.7729, 106.668],
  'Thủ Đức': [10.8494, 106.7537],
};
