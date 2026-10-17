import { baseApi } from './baseApi';
import type { FavoriteProduct, FavoriteStore } from '../types';

export const favoritesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    favoriteProducts: b.query<FavoriteProduct[], void>({
      query: () => '/favorites/products',
      providesTags: ['FavProducts'],
    }),
    setFavoriteProduct: b.mutation<unknown, { productId: number; on: boolean }>({
      query: ({ productId, on }) => ({ url: `/favorites/products/${productId}`, method: on ? 'PUT' : 'DELETE' }),
      invalidatesTags: ['FavProducts'],
    }),
    favoriteStores: b.query<FavoriteStore[], void>({
      query: () => '/favorites/stores',
      providesTags: ['FavStores'],
    }),
    setFavoriteStore: b.mutation<unknown, { storeId: number; on: boolean }>({
      query: ({ storeId, on }) => ({ url: `/favorites/stores/${storeId}`, method: on ? 'PUT' : 'DELETE' }),
      invalidatesTags: ['FavStores'],
    }),
  }),
});

export const { useFavoriteProductsQuery, useSetFavoriteProductMutation, useFavoriteStoresQuery, useSetFavoriteStoreMutation } = favoritesApi;
