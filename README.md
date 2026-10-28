# Food Marketplace

NestJS + Sequelize + PostgreSQL REST API, with a Next.js storefront, all run by Docker Compose.

```
.
├── docker-compose.yml        # db (postgres:16) + backend (NestJS) + frontend (Next.js)
├── backend/
│   ├── .sequelizerc          # sequelize-cli paths
│   ├── database/
│   │   ├── config.js         # sequelize-cli DB config (env driven)
│   │   ├── helpers.js        # migration helpers (FKs, CHECKs, ...)
│   │   ├── migrations/       # schema, written with the Sequelize QueryInterface
│   │   └── seeders/          # admin user + starter categories
│   └── src/
│       ├── common/
│       │   ├── guards/       # jwt-auth.guard.ts, roles.guard.ts (global)
│       │   ├── decorators/   # @CurrentUser(), @Public(), @Roles()
│       │   └── filters/      # Sequelize error -> HTTP status
│       ├── database/models/  # sequelize-typescript models (one per table)
│       ├── modules/          # auth, users, addresses, categories, stores,
│       │                     # products, cart, orders, reviews, favorites, health
│       └── app.module.ts     # module wiring + global auth guards
└── frontend/                 # Next.js + Redux Toolkit storefront, proxies /api -> backend
```

## Run with Docker

```bash
cp .env.example .env          # optional - compose has sensible defaults
docker compose up -d --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| API      | http://localhost:3000/api    |
| Postgres | localhost:5432 (postgres/postgres) |

When the backend container starts it runs `sequelize-cli db:migrate`, then `db:seed:all`, then starts the API.
Seeders are tracked in `sequelize_data`, so they run only once.
Default admin: **admin123@gmail.com / 1234568@A** (set this with `ADMIN_*` env vars).

Demo data (seeder `20261026000001-demo-stores.js`, password `1234568@A` for every owner). Dish photos come from `backend/database/seed-images/` (PNGs extracted from `store-img/*.svg`) and are copied into the uploads volume when seeding:

| Store | Owner login | Address |
|---|---|---|
| Bún Cô Dung | dungcao1997@gmail.com | 213 Xô Viết Nghệ Tĩnh, Đà Nẵng |
| Xôi Bà Mười | muoimuoi123@gmai.com | 3 Quang Trung, Đà Nẵng |
| Cơm Nhà Dủ | du@gmail.com | 12 Trần Văn Dư, Đà Nẵng |

To wipe all data and uploads and seed again: `docker compose stop backend && docker compose run --rm --no-deps backend npm run db:reset && docker compose up -d backend` (or `npm run db:reset` in `backend/` for a local DB).

Maps and address search use [VietMap](https://maps.vietmap.vn) when configured: `VIETMAP_API_KEY` (server only, for autocomplete / place / reverse geocoding) and `VIETMAP_TILE_KEY` (sent to browsers for map tiles; restrict it to your domain). Without them the maps use Esri tiles and addresses are typed by hand. Addresses use Vietnam's 2-level units since 2025-07-01 (ward -> province); `district` is kept only on older rows.

The frontend calls the relative path `/api/...`. A Next.js rewrite proxies it to the backend, so no CORS setup is needed.

## Run the backend locally (without Docker)

```bash
docker compose up -d db       # or use your own Postgres
cd backend
cp .env.example .env
npm install
npm run db:migrate && npm run db:seed
npm run start:dev
```

Migration commands: `db:migrate`, `db:migrate:undo`, `db:migrate:undo:all`, `db:migrate:status`,
`migration:generate <name>`.

## Auth guards

Both guards live in `src/common/guards` and are registered globally (`APP_GUARD`) in `AppModule`. See `docs/AUTH_GUARDS.md`.

- **`JwtAuthGuard`** reads `Authorization: Bearer <jwt>` and verifies it. It then reloads the user, so a suspended or deleted account is rejected right away, and sets `req.user`.
  It runs on every route. Routes marked `@Public()` are open; a valid token there still sets `req.user`, and a bad one is ignored.
- **`RolesGuard`** returns 403 unless `req.user.role` is one of the roles in the route's `@Roles(...)`.
  - `@Roles('admin')` covers `/users/*`, `/admin/*`, category writes, `PATCH /stores/:id/status`, `PATCH /payments/:id/status`, `PATCH /deliveries/:id`, `GET /chat/support` and `POST /chat/support/:userId`.
  - `POST /stores` is open to any signed-in user. A `customer` who creates a store is promoted to the `member` role in the same transaction.

Access to a specific store is checked in the services by `StoreAccessService`, using `store_members` (owner / manager / staff). The global role can't answer this, because a customer account can also be a staff member of a store.

## Endpoints (prefix `/api`)

🌐 public · 🔒 logged in · 👑 admin · 🏪 store member (checked per store)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /health | 🌐 | API + DB status |
| POST | /auth/register | 🌐 | role: `customer` \| `store_owner` |
| POST | /auth/login | 🌐 | `{ login: username or email, password }` |
| GET | /auth/social/config | 🌐 | `{ google, facebook }`: public client/app ids, `null` when that provider isn't configured |
| POST | /auth/google | 🌐 | `{ idToken }` from Google Identity Services → same as login. First use creates a customer, or links to the user with that email |
| POST | /auth/facebook | 🌐 | `{ accessToken }` from the Facebook JS SDK → same as login. 400 if the Facebook account shares no email |
| POST | /auth/forgot-password | 🌐 | `{ email }` → emails a 6-digit code (10 min, 60 s resend cooldown); always 200. No `SMTP_HOST` → code is logged |
| POST | /auth/verify-reset-code | 🌐 | `{ email, code }` → `{ valid: true }` or 400; 5 wrong tries voids the code |
| POST | /auth/reset-password | 🌐 | `{ email, code, newPassword }` → same as login (token + user) |
| POST | /auth/refresh | 🌐 | `{ refreshToken }` → new `{ accessToken, refreshToken, user }`; the old refresh token stops working. 401 if reused/revoked/expired, 403 if the account is not active |
| POST | /auth/logout | 🌐 | `{ refreshToken }` → revokes it (expired tokens accepted); always 200 |
| GET | /auth/me | 🔒 | |
| GET | /me · PATCH /me/profile · PATCH /me/password | 🔒 | |
| POST/DELETE | /me/avatar | 🔒 | multipart field `file` (JPEG/PNG/WebP, ≤ 2 MB); served from /api/uploads |
| POST | /uploads/images | 🔒 | multipart field `file` (JPEG/PNG/WebP, ≤ 5 MB) → `{ url }`, a `/api/uploads/images/…` path accepted by product `imageUrl` and store `coverUrl`/`logoUrl` |
| GET | /me/stores | 🔒 | stores I own / work at |
| GET/PATCH/DELETE | /users, /users/:id | 👑 | list with `?role&status&q`, change role/status |
| GET | /admin/stats | 👑 | dashboard: totals, zero-filled daily orders/revenue (`?days=7..365`, default 30), breakdowns by status/role/payment method, top stores and products |
| GET | /admin/stores · /admin/products · /admin/orders | 👑 | every status (unlike the public lists). `?q&status&page&limit`; products also `storeId&categoryId`; orders `q` matches id, username or email |
| GET/POST | /addresses | 🔒 | |
| GET/PATCH/DELETE | /addresses/:id · PATCH /addresses/:id/default | 🔒 | Deleting the default promotes the newest remaining address. Placed orders are unaffected (they keep a copy) |
| GET | /geo/config | 🌐 | `{ tileKey, geocoding }`: VietMap tile key for the browser (`null` = default Esri tiles) and whether address search is on |
| GET | /geo/autocomplete?text=&lat=&lng= | 🔒 | VietMap address suggestions `[{ refId, name, address, display }]`, biased towards `lat,lng` |
| GET | /geo/place?refId= | 🔒 | Resolve a suggestion: `{ addressLine, ward, city, latitude, longitude, display }` |
| GET | /geo/reverse?lat=&lng= | 🔒 | Address at a map point, same shape as `/geo/place`. `/geo/*` lookups return 503 without `VIETMAP_API_KEY` |
| GET | /categories · /categories/:id | 🌐 | tree |
| POST/PATCH/DELETE | /categories[/:id] | 👑 | |
| GET | /stores | 🌐 | `?q&categoryId&lat&lng&radiusKm&page&limit` (nearest first when lat/lng are given; `categoryId` includes its subcategories) |
| GET | /stores/:id · /stores/:id/locations | 🌐 | active stores only |
| POST | /stores | 🔒 | new stores start as `pending`; a customer becomes `member` |
| PATCH | /stores/:id/status | 👑 | approve / suspend |
| GET | /stores/:id/manage | 🏪 | includes non-active stores |
| GET | /stores/:id/stats | 🏪 owner/manager | owner dashboard: totals (revenue, commission, customers, rating), zero-filled daily orders/revenue (`?days=7..365`), orders/products by status, top products, low stock |
| GET | /stores/:storeId/products | 🏪 | the store's own catalogue, every status. `?q&status&page&limit` |
| PATCH/DELETE | /stores/:id | 🏪 owner/manager (delete: owner) | DELETE is a soft delete (`deleted_at`): also soft-deletes its products and clears them from carts; 409 while store orders are in progress; order history keeps the store |
| PUT | /stores/:id/categories | 🏪 | `{ categoryIds }` |
| POST/PATCH/DELETE | /stores/:id/locations[/:locationId] | 🏪 | |
| GET/POST/PATCH/DELETE | /stores/:id/members[/:memberId] | 🏪 (writes: owner) | |
| GET | /products · /products/:id | 🌐 | `?storeId&categoryId&q&minPrice&maxPrice&sort` (`categoryId` includes its subcategories) |
| POST | /products | 🏪 | may include `images` and `optionGroups[].options` |
| PATCH/DELETE | /products/:id | 🏪 | DELETE is a soft delete (`deleted_at`) and clears the product from carts; past orders keep their snapshot |
| POST/PATCH/DELETE | /products/:id/images[/:imageId] | 🏪 | |
| POST/PATCH/DELETE | /products/:id/option-groups[/:groupId] | 🏪 | |
| POST/PATCH/DELETE | /products/:id/option-groups/:groupId/options[/:optionId] | 🏪 | |
| GET/DELETE | /cart | 🔒 | GET includes `store` (the one store the cart holds, null when empty) |
| POST | /cart/items · PATCH/DELETE /cart/items/:itemId | 🔒 | stock-checked across all lines of the product. `optionIds` optional: omitted = first available option of each required group (size S); same product + different options = separate lines. **One store per cart**: a product from another store → 409 `{ code: "CART_STORE_CONFLICT", cartStore: { id, name } }`; send `replaceCart: true` to empty the cart and add it |
| POST | /orders | 🔒 | checkout (see below); all items from one store, 400 otherwise. Optional `note` (≤ 500 chars, trimmed, blank = null) |
| GET | /orders · /orders/:id | 🔒 | own orders (admin: all), newest first. `?status&page&limit`, or `?scope=active` (in progress) / `?scope=history` (completed + cancelled); `status` wins over `scope` |
| POST | /orders/:id/cancel | 🔒 | until a store starts preparing; stock is restored |
| GET | /orders/:id/payments · /orders/:id/delivery | 🔒 | |
| GET | /stores/:storeId/orders · /store-orders/:id | 🏪 | |
| PATCH | /store-orders/:id/status | 🏪 | pending→confirmed→preparing→ready→delivering→completed (or cancelled) |
| PATCH | /payments/:id/status | 👑 | |
| PATCH | /deliveries/:id | 👑 | status / estimatedAt |
| GET | /stores/:id/reviews · /products/:id/reviews | 🌐 | includes `averageRating` and `ratingCounts` (`{1..5: n}`) |
| GET | /products/:id/reviews/mine | 🔒 | the caller's reviews of the product + `reviewableOrderIds` (completed orders with it, not yet reviewed) |
| POST | /stores/:id/reviews · /products/:id/reviews | 🔒 | needs a completed order containing it |
| PATCH/DELETE | /store-reviews/:id · /product-reviews/:id | 🔒 author / 👑 | |
| POST | /product-reviews/:id/replies | 🔒 | comment on an existing product review (`{ comment }`, ≤1000 chars); replies come back in `GET /products/:id/reviews` as `items[].replies` |
| DELETE | /product-review-replies/:id | 🔒 author / 👑 | |
| GET | /favorites/stores · /favorites/products | 🔒 | |
| PUT/DELETE | /favorites/stores/:storeId · /favorites/products/:productId | 🔒 | |
| GET | /chat/conversations | 🔒 | my conversations that have messages, newest first: `peer`, `lastMessage`, `unread` |
| GET | /chat/conversations/:id | 🔒 participant / 👑 (support) | one conversation, same shape |
| POST | /chat/conversations/direct | 🔒 | `{ userId }` → get-or-create the direct chat with an active user (400 for yourself) |
| POST | /chat/conversations/store/:storeId | 🔒 | direct chat with the owner of an active store |
| POST | /chat/conversations/support | 🔒 (not admin) | get-or-create my thread with the admin team |
| GET/POST | /chat/conversations/:id/messages | 🔒 participant / 👑 (support) | GET `?before&limit` (≤ 100, oldest first, `hasMore`) · POST `{ body }` (1–2000 chars, trimmed) |
| POST | /chat/conversations/:id/read | 🔒 participant / 👑 (support) | marks everything read |
| GET | /chat/unread | 🔒 | `{ count, support }`: `support` is the admin inbox's share |
| GET | /chat/users | 🔒 | `?q` → up to 10 active users whose username starts with `q` (no emails) |
| GET | /chat/support | 👑 | support inbox, `?page&limit` |
| POST | /chat/support/:userId | 👑 | get-or-create a user's support thread, to contact them first |

### Checkout (`POST /orders`)

```json
{
  "deliveryAddressId": 1,
  "paymentMethod": "cash",
  "items": [{ "productId": 10, "quantity": 2, "optionIds": [3] }]
}
```

Like GrabFood / ShopeeFood, an order comes from **one store**: items from several stores → 400 (the cart enforces the same rule). If you leave out `items`, the whole cart is checked out, with each line's saved options (`cart_item_options`). A new product without `optionGroups` gets a required "Kích cỡ" group: S (+0) and M (+10.000đ).

In one transaction, checkout:

- validates the option selections (min/max/required);
- reserves stock with an atomic conditional decrement, so two orders can't oversell;
- creates the order's `store_orders` row: one per store, so exactly one for new orders (orders placed before the one-store rule may have several, and still work) (delivery fee = `DELIVERY_FEE_PER_STORE`, commission = `COMMISSION_RATE`);
- copies product names, prices and options into `order_items` and `order_item_options`, and the delivery address into `orders.delivery_address` (so editing or deleting the saved address never moves an order);
- creates the `payments` and `deliveries` rows;
- removes the ordered products from the cart.

Each store moves its own store order through its statuses. The parent order status is derived from the least-advanced store order that isn't cancelled. Totals are recalculated when a store cancels. Delivery and payment follow the order: completing a cash order marks its payment `paid`, and cancelling marks a pending payment `failed` and a paid one `refunded`.

### Chat (REST + Socket.IO)

There are two kinds of conversation:

- **direct**: two users. "Message this store" opens a direct chat with the store owner.
- **support**: a user and the admin team. Each non-admin user has one thread. It has a single participant row (the user), and every admin can read and answer it. `conversations.staff_read_at` is the team's shared read marker.

Each participant row stores its own `last_read_at`, and unread counts are messages from others after it. Sending a message marks the thread read for the sender. A conversation the caller can't see returns 404.

The realtime part is a Socket.IO server at **`/api/socket.io`** (`modules/chat/chat.gateway.ts`). It sits under `/api`, so the Vite proxy (`ws: true`) and nginx (`location /api/socket.io/`) forward it like any other API request. Clients connect with `io(origin, { path: '/api/socket.io', auth: { token } })`. The handshake runs the same checks as `JwtAuthGuard`. Each socket joins `user:<id>`, and admins also join `admins`.

| Direction | Event | Payload |
|---|---|---|
| server → client | `message:new` | the message, sent to every participant (plus `admins` for support threads). The sender's other tabs get it too |
| server → client | `conversation:read` | `{ conversationId, userId, staff, readAt }` |
| server → client | `typing` | `{ conversationId, userId }`, sent to the other side only |
| client → server | `message:send` | `{ conversationId, body }` → ack `{ ok: true, data: message }` or `{ ok: false, status, error }` |
| client → server | `conversation:read` · `typing` | `{ conversationId }` → same ack shape |

REST writes broadcast the same events, so a client can send over either transport. The web app sends over the socket and falls back to REST when the socket is disconnected.

## Differences from the original SQL

- The `CREATE DATABASE` step is done by the Postgres container (`POSTGRES_DB`), or by `npm run db:create` when running locally.
- IDs use `GENERATED BY DEFAULT AS IDENTITY` (Sequelize's identity option) instead of `ALWAYS`.
- Timestamps are `TIMESTAMP WITH TIME ZONE`, which is Sequelize's `DATE` type. This avoids timezone bugs.
- The `options` table is mapped to the model `ProductOption`, so it doesn't clash with the DOM `Option` global.

All tables, columns, foreign keys (with their `ON DELETE` rules), CHECK and UNIQUE constraints, and indexes are kept with the same names.
