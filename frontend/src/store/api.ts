import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout } from './authSlice';
import type {
  Address, AuthResponse, Cart, Category, FavoriteProduct, FavoriteStore, Order, Paginated,
  PaymentMethod, Product, Role, Store, User,
} from './types';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// 401 means the session is gone (expired, or the account was suspended): drop it.
// Bad input from a logged-in user is a 400, so this never logs out on a typo.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401 && (api.getState() as { auth: { token: string | null } }).auth.token) {
    api.dispatch(logout());
  }
  return result;
};

export interface ProductQuery {
  q?: string;
  categoryId?: number;
  storeId?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  limit?: number;
  page?: number;
}

export interface StoreQuery {
  q?: string;
  categoryId?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
  role?: Extract<Role, 'customer' | 'store_owner'>;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface NewStoreBody {
  name: string;
  description?: string;
  coverUrl?: string;
  categoryIds?: number[];
  location: { addressLine: string; district?: string; city?: string; latitude: number; longitude: number };
}

export type NewAddressBody = Omit<Address, 'id' | 'isDefault' | 'label' | 'ward' | 'district' | 'city'> &
  Partial<Pick<Address, 'label' | 'ward' | 'district' | 'city' | 'isDefault'>>;

// Drop undefined/empty params: the API rejects unknown or blank query fields.
const clean = <T extends object>(p: T) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>;

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Cart', 'Orders', 'Addresses', 'FavProducts', 'FavStores', 'Stores', 'MyStores'],
  endpoints: (b) => ({
    // ---- auth
    login: b.mutation<AuthResponse, { login: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: b.mutation<AuthResponse, RegisterBody>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    me: b.query<User, void>({ query: () => '/me', providesTags: ['Me'] }),

    // ---- catalogue (public)
    categories: b.query<Category[], void>({ query: () => '/categories' }),
    products: b.query<Paginated<Product>, ProductQuery>({
      query: (params) => ({ url: '/products', params: clean({ limit: 100, ...params }) }),
    }),
    stores: b.query<Paginated<Store>, StoreQuery>({
      query: (params) => ({ url: '/stores', params: clean({ limit: 100, ...params }) }),
      providesTags: ['Stores'],
    }),
    myStores: b.query<{ role: string; store: Store }[], void>({ query: () => '/me/stores', providesTags: ['MyStores'] }),
    createStore: b.mutation<Store, NewStoreBody>({
      // Stores are created first, then get their map location in a second call.
      async queryFn({ location, ...store }, _api, _extra, fetch) {
        const created = await fetch({ url: '/stores', method: 'POST', body: store });
        if (created.error) return { error: created.error };
        const s = created.data as Store;
        const loc = await fetch({ url: `/stores/${s.id}/locations`, method: 'POST', body: { ...location, isPrimary: true } });
        if (loc.error) return { error: loc.error };
        return { data: s };
      },
      invalidatesTags: ['MyStores', 'Stores'],
    }),

    // ---- cart
    cart: b.query<Cart, void>({ query: () => '/cart', providesTags: ['Cart'] }),
    addToCart: b.mutation<Cart, { productId: number; quantity?: number }>({
      query: ({ productId, quantity = 1 }) => ({ url: '/cart/items', method: 'POST', body: { productId, quantity } }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData('cart', undefined, data));
      },
    }),
    updateCartItem: b.mutation<Cart, { itemId: number; quantity: number }>({
      query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: 'PATCH', body: { quantity } }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData('cart', undefined, data));
      },
    }),
    removeCartItem: b.mutation<Cart, number>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData('cart', undefined, data));
      },
    }),

    // ---- addresses
    addresses: b.query<Address[], void>({ query: () => '/addresses', providesTags: ['Addresses'] }),
    createAddress: b.mutation<Address, NewAddressBody>({
      query: (body) => ({ url: '/addresses', method: 'POST', body }),
      invalidatesTags: ['Addresses'],
    }),

    // ---- orders
    orders: b.query<Paginated<Order>, void>({
      query: () => ({ url: '/orders', params: { limit: 20 } }),
      providesTags: ['Orders'],
    }),
    order: b.query<Order, number>({ query: (id) => `/orders/${id}`, providesTags: ['Orders'] }),
    checkout: b.mutation<Order, { deliveryAddressId: number; paymentMethod: PaymentMethod; items?: { productId: number; quantity: number }[] }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Cart', 'Orders'],
    }),
    cancelOrder: b.mutation<Order, number>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Orders'],
    }),

    // ---- favourites
    favoriteProducts: b.query<FavoriteProduct[], void>({ query: () => '/favorites/products', providesTags: ['FavProducts'] }),
    setFavoriteProduct: b.mutation<unknown, { productId: number; on: boolean }>({
      query: ({ productId, on }) => ({ url: `/favorites/products/${productId}`, method: on ? 'PUT' : 'DELETE' }),
      invalidatesTags: ['FavProducts'],
    }),
    favoriteStores: b.query<FavoriteStore[], void>({ query: () => '/favorites/stores', providesTags: ['FavStores'] }),
    setFavoriteStore: b.mutation<unknown, { storeId: number; on: boolean }>({
      query: ({ storeId, on }) => ({ url: `/favorites/stores/${storeId}`, method: on ? 'PUT' : 'DELETE' }),
      invalidatesTags: ['FavStores'],
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useMeQuery,
  useCategoriesQuery, useProductsQuery, useStoresQuery, useMyStoresQuery, useCreateStoreMutation,
  useCartQuery, useAddToCartMutation, useUpdateCartItemMutation, useRemoveCartItemMutation,
  useAddressesQuery, useCreateAddressMutation,
  useOrdersQuery, useOrderQuery, useLazyOrderQuery, useCheckoutMutation, useCancelOrderMutation,
  useFavoriteProductsQuery, useSetFavoriteProductMutation, useFavoriteStoresQuery, useSetFavoriteStoreMutation,
} = api;

/** Human-readable message from an RTK Query error (Nest returns string or string[]). */
export function errorMessage(err: unknown, fallback = 'Có lỗi xảy ra, thử lại nhé'): string {
  const e = err as FetchBaseQueryError | undefined;
  if (e && 'data' in e && e.data && typeof e.data === 'object' && 'message' in e.data) {
    const m = (e.data as { message: string | string[] }).message;
    return Array.isArray(m) ? m.join(', ') : m;
  }
  if (e && e.status === 'FETCH_ERROR') return 'Không kết nối được máy chủ';
  return fallback;
}
