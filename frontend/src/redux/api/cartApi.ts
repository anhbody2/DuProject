import { baseApi } from './baseApi';
import type { Cart } from '../types';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (b) => {
    // Every cart mutation answers with the full cart: write it straight into the
    // cache instead of refetching.
    const syncCart = {
      onQueryStarted: async (_arg: unknown, { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: Cart }> }) => {
        const { data } = await queryFulfilled;
        dispatch(cartApi.util.upsertQueryData('cart', undefined, data));
      },
    };

    return {
      cart: b.query<Cart, void>({
        query: () => '/cart',
        providesTags: ['Cart'],
      }),
      // Without optionIds the server picks the defaults (size S). A dish from another store than
      // the cart's answers 409 CART_STORE_CONFLICT unless replaceCart empties the cart first.
      addToCart: b.mutation<Cart, { productId: number; quantity?: number; optionIds?: number[]; replaceCart?: boolean }>({
        query: ({ productId, quantity = 1, optionIds, replaceCart }) => ({ url: '/cart/items', method: 'POST', data: { productId, quantity, optionIds, replaceCart } }),
        ...syncCart,
      }),
      clearCart: b.mutation<void, void>({
        query: () => ({ url: '/cart', method: 'DELETE' }),
        invalidatesTags: ['Cart'],
      }),
      updateCartItem: b.mutation<Cart, { itemId: number; quantity: number }>({
        query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: 'PATCH', data: { quantity } }),
        ...syncCart,
      }),
      removeCartItem: b.mutation<Cart, number>({
        query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
        ...syncCart,
      }),
    };
  },
});

export const { useCartQuery, useAddToCartMutation, useClearCartMutation, useUpdateCartItemMutation, useRemoveCartItemMutation } = cartApi;
