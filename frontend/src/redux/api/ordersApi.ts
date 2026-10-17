import { baseApi } from './baseApi';
import type { Order, Paginated, PaymentMethod } from '../types';

export interface CheckoutBody {
  deliveryAddressId: number;
  paymentMethod: PaymentMethod;
  items?: { productId: number; quantity: number; optionIds?: number[] }[];
  /** Note for the store / driver, at most ORDER_NOTE_MAX characters. */
  note?: string;
}

export interface OrdersQuery {
  /** active = still in progress, history = completed or cancelled. */
  scope?: 'active' | 'history';
  page?: number;
  limit?: number;
}

/** Order history page size; the account page fetches the next page on scroll. */
export const HISTORY_PAGE_SIZE = 5;

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    orders: b.query<Paginated<Order>, OrdersQuery | void>({
      query: (params) => ({ url: '/orders', params: { limit: 20, ...params } }),
      providesTags: ['Orders'],
    }),
    // Finished orders, newest first, HISTORY_PAGE_SIZE at a time. An 'Orders' invalidation
    // refetches every loaded page, so a just-finished order shows up without a reload.
    orderHistory: b.infiniteQuery<Paginated<Order>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: '/orders', params: { scope: 'history', page: pageParam, limit: HISTORY_PAGE_SIZE } }),
      providesTags: ['Orders'],
    }),
    order: b.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: ['Orders'],
    }),
    checkout: b.mutation<Order, CheckoutBody>({
      query: (data) => ({ url: '/orders', method: 'POST', data }),
      invalidatesTags: ['Cart', 'Orders'],
    }),
    cancelOrder: b.mutation<Order, number>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const { useOrdersQuery, useOrderHistoryInfiniteQuery, useOrderQuery, useLazyOrderQuery, useCheckoutMutation, useCancelOrderMutation } = ordersApi;
