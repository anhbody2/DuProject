import { baseApi } from './baseApi';
import type { Category, MyProductReviews, Paginated, Product, ProductDetail, Review, ReviewPage, ReviewReply } from '../types';

export interface ProductQuery {
  q?: string;
  categoryId?: number;
  storeId?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  limit?: number;
  page?: number;
}

/** Public catalogue: categories and products. */
export const catalogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    categories: b.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    products: b.query<Paginated<Product>, ProductQuery>({
      query: (params) => ({ url: '/products', params: { limit: 100, ...params } }),
    }),
    product: b.query<ProductDetail, number>({
      query: (id) => `/products/${id}`,
    }),
    /** Store owner edits the description from the product page; patches the cached detail in place. */
    updateProductDescription: b.mutation<Product, { id: number; description: string }>({
      query: ({ id, description }) => ({ url: `/products/${id}`, method: 'PATCH', data: { description } }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(catalogApi.util.updateQueryData('product', id, (draft) => { draft.description = data.description; }));
        } catch { /* the caller shows the error */ }
      },
      invalidatesTags: ['StoreProducts'],
    }),
    productReviews: b.query<ReviewPage, { id: number; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/products/${id}/reviews`, params: { limit: 5, ...params } }),
      providesTags: ['Reviews'],
    }),
    myProductReviews: b.query<MyProductReviews, number>({
      query: (id) => `/products/${id}/reviews/mine`,
      providesTags: ['Reviews'],
    }),
    createProductReview: b.mutation<Review, { productId: number; orderId: number; rating: number; comment?: string }>({
      query: ({ productId, ...data }) => ({ url: `/products/${productId}/reviews`, method: 'POST', data }),
      invalidatesTags: ['Reviews'],
    }),
    updateProductReview: b.mutation<Review, { id: number; rating?: number; comment?: string }>({
      query: ({ id, ...data }) => ({ url: `/product-reviews/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Reviews'],
    }),
    deleteProductReview: b.mutation<void, number>({
      query: (id) => ({ url: `/product-reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reviews'],
    }),
    createReviewReply: b.mutation<ReviewReply, { reviewId: number; comment: string }>({
      query: ({ reviewId, ...data }) => ({ url: `/product-reviews/${reviewId}/replies`, method: 'POST', data }),
      invalidatesTags: ['Reviews'],
    }),
    deleteReviewReply: b.mutation<void, number>({
      query: (id) => ({ url: `/product-review-replies/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reviews'],
    }),
  }),
});

export const {
  useCategoriesQuery, useProductsQuery, useProductQuery, useUpdateProductDescriptionMutation, useProductReviewsQuery, useMyProductReviewsQuery,
  useCreateProductReviewMutation, useUpdateProductReviewMutation, useDeleteProductReviewMutation,
  useCreateReviewReplyMutation, useDeleteReviewReplyMutation,
} = catalogApi;
