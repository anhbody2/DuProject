# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Food marketplace REST API: NestJS 11 + Sequelize 6 (`sequelize-typescript`) + PostgreSQL 16, in `backend/`. `frontend/` is the Next.js 15 (App Router) storefront: Redux Toolkit + RTK Query for state and API calls (`src/store/`), framer-motion, react-leaflet, sonner, lucide-react. The browser calls relative `/api/...`, which a Next rewrite proxies to `BACKEND_URL` (baked in at build time; Docker passes `http://backend:3000`). `README.md` has the full endpoint and access table. Check it before you add or change routes.

## Commands

Full stack (from the repo root):
```bash
docker compose up -d --build        # db :5432, API :3000/api, frontend :5173
docker compose up -d --build backend
```
The backend container runs `npm run start:prod`, which runs migrations, then seeders, then starts the API. Seeders are tracked in `sequelize_data`, so each runs only once. Default admin: `admin / Admin@123`.

Backend on its own (from `backend/`, needs `backend/.env` copied from `.env.example`):
```bash
docker compose up -d db
npm run db:migrate && npm run db:seed
npm run start:dev                   # nest watch mode
npm run build                       # tsc via nest build -> dist/
npm run db:migrate:undo | db:migrate:status | migration:generate <name>
```
Windows gotcha: a native Windows PostgreSQL service may also listen on 5432. A local backend (`DB_HOST=localhost`) can then connect to it instead of the container. To avoid this, set `DB_PORT=5433` in both the root `.env` and `backend/.env`, or stop the Windows service.

Frontend: `cd frontend && npm run dev` (Next on :5173, proxies `/api` to `localhost:3000`). `npm run build` also type-checks. Design assets live in `frontend/public/assets/` (extracted from `assets/*.svg`). The brand font TTF draws glyphs ~2x their nominal size, so `layout.tsx` applies `size-adjust: 50%`; keep it or every heading doubles in size.

### Tests

There are no unit tests and no linter. The regression suite is the Postman collection: 152 chained requests in 15 folders. It needs the stack running.
```bash
cd postman
npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json
npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json --folder "<Folder name>"
```
Requests save tokens and IDs as collection variables, so a single folder may depend on earlier folders (auth, stores, etc.). Each run uses a unique `{{sfx}}`, so re-running against the same DB is safe. `postman/API_DEBUG_NOTES.md` records the verified behaviors.

## Architecture

### Auth is middleware, not guards
Authentication and global-role checks are all wired in one place: `AppModule.configure()` in `backend/src/app.module.ts`.
- `AuthMiddleware` applies to every controller in `PROTECTED_CONTROLLERS` except the routes in `PUBLIC_ROUTES`. It verifies the JWT, **reloads the user from the DB** (so suspended or deleted users are rejected), and sets `req.user` (read it with `@CurrentUser()`).
- `CheckRole(...roles)` is a middleware factory, applied per route or controller after auth.
- **A new controller must be added to `PROTECTED_CONTROLLERS`** (and a new public GET to `PUBLIC_ROUTES`). Otherwise it gets no auth and `req.user` is undefined.

Per-store authorization (owner / manager / staff via `store_members`) is **not** a global role. Services check it with `StoreAccessService.assert(user, storeId, roles)` in `modules/stores/store-access.service.ts`. Admins and the store owner always pass.

### Database: migrations own the schema
- `synchronize` is off. Schema changes go in `backend/database/migrations/*.js` (plain JS, QueryInterface, using the helpers in `database/helpers.js`: `pk()`, `timestamps()`, `foreignKey`, `check`, `unique`). Then update the matching `sequelize-typescript` model in `src/database/models/`.
- New models must be registered in the `MODELS` array in `src/database/models/index.ts`. `DatabaseModule` is `@Global` and calls `forFeature(MODELS)`, so any service can `@InjectModel(X)` without importing a module.
- Constraint and index names match the original SQL spec. Keep them when you edit.
- The `options` table maps to the model `ProductOption`.
- `src/database/pg-types.ts` (imported first in `main.ts`) makes BIGINT and NUMERIC come back as JS numbers instead of strings.
- Money is `NUMERIC(12,2)`. Do arithmetic in integer cents with `toCents` / `fromCents` from `common/utils/money.ts`.

### Error conventions
- `SequelizeExceptionFilter` maps unique-constraint and FK errors to 409, and validation and CHECK violations to 400. Services can rely on DB constraints instead of pre-checking.
- The global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted` + implicit conversion. Unknown body or query fields return 400.
- Resources the caller doesn't own return **404, not 403** (addresses, orders, reviews). This hides whether they exist.
- 401 means only a missing or invalid session. A bad input from an authenticated user (for example a wrong current password) returns 400, because clients log the user out on 401.

### Orders (most complex area: `modules/orders/`)
- Checkout (`OrdersService`) runs in one transaction. It validates options, reserves stock with an atomic conditional decrement (`stock - n WHERE stock >= n`), splits the order into one `store_orders` row per store, snapshots product and option data into `order_items` / `order_item_options`, creates the payment and delivery rows, and clears the ordered products from the cart.
- `OrderLifecycleService` keeps the parent order consistent. It derives the order status from the least-advanced non-cancelled store order, recalculates totals, restores stock on cancel, and cascades to payment and delivery. Call `sync(orderId, transaction)` after any store-order status change, **inside the caller's transaction**.
- Allowed store-order transitions are defined in `STORE_ORDER_TRANSITIONS`.
- Business constants come from env: `DELIVERY_FEE_PER_STORE`, `COMMISSION_RATE`.
