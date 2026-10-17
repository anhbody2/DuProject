# B37 — Finished orders stay in the "active" column until the page reloads

| | |
|---|---|
| Severity | Low |
| Area | Account page (frontend) |
| Status | Open, found 2026-10-02 |
| Where | `frontend/src/pages/AccountPage/index.tsx` (`CurrentOrder`, `useOrdersQuery({ scope: 'active' })`) |

## The bug

The active column is a one-time `GET /orders?scope=active`. Each card (`CurrentOrder`) then polls
its own order with `useOrderQuery(id, { pollingInterval: 30_000 })`.

When **the store** finishes or cancels the order, the card's poll gets the new status, but nothing
refetches the active list or the history query. Their only refresh comes from the `Orders` tag,
which is invalidated only by the customer's own checkout or cancel. So:

- a delivered order keeps a tracking card in "ĐƠN HÀNG", now reading "Đã giao";
- an order the store cancelled stays there as "Đã huỷ";
- neither appears in "LỊCH SỬ" (so no "Đặt lại") until the user reloads or places another order.

## Steps to reproduce

1. Place an order and keep `/account` open.
2. As the store, move it to `completed` (or cancel it).
3. Within 30 s the card shows "Đã giao", but it stays in the active column, and history doesn't
   change.

## Suggested fix

When a polled order reaches a finished status, invalidate the list:

```ts
// CurrentOrder
const finished = o && ['completed', 'cancelled'].includes(o.status);
useEffect(() => { if (finished) dispatch(baseApi.util.invalidateTags(['Orders'])); }, [finished, dispatch]);
```

Alternatively, push order status changes over the existing Socket.IO connection (see the
"Live order notifications" item in the expansion plan) and invalidate `Orders` when one arrives.
