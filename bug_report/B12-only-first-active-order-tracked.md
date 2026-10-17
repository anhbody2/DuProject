# B12 — Only the first active order gets tracking and a cancel button

| | |
|---|---|
| Severity | Medium |
| Area | Account page (frontend) |
| Status | Fixed — 2026-09-29 |
| Files changed | `frontend/src/pages/AccountPage/index.tsx` |

## The bug

The account page chose one "current" order with `list.find(ACTIVE)` and treated **everything else**
as history:

```ts
const current = list.find(ACTIVE);
const history = list.filter((o) => o !== current);
```

A customer with two orders in progress (for example, lunch from two separate checkouts) only saw
the newest one in the "ĐƠN HÀNG" column, with its progress steps, live polling, and "Huỷ đơn"
button. The second order appeared under "LỊCH SỬ" with only an "Đặt lại" (reorder) button. They
couldn't track or cancel it, and reordering it would duplicate an order that was still on its way.

### Steps to reproduce (before)

1. Place order A, then order B (both stay `pending`).
2. Open `/account`. Only B shows as a tracking card, and A sits in history with "Đặt lại".

## What changed

```ts
// after
const active = list.filter(ACTIVE);          // pending … delivering
const history = list.filter((o) => !ACTIVE(o)); // completed or cancelled
```

- The left column renders one `<CurrentOrder>` card per active order, stacked with an 18 px gap.
  Each card polls its own order every 30 s and has its own cancel button, as before.
- History now holds only finished orders (completed or cancelled), so "Đặt lại" appears only on
  orders that are actually done.
- The empty state ("Chưa có đơn đang giao") appears only when there are no active orders.

## How to test

1. Place two orders and open `/account`. You should see two tracking cards, each with "Huỷ đơn".
2. Cancel one. The orders list refetches (the `Orders` tag is invalidated), and that order moves to
   history as "Đã huỷ".
3. As the store, complete the other order. Its card shows "Đã giao" on the next 30 s poll, and it
   moves to history the next time the list reloads.

## Notes

- The list still loads the 20 most recent orders (`limit: 20`). An active order older than the 20th
  would not show, which is unlikely in practice. Add pagination if that changes.
