import { baseApi } from './baseApi';
import type {
  AdminOrder,
  AdminProduct,
  AdminStats,
  AdminStore,
  Category,
  DeliveryStatus,
  OrderStatus,
  Paginated,
  PaymentStatus,
  Product,
  Role,
  Store,
  User,
  UserStatus,
} from '../types';

interface PageQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface AdminUsersQuery extends PageQuery { role?: Role; status?: UserStatus }
export interface AdminStoresQuery extends PageQuery { status?: Store['status'] }
export interface AdminProductsQuery extends PageQuery { status?: Product['status']; storeId?: number; categoryId?: number }
export interface AdminOrdersQuery extends PageQuery { status?: OrderStatus }

export interface CategoryBody {
  name: string;
  slug?: string;
  parentId?: number | null;
}

// Changing any order-side record moves the dashboard numbers too.
const ORDER_TAGS = ['AdminOrders', 'AdminStats', 'Orders', 'StoreOrders', 'StoreStats'] as const;

/** Admin console: dashboard stats and management of users, stores, products, orders and categories. */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    adminStats: b.query<AdminStats, number>({
      query: (days) => ({ url: '/admin/stats', params: { days } }),
      providesTags: ['AdminStats'],
    }),

    // ---- users
    adminUsers: b.query<Paginated<User>, AdminUsersQuery>({
      query: (params) => ({ url: '/users', params: { ...params } }),
      providesTags: ['AdminUsers'],
    }),
    updateUser: b.mutation<User, { id: number; role?: Role; status?: UserStatus }>({
      query: ({ id, ...data }) => ({ url: `/users/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    deleteUser: b.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    // ---- stores
    adminStores: b.query<Paginated<AdminStore>, AdminStoresQuery>({
      query: (params) => ({ url: '/admin/stores', params: { ...params } }),
      providesTags: ['AdminStores'],
    }),
    updateStoreStatus: b.mutation<Store, { id: number; status: Store['status'] }>({
      query: ({ id, status }) => ({ url: `/stores/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: ['AdminStores', 'AdminStats', 'Stores'],
    }),
    /** Soft delete (owner or admin). 409 while the store still has orders in progress. Used by both consoles. */
    deleteStore: b.mutation<void, number>({
      query: (id) => ({ url: `/stores/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminStores', 'AdminStats', 'Stores', 'AdminProducts', 'MyStores', 'StoreProducts', 'Cart', 'FavStores', 'FavProducts'],
    }),

    // ---- products
    adminProducts: b.query<Paginated<AdminProduct>, AdminProductsQuery>({
      query: (params) => ({ url: '/admin/products', params: { ...params } }),
      providesTags: ['AdminProducts'],
    }),
    updateProduct: b.mutation<Product, { id: number } & Partial<Pick<Product, 'status' | 'stock' | 'price' | 'salePrice' | 'name'>>>({
      query: ({ id, ...data }) => ({ url: `/products/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['AdminProducts', 'AdminStats', 'StoreProducts', 'StoreStats', 'Cart', 'FavProducts'],
    }),
    deleteProduct: b.mutation<void, number>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminProducts', 'AdminStats', 'StoreProducts', 'StoreStats'],
    }),

    // ---- orders
    adminOrders: b.query<Paginated<AdminOrder>, AdminOrdersQuery>({
      query: (params) => ({ url: '/admin/orders', params: { ...params } }),
      providesTags: ['AdminOrders'],
    }),
    updateStoreOrderStatus: b.mutation<unknown, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/store-orders/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: [...ORDER_TAGS],
    }),
    updatePaymentStatus: b.mutation<unknown, { id: number; status: PaymentStatus }>({
      query: ({ id, status }) => ({ url: `/payments/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: [...ORDER_TAGS],
    }),
    updateDelivery: b.mutation<unknown, { id: number; status: DeliveryStatus }>({
      query: ({ id, status }) => ({ url: `/deliveries/${id}`, method: 'PATCH', data: { status } }),
      invalidatesTags: [...ORDER_TAGS],
    }),
    adminCancelOrder: b.mutation<unknown, number>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: [...ORDER_TAGS],
    }),

    // ---- categories
    createCategory: b.mutation<Category, CategoryBody>({
      query: (data) => ({ url: '/categories', method: 'POST', data }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: b.mutation<Category, { id: number } & Partial<CategoryBody>>({
      query: ({ id, ...data }) => ({ url: `/categories/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: b.mutation<void, number>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useAdminStatsQuery,
  useAdminUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAdminStoresQuery,
  useUpdateStoreStatusMutation,
  useDeleteStoreMutation,
  useAdminProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdminOrdersQuery,
  useUpdateStoreOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useUpdateDeliveryMutation,
  useAdminCancelOrderMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = adminApi;
