import type { Product, Store, User } from '@/redux/types';

/** Mirrors the backend's DELIVERY_FEE_PER_STORE (one store per order); the real fee is computed at checkout. */
export const DELIVERY_FEE_PER_STORE = Number(import.meta.env.VITE_DELIVERY_FEE_PER_STORE ?? 15000);
/** Mirrors the backend's ORDER_NOTE_MAX_LENGTH (orders.note is VARCHAR(500)). */
export const ORDER_NOTE_MAX = 500;

export const fmt = (v: number) => Math.round(v).toLocaleString('vi-VN') + 'đ';

/** Lowercase, accent-free text for Vietnamese search matching. */
export const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const priceOf = (p: Pick<Product, 'price' | 'salePrice'>) => p.salePrice ?? p.price;

export const storeHref = (storeId: number) => `/store/${storeId}`;

/** A dish's page (options, quantity, add to cart, reviews). Every dish link goes here. */
export const dishHref = (p: Pick<Product, 'id'>) => `/product/${p.id}`;

export const imageOf =(p: { images?: { imageUrl: string }[] }) => p.images?.[0]?.imageUrl ?? null;

const WEEK = 7 * 24 * 3600 * 1000;

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

/** Where maps open before anything is pinned (central Ho Chi Minh City). */
export const DEFAULT_CENTER: [number, number] = [10.788, 106.695];

/** One-line address. `district` only exists on addresses saved before the 2025 two-level reform. */
export const addressText = (a: { addressLine: string; ward?: string | null; district?: string | null; city?: string | null }) =>
  [a.addressLine, a.ward, a.district, a.city].filter(Boolean).join(', ');
