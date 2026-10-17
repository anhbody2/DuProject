import { baseApi } from './baseApi';
import type { AdminProduct, OrderStatus, Paginated, Product, ProductImage, StoreOrderRow, StoreStats } from '../types';

interface PageQuery {
  page?: number;
  limit?: number;
}

export interface StoreOrdersQuery extends PageQuery { storeId: number; status?: OrderStatus }
export interface StoreProductsQuery extends PageQuery { storeId: number; q?: string; status?: Product['status'] }

export interface NewProductBody {
  storeId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  stock?: number;
  status?: Product['status'];
  images?: { imageUrl: string; isPrimary?: boolean }[];
}

export interface ProductEditBody {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  /** The current primary photo and the one to show next (null removes it). */
  image: { current?: ProductImage; next: string | null };
}

// Order and product changes move the dashboard numbers too.
const ORDER_TAGS = ['StoreOrders', 'StoreStats', 'AdminOrders', 'AdminStats', 'Orders'] as const;
const PRODUCT_TAGS = ['StoreProducts', 'StoreStats', 'AdminProducts', 'AdminStats'] as const;

/** Store owner console: one store's stats, orders and catalogue. */
export const storeDashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    storeStats: b.query<StoreStats, { storeId: number; days: number }>({
      query: ({ storeId, days }) => ({ url: `/stores/${storeId}/stats`, params: { days } }),
      providesTags: ['StoreStats'],
    }),
    storeOrders: b.query<Paginated<StoreOrderRow>, StoreOrdersQuery>({
      query: ({ storeId, ...params }) => ({ url: `/stores/${storeId}/orders`, params }),
      providesTags: ['StoreOrders'],
    }),
    setStoreOrderStatus: b.mutation<StoreOrderRow, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/store-orders/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: [...ORDER_TAGS],
    }),
    storeProducts: b.query<Paginated<AdminProduct>, StoreProductsQuery>({
      query: ({ storeId, ...params }) => ({ url: `/stores/${storeId}/products`, params }),
      providesTags: ['StoreProducts'],
    }),
    createStoreProduct: b.mutation<Product, NewProductBody>({
      query: (data) => ({ url: '/products', method: 'POST', data }),
      invalidatesTags: [...PRODUCT_TAGS],
    }),
    updateStoreProduct: b.mutation<Product, { id: number } & Partial<Pick<Product, 'status' | 'stock' | 'price' | 'salePrice'>>>({
      query: ({ id, ...data }) => ({ url: `/products/${id}`, method: 'PATCH', data }),
      invalidatesTags: [...PRODUCT_TAGS],
    }),
    editStoreProduct: b.mutation<Product, ProductEditBody>({
      // Fields go through PATCH; the photo is a product_images row, swapped via its own endpoints.
      async queryFn({ id, image, ...data }, _api, _extra, baseQuery) {
        const saved = await baseQuery({ url: `/products/${id}`, method: 'PATCH', data });
        if (saved.error) return { error: saved.error };
        if (image.next !== (image.current?.imageUrl ?? null)) {
          if (image.next) {
            const added = await baseQuery({ url: `/products/${id}/images`, method: 'POST', data: { imageUrl: image.next, isPrimary: true } });
            if (added.error) return { error: added.error };
          }
          if (image.current) {
            const removed = await baseQuery({ url: `/products/${id}/images/${image.current.id}`, method: 'DELETE' });
            if (removed.error) return { error: removed.error };
          }
        }
        return { data: saved.data as Product };
      },
      invalidatesTags: [...PRODUCT_TAGS, 'Cart', 'FavProducts'],
    }),
    /** Soft delete: the dish leaves the menu and every cart; past orders keep their snapshot. */
    deleteStoreProduct: b.mutation<void, number>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [...PRODUCT_TAGS, 'Cart', 'FavProducts'],
    }),
  }),
});

export const {
  useStoreStatsQuery,
  useStoreOrdersQuery,
  useSetStoreOrderStatusMutation,
  useStoreProductsQuery,
  useCreateStoreProductMutation,
  useUpdateStoreProductMutation,
  useEditStoreProductMutation,
  useDeleteStoreProductMutation,
} = storeDashboardApi;
