# Order note at checkout

Date: 2026-10-06

## What changed for shoppers

The checkout page has a new card, **GHI CHÚ CHO QUÁN**, below the payment method. Shoppers can
type a note for the store or the driver, for example "Ít cay, không hành, gọi trước khi giao…".
The note is optional and can be up to 500 characters, with a live character counter. Line breaks are kept.

The store and the admin see the note with the order, under the delivery address
(**Ghi chú của khách**). The shopper sees it on their current-order card in the Account page.

## Database

New migration: `backend/database/migrations/20261006000001-add-orders-note.js`

| Table    | Column | Type           | Null | Notes                                    |
|----------|--------|----------------|------|------------------------------------------|
| `orders` | `note` | `VARCHAR(500)` | yes  | NULL when the shopper leaves it blank    |

The note belongs to the order, not to a store order. Since 2026-10 an order comes from one store
(see [SINGLE_STORE_CART.md](SINGLE_STORE_CART.md)), so one note per order is enough.
Existing orders get `NULL`. The `down` migration drops the column.

```bash
# Docker: applied automatically on start (start:prod runs migrations first)
docker compose up -d --build backend
# Local backend
cd backend && npm run db:migrate
```

## API

`POST /orders` accepts a new optional field:

```json
{
  "deliveryAddressId": 12,
  "paymentMethod": "cash",
  "items": [{ "productId": 52, "quantity": 1 }],
  "note": "Ít cay, gọi trước khi giao"
}
```

- Leading and trailing whitespace is trimmed. A blank or whitespace-only note is stored as `null`.
- Over 500 characters (after trimming) or a non-string returns **400**.
- The note is returned as `note` on every order response: `POST /orders`, `GET /orders`,
  `GET /orders/:id` and the admin order list. It is also returned as `order.note` on the store-order
  endpoints (`GET /stores/:storeId/orders`, `GET /store-orders/:id`).
- The note can't be changed after checkout. No endpoint updates it.

## Code changes

### Backend

| File | Change |
|------|--------|
| `database/migrations/20261006000001-add-orders-note.js` | adds `orders.note` |
| `src/database/models/order.model.ts` | `note: string \| null` column; `ORDER_NOTE_MAX_LENGTH = 500` |
| `src/modules/orders/dto/order.dto.ts` | `CreateOrderDto.note`: `@IsOptional @Transform(trim) @IsString @MaxLength(500)` |
| `src/modules/orders/orders.service.ts` | checkout saves `note: dto.note \|\| null` |
| `src/modules/orders/store-orders.service.ts` | the included parent `Order` now selects `note` too |

### Frontend

| File | Change |
|------|--------|
| `src/redux/types.ts` | `Order.note`, `StoreOrderRow.order.note` |
| `src/redux/api/ordersApi.ts` | `CheckoutBody.note` |
| `src/lib/format.ts` | `ORDER_NOTE_MAX = 500` (mirrors the backend) |
| `src/pages/CheckoutPage/index.tsx` | new **GHI CHÚ CHO QUÁN** card; sends `note.trim() \|\| undefined` |
| `src/pages/CheckoutPage/styles.ts` | `NoteBox` (antd `Input.TextArea`) |
| `src/pages/StoreDashboardPage/OrdersView.tsx` | shows the note under the delivery address |
| `src/pages/AdminPage/OrdersView.tsx` | shows the note under the delivery address |
| `src/pages/AccountPage/index.tsx` | shows the note on the current-order card |

### Responsive behaviour

- The note card is part of the left column of the checkout `Split` grid. The grid collapses to one
  column on narrow screens, so on phones the note card sits between the payment method and the order
  summary.
- The textarea is full width and grows with its content (`autoSize` 3–6 rows).
- The textarea uses 16px text, so iOS Safari doesn't zoom in when it gets focus.
- Long words in the displayed note wrap (`overflow-wrap: anywhere`), and line breaks are kept
  (`white-space: pre-wrap`).

## Verification

- `npm run build` passes in `backend/` and `frontend/`.
- The migration ran in Docker (`20261006000001-add-orders-note: migrated`).
- Postman suite: 186/186 requests and 242/242 assertions pass.
- Manual API checks:
  - A Vietnamese multi-line note is stored trimmed, with its line breaks.
  - A whitespace-only note is stored as `null`.
  - A missing note is stored as `null`.
  - A 501-character note returns 400.
