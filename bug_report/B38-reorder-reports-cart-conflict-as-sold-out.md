# B38 — "Đặt lại" reports a cart conflict as "sold out" and still drops options

| | |
|---|---|
| Severity | Low |
| Area | Account page, reorder (frontend) |
| Status | Open, found 2026-10-02 (the option part is B11, still open) |
| Where | `frontend/src/pages/AccountPage/index.tsx` `reorder()` |

## The bug

`reorder()` asks `useCartSwitch()` whether the cart holds another store's dishes. That hook reads
the **cached** `GET /cart`. If the cart was filled from another store in a different tab or device,
the cache still says "empty or same store", so no confirm appears and the cart isn't cleared. Then:

```ts
for (const it of items)
  await addToCart({ productId: it.productId!, quantity: it.quantity }).unwrap().catch(() => { failed += 1; });
toast(failed ? `Đã thêm ${items.length - failed}/${items.length} món — có món đã hết hoặc ngừng bán` : …);
```

Every add fails with **409 `CART_STORE_CONFLICT`**, and the user is told
**"Đã thêm 0/N món — có món đã hết hoặc ngừng bán"**, which isn't true: the dishes are in stock,
and the cart just belongs to another store. `useAddToCart()` already handles this 409 by asking
again with the server's answer, but `reorder()` calls the raw mutation and skips that logic.

Separately, the loop still sends no `optionIds`, so every dish comes back with its default options
(size S) whatever was ordered (B11 / P7).

## Steps to reproduce

1. Tab 1: open `/account` (the cart is empty at that moment).
2. Tab 2: add a dish from store B.
3. Tab 1: press "Đặt lại" on an order from store A. The toast reads "Đã thêm 0/2 món — có món đã hết
   hoặc ngừng bán".

## Suggested fix

- On the first 409 `CART_STORE_CONFLICT`, call `confirmSwitch(store, err.data.cartStore)`. If the
  user agrees, clear the cart and restart the loop, as `useAddToCart` does. Count only non-409
  failures as "hết hoặc ngừng bán".
- For B11, map the order's option snapshot back to option ids by name per option group (or store
  `option_id` on `order_item_options`) and send `optionIds`.
