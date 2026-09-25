'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/store';
import {
  errorMessage, useAddToCartMutation, useFavoriteProductsQuery, useFavoriteStoresQuery,
  useSetFavoriteProductMutation, useSetFavoriteStoreMutation,
} from '@/store/api';
import type { Product } from '@/store/types';

/** Returns a guard: true when logged in, otherwise sends the user to /login and returns false. */
export function useRequireLogin() {
  const { token } = useAuth();
  const router = useRouter();
  const path = usePathname();
  return useCallback(
    (why = 'Đăng nhập để tiếp tục nhé') => {
      if (token) return true;
      toast(why);
      router.push(`/login?next=${encodeURIComponent(path)}`);
      return false;
    },
    [token, router, path],
  );
}

export function useAddToCart() {
  const requireLogin = useRequireLogin();
  const [add, { isLoading }] = useAddToCartMutation();
  const addProduct = useCallback(
    async (p: Pick<Product, 'id' | 'name'>, quantity = 1) => {
      if (!requireLogin('Đăng nhập để thêm món vào giỏ')) return;
      try {
        await add({ productId: p.id, quantity }).unwrap();
        toast(`Đã thêm ${p.name} vào giỏ`);
      } catch (e) {
        toast(errorMessage(e));
      }
    },
    [add, requireLogin],
  );
  return { addProduct, isLoading };
}

export function useFavoriteProducts() {
  const { token } = useAuth();
  const requireLogin = useRequireLogin();
  const { data } = useFavoriteProductsQuery(undefined, { skip: !token });
  const [setFav] = useSetFavoriteProductMutation();
  const ids = useMemo(() => new Set((data ?? []).map((f) => f.productId)), [data]);
  const toggle = useCallback(
    (productId: number) => {
      if (!requireLogin('Đăng nhập để lưu món yêu thích')) return;
      setFav({ productId, on: !ids.has(productId) }).unwrap().catch((e) => toast(errorMessage(e)));
    },
    [ids, requireLogin, setFav],
  );
  return { ids, toggle, count: ids.size };
}

export function useFavoriteStores() {
  const { token } = useAuth();
  const requireLogin = useRequireLogin();
  const { data } = useFavoriteStoresQuery(undefined, { skip: !token });
  const [setFav] = useSetFavoriteStoreMutation();
  const ids = useMemo(() => new Set((data ?? []).map((f) => f.storeId)), [data]);
  const toggle = useCallback(
    (storeId: number) => {
      if (!requireLogin('Đăng nhập để lưu quán ruột')) return;
      setFav({ storeId, on: !ids.has(storeId) }).unwrap().catch((e) => toast(errorMessage(e)));
    },
    [ids, requireLogin, setFav],
  );
  return { ids, toggle };
}
