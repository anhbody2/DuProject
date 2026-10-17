import { baseApi } from './baseApi';
import type { Paginated, Store, StoreDetail, StoreMemberRole } from '../types';

export interface StoreQuery {
  q?: string;
  categoryId?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

/** `district` only exists on pre-2025 addresses; send null to clear it. */
export interface StoreLocationBody { addressLine: string; ward?: string | null; district?: string | null; city?: string | null; latitude: number; longitude: number }

export interface NewStoreBody {
  name: string;
  description?: string;
  coverUrl?: string;
  categoryIds?: number[];
  location: StoreLocationBody;
}

export interface StoreEditBody {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  categoryIds: number[];
  location: StoreLocationBody;
  /** The primary location being edited; a new one is added when the store has none. */
  locationId?: number;
}

// Store changes show up on the market, the owner's store list and the admin console.
const STORE_TAGS = ['MyStores', 'Stores', 'AdminStores', 'AdminStats'] as const;

export const storesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    stores: b.query<Paginated<Store>, StoreQuery>({
      query: (params) => ({ url: '/stores', params: { limit: 100, ...params } }),
      providesTags: ['Stores'],
    }),
    /** Public store page (active stores only; 404 otherwise). */
    store: b.query<StoreDetail, number>({
      query: (id) => `/stores/${id}`,
      providesTags: ['Stores'],
    }),
    myStores: b.query<{ role: StoreMemberRole; store: Store }[], void>({
      query: () => '/me/stores',
      providesTags: ['MyStores'],
    }),
    /** Full store (categories, locations) for its members, whatever its status. */
    manageStore: b.query<Store, number>({
      query: (id) => `/stores/${id}/manage`,
      providesTags: ['MyStores'],
    }),
    createStore: b.mutation<Store, NewStoreBody>({
      // Stores are created first, then get their map location in a second call.
      async queryFn({ location, ...store }, _api, _extra, baseQuery) {
        const created = await baseQuery({ url: '/stores', method: 'POST', data: store });
        if (created.error) return { error: created.error };
        const s = created.data as Store;
        const loc = await baseQuery({ url: `/stores/${s.id}/locations`, method: 'POST', data: { ...location, isPrimary: true } });
        if (loc.error) return { error: loc.error };
        return { data: s };
      },
      invalidatesTags: ['MyStores', 'Stores'],
    }),
    updateStore: b.mutation<Store, StoreEditBody>({
      // Details, categories and the primary location live behind three endpoints.
      async queryFn({ id, categoryIds, location, locationId, ...details }, _api, _extra, baseQuery) {
        const saved = await baseQuery({ url: `/stores/${id}`, method: 'PATCH', data: details });
        if (saved.error) return { error: saved.error };
        const cats = await baseQuery({ url: `/stores/${id}/categories`, method: 'PUT', data: { categoryIds } });
        if (cats.error) return { error: cats.error };
        const loc = await baseQuery(locationId
          ? { url: `/stores/${id}/locations/${locationId}`, method: 'PATCH', data: location }
          : { url: `/stores/${id}/locations`, method: 'POST', data: { ...location, isPrimary: true } });
        if (loc.error) return { error: loc.error };
        return { data: saved.data as Store };
      },
      invalidatesTags: [...STORE_TAGS],
    }),
  }),
});

export const {
  useStoresQuery,
  useStoreQuery,
  useMyStoresQuery,
  useManageStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
} = storesApi;
