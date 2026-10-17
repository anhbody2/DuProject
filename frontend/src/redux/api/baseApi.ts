import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, type ApiQueryError } from './axiosBaseQuery';

/**
 * Root RTK Query API. It has no endpoints of its own: each feature file
 * (authApi, catalogApi, cartApi, ...) adds its endpoints with `injectEndpoints`,
 * so they all share one cache, one middleware and these tags.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Me', 'Cart', 'Orders', 'Addresses', 'FavProducts', 'FavStores', 'Stores', 'MyStores', 'Categories', 'Reviews', 'AdminStats', 'AdminUsers', 'AdminStores', 'AdminProducts', 'AdminOrders', 'StoreStats', 'StoreOrders', 'StoreProducts', 'Conversations', 'ChatMessages', 'ChatUnread', 'SupportInbox'],
  endpoints: () => ({}),
});

/** Human-readable message from an API error (Nest returns string or string[]). */
export function errorMessage(err: unknown, fallback = 'Có lỗi xảy ra, thử lại nhé'): string {
  const e = err as ApiQueryError | undefined;
  if (e?.data && typeof e.data === 'object' && 'message' in e.data) {
    const m = (e.data as { message: string | string[] }).message;
    return Array.isArray(m) ? m.join(', ') : m;
  }
  // nginx answers an oversized upload itself (HTML body, no Nest message).
  if (e?.status === 413) return 'Tệp quá lớn, thử ảnh nhỏ hơn nhé';
  if (e?.status === 'FETCH_ERROR') return 'Không kết nối được máy chủ';
  if (e?.status === 'TIMEOUT_ERROR') return 'Máy chủ phản hồi quá lâu, thử lại nhé';
  return fallback;
}
