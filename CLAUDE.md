# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Food marketplace REST API: NestJS 11 + Sequelize 6 (`sequelize-typescript`) + PostgreSQL 16, in `backend/`. `frontend/` is the React 19 SPA storefront (Vite, react-router 7): Ant Design 6 + styled-components 6 for UI, Redux Toolkit for state (`src/redux/`); API calls are RTK Query endpoints (`src/redux/api/*Api.ts`, injected into `baseApi`) sent through a shared axios instance (`api/axiosClient.ts`: bearer token + logout-on-401 interceptors; `VITE_API_URL` overrides the default `/api`), framer-motion, react-leaflet, lucide-react. The browser calls relative `/api/...`; the Vite dev server proxies it to `BACKEND_URL` (default `http://localhost:3000`), and in Docker nginx does the same (`frontend/nginx.conf.template`, `BACKEND_URL` set at container start). `README.md` has the full endpoint and access table. Check it before you add or change routes.
## Require
-read
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

Frontend: `cd frontend && npm run dev` (Vite on :5173, proxies `/api` to `localhost:3000`). `npm run build` also type-checks. Design assets live in `frontend/public/assets/` (extracted from `assets/*.svg`); Vite's hashed output goes to `static/` so the two never mix. The brand font TTF draws glyphs ~2x their nominal size, so the `@font-face` in `src/styles/base.css` applies `size-adjust: 50%`; keep it or every heading doubles in size.

Frontend theming (light/dark): colours live in `src/theme/tokens.ts`. `brand` colours are constant; the semantic `palettes.light/dark` become CSS variables (`surfaceAlt` -> `--surface-alt`) via `GlobalStyle`, and `antdTheme(mode)` maps the same palette onto antd tokens. Styled components use `var(--...)`, never hex values, so they switch automatically: `--text`/`--surface`/`--bg` for content, `--edge` for borders, `--btn` for dark buttons, `--red-text`/`--green-text` for brand colours used as text. The mode is `ui.theme` in Redux (follows the OS until toggled, then persisted as `du.theme`). Toasts go through `toast()` in `src/lib/toast.ts` (antd message).

### Tests

There are no unit tests and no linter. The regression suite is the Postman collection: 186 chained requests in 16 folders. It needs the stack running.
```bash
cd postman
npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json
npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json --folder "<Folder name>"
```
Requests save tokens and IDs as collection variables, so a single folder may depend on earlier folders (auth, stores, etc.). Each run uses a unique `{{sfx}}`, so re-running against the same DB is safe. `postman/API_DEBUG_NOTES.md` records the verified behaviors.

## Architecture

### Auth is guards
Two global guards are registered as `APP_GUARD` in `backend/src/app.module.ts` (see `docs/AUTH_GUARDS.md`).
- `JwtAuthGuard` (`common/guards/`) runs on every HTTP route. It verifies the JWT, **reloads the user from the DB** (so suspended or deleted users are rejected), and sets `req.user` (read it with `@CurrentUser()`). Mark open routes `@Public()`. There, a valid token still sets `req.user`, and a bad or missing one is ignored (no 401).
- `RolesGuard` enforces `@Roles('admin')` on a handler or controller.
- Tokens come from `TokenService` (`modules/auth/token.service.ts`): a short access JWT plus a rotating refresh JWT (own secret), whose SHA-256 is the single `users.refresh_token_hash`. `POST /auth/refresh` rotates it, and logout, password change/reset and deactivation revoke it. See `docs/REFRESH_TOKEN_AUTH.md`.
- New routes are protected automatically. Add `@Public()` for open routes and `@Roles(...)` for admin-only ones; nothing is registered in `AppModule`. Both guards skip non-HTTP contexts.

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
- Checkout (`OrdersService`) runs in one transaction. It validates options, reserves stock with an atomic conditional decrement (`stock - n WHERE stock >= n`), creates its `store_orders` row (one store per order since 2026-10: the cart holds one store's dishes, `CartService.addItem` answers 409 `CART_STORE_CONFLICT` unless `replaceCart`; older orders may still have several store orders, so keep the lifecycle code multi-store), snapshots product and option data into `order_items` / `order_item_options`, creates the payment and delivery rows, and clears the ordered products from the cart.
- `OrderLifecycleService` keeps the parent order consistent. It derives the order status from the least-advanced non-cancelled store order, recalculates totals, restores stock on cancel, and cascades to payment and delivery. Call `sync(orderId, transaction)` after any store-order status change, **inside the caller's transaction**.
- Allowed store-order transitions are defined in `STORE_ORDER_TRANSITIONS`.
- Business constants come from env: `DELIVERY_FEE_PER_STORE`, `COMMISSION_RATE`.

### Shopping flow (GrabFood / ShopeeFood model)
- `/menu`, the landing page, search and the store page list dishes. Every dish link and add button goes to the dish's page, `/product/:id` (`lib/format.ts` `dishHref`): photos, options + quantity + add, and reviews. `/menu?store=` redirects to `/store/:id`; old `/store/:id?dish=` links redirect to `/product/:id`.
- Add to cart only through `useAddToCart()` (`hooks/useShop.ts`): it asks via `useCartSwitch()` before replacing a cart that holds another store's dishes, and handles the server's 409 `CART_STORE_CONFLICT`.

### Addresses & maps
- Orders store a JSONB copy of the address (`orders.delivery_address`, `Address.toSnapshot()`), and the API returns it as `deliveryAddress`. `delivery_address_id` is only a back-reference (ON DELETE SET NULL). Never join `addresses` to show where an order goes.
- Addresses are 2-level (ward -> province, `city` column) since the 2025 reform. `district` stays only for legacy rows, and saving from the UI clears it.
- `modules/geo/` proxies VietMap v4 (`display_type=1`); `VIETMAP_API_KEY` never leaves the server. Frontend: `components/AddressPicker` (search + ward/province + pin, reverse-geocodes map clicks), and `StoreMap/MapTiles` draws VietMap vector tiles via `@maplibre/maplibre-gl-leaflet` when `/geo/config` returns a `tileKey`, otherwise Esri raster tiles.

### Chat (`modules/chat/`)
- Conversations are `direct` (two participant rows) or `support` (one row, the user; all admins may answer, and `staff_read_at` is their shared read marker). Get-or-create is keyed on the unique `conversations.key`.
- `ChatService.access()` is the single permission check (participant, or admin on a support thread; otherwise 404). REST and socket handlers both go through `ChatService`, which broadcasts via `ChatEvents` (the gateway binds the Socket.IO server into it at start-up), so they behave the same.
- The gateway lives at `/api/socket.io` (not affected by the global prefix; set in `@WebSocketGateway`). It authenticates in a `server.use` handshake middleware, **not** `JwtAuthGuard`, and re-checks the user's status on every event.
- Frontend: `lib/chatSocket.ts` holds the tab's one socket, and `ChatSocketSync` folds its events into the RTK Query cache (`mergeMessages` + tag invalidation). `ChatWidget` is mounted outside the routes in `App.tsx`. Read `currentData` (not `data`) for per-conversation queries: `data` keeps the previous conversation while the next loads.
