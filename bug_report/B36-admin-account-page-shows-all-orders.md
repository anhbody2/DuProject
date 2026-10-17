# B36 — An admin's account page shows every customer's orders as their own

| | |
|---|---|
| Severity | Medium |
| Area | Orders API + account page |
| Status | Open, found 2026-10-02 |
| Where | `backend/src/modules/orders/orders.service.ts` `findAll()`; `frontend/src/pages/AccountPage/index.tsx` |

## The bug

`GET /orders` is the "my orders" endpoint used by `/account`. For admins it removes the owner
filter:

```ts
// orders.service.ts, findAll()
if (user.role !== 'admin') Object.assign(where, { userId: user.id });
```

The account page calls it twice: `useOrdersQuery({ scope: 'active' })` for the tracking cards and
`useOrderHistoryInfiniteQuery()` for history. So an admin who opens their own account page sees:

- one tracking card **for every in-progress order on the platform**. Each card polls
  `GET /orders/:id` every 30 s and has a working **"Huỷ đơn"** button, because the API lets admins
  cancel any order;
- the platform-wide order history, with "Đặt lại" on other people's orders. Reordering copies a
  stranger's dishes into the admin's cart.

The `scope` paging added on 2 Oct made this more visible. Before, the page only took the 20 newest
orders.

## Steps to reproduce

1. As customer A, place an order (it stays `pending`).
2. Sign in as `admin` and open `/account`. A's order appears as a tracking card under "ĐƠN HÀNG",
   with A's address and a cancel button.
3. Clicking "Huỷ đơn" cancels **A's** order.

## Impact

- An admin can cancel a customer's order by mistake while thinking it's their own test order.
- The admin console has its own endpoint (`GET /admin/orders`, used by `adminApi`), so nothing
  needs the "admin sees all" behaviour of `GET /orders`.
- With N active orders, the page runs N pollers every 30 s, which adds load as the platform grows.

## Suggested fix

Make `GET /orders` always mean "my orders". Admins already list everything through
`/admin/orders`:

```ts
// orders.service.ts, findAll()
const where: WhereOptions<Order> = { userId: user.id };
```

Keep the admin bypass in `findOne`, `cancel`, `findPayments`, and `findDelivery`, because the admin
console's order drawer uses those. Before changing it, check that no Postman request expects
`GET /orders` as admin to return other users' orders. A quick search found only status-code
assertions.

## How to verify after the fix

1. Repeat the steps above. The admin's `/account` shows only orders the admin placed.
2. `/admin/orders` still lists every order.
