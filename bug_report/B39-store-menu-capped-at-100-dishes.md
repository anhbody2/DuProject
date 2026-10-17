# B39 — The store page and the menu silently stop at 100 dishes

| | |
|---|---|
| Severity | Low (grows with the catalogue) |
| Area | Catalogue (frontend) |
| Status | Open, found 2026-10-02 |
| Where | `frontend/src/redux/api/catalogApi.ts` (`products` query: `limit: 100`), `pages/StorePage/index.tsx`, `pages/MenuPage/index.tsx` |

## The bug

```ts
// catalogApi.ts
query: (params) => ({ url: '/products', params: { limit: 100, ...params } }),
```

Every product list asks for one page of up to 100 items, and nothing ever asks for page 2:

- **Store page** (`/store/:id`) groups `dishes.items` by category. A store with more than 100 active
  dishes shows only the 100 newest. Older dishes can't be ordered from the store page, the only
  place ordering now happens (SINGLE_STORE_CART.md).
- **Menu** (`/menu`) lists "every dish from every store", but in practice shows the 100 newest
  across the whole platform.

`meta.total` is returned but never shown, so nothing tells the user the list was cut.

## Suggested fix

- Store page: page through the store's dishes (an infinite query like `orderHistory`, or a larger
  per-store limit, since one store rarely has hundreds of dishes).
- Menu: infinite scroll with `useOnVisible` (already in `hooks/`), 24–30 per page.
- Show "Hiển thị X / Y món" when `meta.total > items.length`.
