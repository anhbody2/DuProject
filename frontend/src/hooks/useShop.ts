import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { App } from 'antd';
import { toast } from '@/lib/toast';
import { useAuth } from '@/redux';
import {
  errorMessage, useAddToCartMutation, useCartQuery, useFavoriteProductsQuery, useFavoriteStoresQuery,
  useSetFavoriteProductMutation, useSetFavoriteStoreMutation,
} from '@/redux/api';
import type { Product, StoreSummary } from '@/redux/types';

type StoreRef = Pick<StoreSummary, 'id' | 'name'>;

/** The cart's store from a 409 CART_STORE_CONFLICT (the cart changed in another tab), else null. */
function cartConflict(err: unknown): StoreRef | null {
  const data = (err as { data?: { code?: string; cartStore?: StoreRef } } | undefined)?.data;
  return data?.code === 'CART_STORE_CONFLICT' && data.cartStore ? data.cartStore : null;
}

/** Returns a guard: true when logged in, otherwise sends the user to /login and returns false. */
export function useRequireLogin() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return useCallback(
    (why = 'Đăng nhập để tiếp tục nhé') => {
      if (token) return true;
      toast(why);
      navigate(`/login?next=${encodeURIComponent(pathname + search)}`);
      return false;
    },
    [token, navigate, pathname, search],
  );
}

/**
 * A cart holds one store's dishes (GrabFood / ShopeeFood). Before adding from `target`,
 * asks whether to drop a cart that belongs to another store. Resolves to the `replaceCart`
 * flag to send, or null when the user keeps their cart.
 */
export function useCartSwitch() {
  const { modal } = App.useApp();
  const { token } = useAuth();
  const { data: cart } = useCartQuery(undefined, { skip: !token });
  const cartStore = cart?.items.length ? cart.store : null;
  return useCallback(
    (target: { id: number; name?: string }, current: StoreRef | null = cartStore) =>
      new Promise<boolean | null>((resolve) => {
        if (!current || current.id === target.id) return resolve(false);
        modal.confirm({
          title: 'Đặt món từ quán khác?',
          content: `Giỏ hàng đang có món của ${current.name}. Mỗi đơn chỉ đặt từ một quán, thêm món của ${target.name ?? 'quán này'} sẽ xoá giỏ hiện tại.`,
          okText: 'Xoá giỏ & thêm món',
          cancelText: 'Giữ giỏ cũ',
          okButtonProps: { danger: true },
          onOk: () => resolve(true),
          onCancel: () => resolve(null),
        });
      }),
    [cartStore, modal],
  );
}

export function useAddToCart() {
  const requireLogin = useRequireLogin();
  const confirmSwitch = useCartSwitch();
  const [add, { isLoading }] = useAddToCartMutation();
  /** Resolves to true once the dish is in the cart. */
  const addProduct = useCallback(
    async (p: Pick<Product, 'id' | 'name' | 'storeId' | 'store'>, quantity = 1, optionIds?: number[]) => {
      if (!requireLogin('Đăng nhập để thêm món vào giỏ')) return false;
      const target = { id: p.storeId, name: p.store?.name };
      const send = async (replaceCart: boolean) => {
        await add({ productId: p.id, quantity, optionIds, replaceCart: replaceCart || undefined }).unwrap();
        toast(`Đã thêm ${p.name} vào giỏ`);
        return true;
      };
      try {
        const replace = await confirmSwitch(target);
        return replace === null ? false : await send(replace);
      } catch (e) {
        const current = cartConflict(e);
        if (!current) { toast(errorMessage(e)); return false; }
        // The cache was stale (cart filled from another tab): ask with the server's answer.
        const replace = await confirmSwitch(target, current);
        if (replace === null) return false;
        return send(true).catch((e2) => { toast(errorMessage(e2)); return false; });
      }
    },
    [add, confirmSwitch, requireLogin],
  );
  return { addProduct, isLoading };
}

export function useFavoriteProducts() {
  const { token } = useAuth();
  const requireLogin = useRequireLogin();
  const { data, isLoading } = useFavoriteProductsQuery(undefined, { skip: !token });
  const [setFav] = useSetFavoriteProductMutation();
  const ids = useMemo(() => new Set((data ?? []).map((f) => f.productId)), [data]);
  const toggle = useCallback(
    (productId: number) => {
      if (!requireLogin('Đăng nhập để lưu món yêu thích')) return;
      setFav({ productId, on: !ids.has(productId) }).unwrap().catch((e) => toast(errorMessage(e)));
    },
    [ids, requireLogin, setFav],
  );
  const items = useMemo(() => (data ?? []).flatMap((f) => (f.product ? [f.product] : [])), [data]);
  return { ids, toggle, items, isLoading, count: ids.size };
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
