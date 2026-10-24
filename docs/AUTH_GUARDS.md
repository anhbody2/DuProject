# Auth: from middleware to guards

Authentication and global-role checks moved from Express-style middleware to NestJS **guards** (2026-10-19).
API behaviour is unchanged: the same routes are public, signed-in or admin-only, with the same status codes.
The full Postman suite passes (186 requests, 242 assertions).

## Why

The middleware could not see which handler would run. Middleware runs before routing, so it gets no `ExecutionContext` and can't read decorators.
The access rules were therefore kept in `AppModule.configure()` as lists of URL strings. That had four problems:

| Problem | Example |
|---|---|
| **New routes had no auth by default.** A controller missing from `PROTECTED_CONTROLLERS` got no auth, and `req.user` was `undefined`. | Forgetting one array entry silently made a whole controller public. |
| **Rules lived far from the code.** You could not tell from a controller which of its routes were public or admin-only. | `categories.controller.ts` gave no hint that `PATCH :id` was admin-only. |
| **The string lists could drift from the real routes.** Renaming a route dropped its admin check, with no compile error. | `{ path: 'categories/:id', method: PATCH }` |
| **Path patterns could exempt the wrong route.** | A future `GET stores/mine` would match the public `GET stores/:id` and run without auth. |

Guards run after routing, so they can read metadata off the handler. That makes **protected the default**, and the rules sit next to the routes they protect.

## What changed

### New files

| File | Purpose |
|---|---|
| `backend/src/common/guards/jwt-auth.guard.ts` | `JwtAuthGuard`: verifies the bearer JWT, reloads the user (rejects deleted users with 401 and suspended users with 403), sets `req.user`. Same logic as the old `AuthMiddleware`. |
| `backend/src/common/guards/roles.guard.ts` | `RolesGuard`: enforces `@Roles(...)`. Routes without `@Roles` pass. |
| `backend/src/common/decorators/public.decorator.ts` | `@Public()`: opts a route or controller out of required auth. |
| `backend/src/common/decorators/roles.decorator.ts` | `@Roles('admin', ...)`: restricts a route or controller to global roles. A handler-level `@Roles` overrides the controller-level one. |

### Removed

- `backend/src/common/middlewares/auth.middleware.ts`
- `backend/src/common/middlewares/check-role.middleware.ts`
- In `app.module.ts`: `PUBLIC_ROUTES`, `PROTECTED_CONTROLLERS`, `configure()` / `NestModule`, and the controller imports they needed.

### `app.module.ts`

Both guards are registered globally. Their order is their execution order:

```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

### Controllers

| Controller | Decorators added |
|---|---|
| `AuthController` | `@Public()` on register, login, google, facebook, social/config, forgot-password, verify-reset-code, reset-password, refresh, logout (`GET auth/me` stays protected) |
| `CategoriesController` | `@Public()` on `GET /`, `GET :id`; `@Roles('admin')` on POST, PATCH, DELETE |
| `StoresController` | `@Public()` on `GET /`, `GET :id`, `GET :id/locations`; `@Roles('admin')` on `PATCH :id/status` |
| `ProductsController` | `@Public()` on `GET /`, `GET :id` |
| `ReviewsController` | `@Public()` on `GET stores/:id/reviews`, `GET products/:id/reviews` |
| `GeoController` | `@Public()` on `GET config` |
| `ChatController` | `@Roles('admin')` on `GET support`, `POST support/:userId` |
| `HealthController` | `@Public()` on the class (the old middleware never covered it; the global guard now would) |
| `UsersController`, `AdminController`, `AdminOrdersController` | `@Roles('admin')` on the class |

Comments that pointed to `AuthMiddleware` / `CheckRole in AppModule` were updated as well.

## Behaviour details

- **Optional auth on public routes.** On a `@Public()` route, a valid token still sets `req.user`. A missing, expired or rejected token is **ignored** and the request runs as anonymous.
  This matches the old behaviour, where public routes skipped the middleware entirely. Rejecting with 401 instead would make the frontend's logout-on-401 interceptor sign out users who are only browsing the menu with a stale token.
  New possibility: a public handler can personalise its response with `@CurrentUser()`. It must handle `undefined`.
- **Status codes are unchanged:** 401 for a missing or invalid token or a deleted user, 403 for a suspended account or the wrong role.
- **WebSockets.** Global guards also run on gateway handlers, so both guards skip non-HTTP contexts (`ctx.getType() !== 'http'`). The chat gateway keeps its own handshake auth and its per-event status check.
- **Per-store permissions are unchanged.** Owner, manager and staff are not global roles; services still check them with `StoreAccessService.assert()`.
- **Static `/uploads`** is served by Express static, not a Nest route, so the guards don't touch it.

## How to use it

```ts
@Controller('things')
export class ThingsController {
  @Public()                 // anyone; req.user set if a valid token was sent
  @Get()
  list() {}

  @Post()                   // any signed-in, active user (the default)
  create(@CurrentUser() user: AuthUser) {}

  @Roles('admin')           // admins only
  @Delete(':id')
  remove() {}
}

@Roles('admin')             // every route in the controller
@Controller('admin-things')
export class AdminThingsController {}
```

A new controller needs no registration in `AppModule`: it is protected as soon as it exists.

## Verification

- `npm run build` succeeds.
- Smoke test: `GET /api/users` without a token returns 401. `GET /api/products` returns 200 with no token and with a junk token. `GET /api/auth/me` with a junk token returns 401.
- Postman suite (`npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json`): 186/186 requests and 242/242 assertions pass.
