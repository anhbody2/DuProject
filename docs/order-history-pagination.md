# Order history: paginated, 5 at a time with infinite scroll

_2026-10-02_

## Problem

The account page (`/account`, tab **ĐƠN HÀNG**) made one request, `GET /orders?limit=20`, and
split the result in the browser into **active** orders (tracking cards) and **history**
(completed + cancelled).

- History showed only the finished orders among the 20 newest. Older orders could not be reached.
- An active order older than the 20 newest finished ones disappeared from the tracking column.
- Every visit loaded 20 full orders, even when the user only looked at the top few.

## What changed

### Backend

| File | Change |
|---|---|
| `backend/src/database/models/order.model.ts` | New `FINISHED_ORDER_STATUSES = ['completed', 'cancelled']`. This is the single definition of "history". |
| `backend/src/modules/orders/dto/order.dto.ts` | `ListOrdersQueryDto` gets an optional `scope: 'active' \| 'history'` (validated by `@IsIn`; any other value returns 400). |
| `backend/src/modules/orders/orders.service.ts` | `findAll`: `scope=history` filters `status IN (completed, cancelled)`, and `scope=active` filters `status NOT IN (...)`. When `status` is also sent, `status` wins. Sort is now `createdAt DESC, id DESC`, so page boundaries stay stable when two orders share a timestamp. |

API (still paginated by the shared `page` / `limit`, `limit` ≤ 100):

```
GET /api/orders?scope=history&page=1&limit=5   → 5 newest finished orders + meta { page, limit, total, totalPages }
GET /api/orders?scope=history&page=2&limit=5   → next 5
GET /api/orders?scope=active                   → orders still in progress
```

The call is backward compatible. Without `scope` it behaves exactly as before.

### Frontend

| File | Change |
|---|---|
| `frontend/src/redux/api/ordersApi.ts` | `orders` now takes optional `{ scope, page, limit }`. New **infinite query** `orderHistory` (RTK Query `build.infiniteQuery`, RTK ≥ 2.6) requests `scope=history`, `HISTORY_PAGE_SIZE = 5` per page, and gets the next page from `meta.page < meta.totalPages`. Exports `useOrderHistoryInfiniteQuery`. |
| `frontend/src/hooks/useOnVisible.ts` | New reusable hook. It returns a ref, and an `IntersectionObserver` calls back when that element comes within 200px of the viewport. |
| `frontend/src/pages/AccountPage/index.tsx` | The active column uses `useOrdersQuery({ scope: 'active' })`. The history column uses `useOrderHistoryInfiniteQuery()` and puts a sentinel `<div>` after the last row. When it scrolls into view, the next 5 load (a spinner shows meanwhile). Removed the client-side `ACTIVE` filter and a leftover `console.log(history)`. |

### Docs
- `README.md`: the `GET /orders` row documents `scope`.

## Behaviour details

- **Loading more:** the observer is enabled only while `hasNextPage && !isFetchingNextPage && !isError`. Re-enabling it after each page re-checks the sentinel, so a tall screen keeps loading until it is filled or history runs out. An error stops automatic retries.
- **Freshness:** both queries provide the `Orders` tag. Checkout and cancel invalidate it, and RTK then refetches **every loaded page** of the infinite query, so a cancelled order moves into history without a reload.
- **Offset drift:** if an order finishes while the user is paging, offsets shift by one and an order could appear on two pages. The page de-duplicates history by `id`.

## Verified

- `tsc` passes for backend and frontend.
- Against the running stack: `scope=history&limit=5` pages 1 and 2 return disjoint sets, newest first (`totalPages` correct). `scope=active` returns only in-progress orders. `scope=bogus` returns 400.
- Postman regression: 186/186 requests and 242/242 assertions pass.

## Not changed / follow-ups

- No Postman request covers `scope` yet. Consider adding one to the Orders folder.
- Admin and store order lists (`/admin/orders`, `/stores/:id/orders`) are unchanged.
