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
│       │   ├── middlewares/  # auth.middleware.ts, check-role.middleware.ts
│       │   ├── decorators/   # @CurrentUser()
│       │   └── filters/      # Sequelize error -> HTTP status
│       ├── database/models/  # sequelize-typescript models (one per table)
│       ├── modules/          # auth, users, addresses, categories, stores,
│       │                     # products, cart, orders, reviews, favorites, health
│       └── app.module.ts     # middleware route table (public / auth / roles)
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
Default admin: **admin / Admin@123** (set this with `ADMIN_*` env vars).

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

## Middlewares

Both middlewares live in `src/common/middlewares` and are wired up in `AppModule.configure()`:

- **`AuthMiddleware`** reads `Authorization: Bearer <jwt>` and verifies it. It then reloads the user, so a suspended or deleted account is rejected right away, and sets `req.user`.
  It runs on every controller except the routes listed in `PUBLIC_ROUTES`.
- **`CheckRole(...roles)`** is a middleware factory. It returns 403 unless `req.user.role` is one of the given roles.
  - `CheckRole('admin')` covers `/users/*`, category writes, `PATCH /stores/:id/status`, `PATCH /payments/:id/status` and `PATCH /deliveries/:id`.
  - `CheckRole('store_owner', 'admin')` covers `POST /stores`.

Access to a specific store is checked in the services by `StoreAccessService`, using `store_members` (owner / manager / staff). The global role can't answer this, because a customer account can also be a staff member of a store.

## Endpoints (prefix `/api`)

🌐 public · 🔒 logged in · 👑 admin · 🏪 store member (checked per store)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /health | 🌐 | API + DB status |
| POST | /auth/register | 🌐 | role: `customer` \| `store_owner` |
| POST | /auth/login | 🌐 | `{ login: username or email, password }` |
| GET | /auth/me | 🔒 | |
| GET | /me · PATCH /me/profile · PATCH /me/password | 🔒 | |
| GET | /me/stores | 🔒 | stores I own / work at |
| GET/PATCH/DELETE | /users, /users/:id | 👑 | list with `?role&status&q`, change role/status |
| GET/POST | /addresses | 🔒 | |
| GET/PATCH/DELETE | /addresses/:id · PATCH /addresses/:id/default | 🔒 | |
| GET | /categories · /categories/:id | 🌐 | tree |
| POST/PATCH/DELETE | /categories[/:id] | 👑 | |
| GET | /stores | 🌐 | `?q&categoryId&lat&lng&radiusKm&page&limit` (nearest first when lat/lng are given) |
| GET | /stores/:id · /stores/:id/locations | 🌐 | active stores only |
| POST | /stores | store_owner, 👑 | new stores start as `pending` |
| PATCH | /stores/:id/status | 👑 | approve / suspend |
| GET | /stores/:id/manage | 🏪 | includes non-active stores |
| PATCH/DELETE | /stores/:id | 🏪 owner/manager (delete: owner) | |
| PUT | /stores/:id/categories | 🏪 | `{ categoryIds }` |
| POST/PATCH/DELETE | /stores/:id/locations[/:locationId] | 🏪 | |
| GET/POST/PATCH/DELETE | /stores/:id/members[/:memberId] | 🏪 (writes: owner) | |
| GET | /products · /products/:id | 🌐 | `?storeId&categoryId&q&minPrice&maxPrice&sort` |
| POST | /products | 🏪 | may include `images` and `optionGroups[].options` |
| PATCH/DELETE | /products/:id | 🏪 | |
| POST/PATCH/DELETE | /products/:id/images[/:imageId] | 🏪 | |
| POST/PATCH/DELETE | /products/:id/option-groups[/:groupId] | 🏪 | |
| POST/PATCH/DELETE | /products/:id/option-groups/:groupId/options[/:optionId] | 🏪 | |
| GET/DELETE | /cart | 🔒 | |
| POST | /cart/items · PATCH/DELETE /cart/items/:itemId | 🔒 | stock-checked |
| POST | /orders | 🔒 | checkout (see below) |
| GET | /orders · /orders/:id | 🔒 | own orders (admin: all) |
| POST | /orders/:id/cancel | 🔒 | until a store starts preparing; stock is restored |
| GET | /orders/:id/payments · /orders/:id/delivery | 🔒 | |
| GET | /stores/:storeId/orders · /store-orders/:id | 🏪 | |
| PATCH | /store-orders/:id/status | 🏪 | pending→confirmed→preparing→ready→delivering→completed (or cancelled) |
| PATCH | /payments/:id/status | 👑 | |
| PATCH | /deliveries/:id | 👑 | status / estimatedAt |
| GET | /stores/:id/reviews · /products/:id/reviews | 🌐 | includes `averageRating` |
| POST | /stores/:id/reviews · /products/:id/reviews | 🔒 | needs a completed order containing it |
| PATCH/DELETE | /store-reviews/:id · /product-reviews/:id | 🔒 author / 👑 | |
| GET | /favorites/stores · /favorites/products | 🔒 | |
| PUT/DELETE | /favorites/stores/:storeId · /favorites/products/:productId | 🔒 | |

### Checkout (`POST /orders`)

```json
{
  "deliveryAddressId": 1,
  "paymentMethod": "cash",
  "items": [{ "productId": 10, "quantity": 2, "optionIds": [3] }]
}
```

If you leave out `items`, the whole cart is checked out. `cart_items` has no option columns, so a product with a required option group has to be sent through `items`.

In one transaction, checkout:

- validates the option selections (min/max/required);
- reserves stock with an atomic conditional decrement, so two orders can't oversell;
- splits the order into one `store_orders` row per store (delivery fee = `DELIVERY_FEE_PER_STORE`, commission = `COMMISSION_RATE`);
- copies product names, prices and options into `order_items` and `order_item_options`;
- creates the `payments` and `deliveries` rows;
- removes the ordered products from the cart.

Each store moves its own store order through its statuses. The parent order status is derived from the least-advanced store order that isn't cancelled. Totals are recalculated when a store cancels. Delivery and payment follow the order: completing a cash order marks its payment `paid`, and cancelling marks a pending payment `failed` and a paid one `refunded`.

## Differences from the original SQL

- The `CREATE DATABASE` step is done by the Postgres container (`POSTGRES_DB`), or by `npm run db:create` when running locally.
- IDs use `GENERATED BY DEFAULT AS IDENTITY` (Sequelize's identity option) instead of `ALWAYS`.
- Timestamps are `TIMESTAMP WITH TIME ZONE`, which is Sequelize's `DATE` type. This avoids timezone bugs.
- The `options` table is mapped to the model `ProductOption`, so it doesn't clash with the DOM `Option` global.

All tables, columns, foreign keys (with their `ON DELETE` rules), CHECK and UNIQUE constraints, and indexes are kept with the same names.
