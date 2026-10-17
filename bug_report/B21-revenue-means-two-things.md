# B21 — "Revenue" meant two different things on the same dashboard

| | |
|---|---|
| Severity | Low |
| Area | Admin and store dashboards |
| Status | Fixed — 2026-09-29 |
| Files changed | `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/stores/stores.service.ts`, `frontend/src/pages/AdminPage/DashboardView.tsx`, `frontend/src/pages/StoreDashboardPage/DashboardView.tsx` |

## The bug

Each dashboard shows a headline tile "Doanh thu đã hoàn tất" and a "Doanh thu N ngày" chart. The
two were calculated with different rules:

| Number | Admin (before) | Store console (before) |
|---|---|---|
| Tile `totals.revenue` | `SUM(orders.total)` where status = **completed** | `SUM(store_orders.subtotal)` where status = **completed** |
| Chart `daily[].revenue` | `SUM(orders.total)` where status **≠ cancelled** (includes pending, preparing, delivering…) | `SUM(subtotal)` where status **≠ cancelled** |
| Top stores / top dishes | status **≠ cancelled** | status **≠ cancelled** |

So the chart's period total could be much larger than the "completed revenue" tile over the same
days. Orders still in the kitchen, or orders that would be cancelled later, counted as revenue, and
the "top dishes" list ranked dishes nobody had received yet.

## The definitions now

Documented in comments on both `stats()` methods:

| Term | Admin (platform) | Store console |
|---|---|---|
| **revenue** | GMV of **completed** orders: `orders.total` (food + delivery fee) | **Completed** store orders: `store_orders.subtotal` (food only; the delivery fee isn't the store's) |
| **pendingRevenue** | Orders not completed and not cancelled | Store orders not completed and not cancelled |
| **commission** | `commission_amount` of completed store orders | Same, for this store |
| **orders** (daily) | Orders **placed** that day, any status | Store orders placed that day, any status |

Revenue is attributed to the day the order was **placed** (`created_at`), as before.

## What changed

**Backend**

- `admin.service.ts` `stats()`
  - Daily series: `FILTER (WHERE o.status <> 'cancelled')` → `FILTER (WHERE o.status = 'completed')`.
  - Top stores: `WHERE so.status <> 'cancelled'` → `WHERE so.status = 'completed'`.
  - Top dishes: same change.
  - Added a doc comment defining revenue, pendingRevenue, commission, and orders.
- `stores.service.ts` `stats()`
  - Daily series and top dishes now use `status = 'completed'`.
  - The doc comment explains the store's definition.
- `customers` (distinct buyers) still counts every non-cancelled order, because it measures reach,
  not money.

**Frontend** (labels now say what the numbers are)

- The chart subtitle changed from "{x} từ {n} đơn (không tính đơn huỷ)" to
  **"{x} từ đơn đã hoàn tất · {n} đơn đã đặt"** on both dashboards.
- "TOP CỬA HÀNG" now shows "theo doanh thu **đã hoàn tất**".
- "MÓN BÁN CHẠY" now shows "theo số lượng **đã giao**".

## Impact to expect

- Recent days in the chart look lower than before: orders placed today count only once they are
  completed. That's intended. The "Đang xử lý" tile (`pendingRevenue`) still shows money in flight.
- On a new marketplace with few completed orders, the top lists may be short or empty until orders
  are delivered.
- No Postman test asserts these numbers, so the suite is unaffected.

## How to test

1. Place 2 orders today. Complete one and leave the other `pending`.
2. `GET /api/admin/stats?days=7`: today's `daily.revenue` equals the completed order's `total`,
   `totals.revenue` includes it, and `pendingRevenue` includes the other one.
3. The sum of the 7 daily values ≤ `totals.revenue`. They are equal when no completed orders are
   older than 7 days.
4. Repeat with `GET /api/stores/:id/stats` for the store (using subtotals).
