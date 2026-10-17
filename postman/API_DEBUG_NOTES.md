# API Debug Notes — Food Marketplace

**Date:** 2026-09-24 · **Target:** `http://localhost:3000/api` (Docker Compose stack)
**Tool:** Postman collection, run with Newman 6 (Postman's CLI runner)

## Files

| File | Purpose |
|---|---|
| `FoodMarketplace.postman_collection.json` | 178 requests / 228 assertions in 16 folders (chat: folder 14). Import it into Postman. |
| `local.postman_environment.json` | `baseUrl = http://localhost:3000/api` |

### How to run

- **Postman:** import both files, select the *Food Marketplace - local* environment, then use **Run collection** and run the folders in order.
  The requests are chained: tokens and IDs are saved as collection variables. Each run creates its own users and data with a unique suffix `{{sfx}}`, so you can re-run it against the same DB.
- **CLI:**
  ```bash
  cd postman
  npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json
  ```

## Result summary

| | Total | Failed |
|---|---|---|
| Requests | 152 | 0 (no 5xx, no network errors) |
| Assertions | 185 | 2 on first pass → **0 after fixes** (see [API_ERRORS_EXPLAINED.md](API_ERRORS_EXPLAINED.md)) |

Timing: the whole run takes about 14 s, and the average response time is 15 ms (max 139 ms).
The slowest calls are register, login and change-password, which is expected because of bcrypt hashing.

## Environment issues found before testing

1. **The backend container was stopped.** `food-marketplace-backend-1` had `Exited (137)`, but `db` and `frontend` were still up, so `/api` was unreachable.
   Its last log showed a normal start. `OOMKilled=false`, so it was killed from outside (a `docker stop`/kill, or Docker Desktop restarting). It was **not** an app crash.
   Fixed with `docker compose up -d backend`.
2. **Port 5432 conflict.** A native Windows PostgreSQL service (`postgres.exe`, PID 8044) is also listening on `0.0.0.0:5432`, next to the Docker `db` container.
   Inside Docker this has no effect, because the backend connects to host `db`. **When the backend runs locally** (`npm run start:dev`, which uses `DB_HOST=localhost`), it may connect to the Windows Postgres instead of the container and fail with auth errors or "database does not exist".
   Fix: stop the Windows service, or set `DB_PORT=5433` in the root `.env` and in `backend/.env`.

## Bugs found

### BUG-1: Wrong current password returns `401 Unauthorized` — ✅ FIXED
- **Request:** `PATCH /me/password` with `{ "currentPassword": "wrong", "newPassword": "..." }` and a valid token
- **Actual:** `401 {"message":"Current password is incorrect","error":"Unauthorized"}`
- **Expected:** `400 Bad Request` (or `403`)
- **Why it matters:** frontends usually treat any 401 as "session expired", then clear the token and log the user out. Here, a typo in the current-password field would log the user out.
- **Where:** [users.service.ts:42](../backend/src/modules/users/users.service.ts#L42). Change `UnauthorizedException` to `BadRequestException`.

### BUG-2: `lat` without `lng` (or the reverse) is silently ignored — ✅ FIXED
- **Request:** `GET /stores?lat=21.02`
- **Actual:** `200`. The request returns the unfiltered store list, and the caller gets no sign that the geo filter was dropped.
- **Expected:** `400`, "lat and lng must be provided together"
- **Where:** [stores.service.ts:64](../backend/src/modules/stores/stores.service.ts#L64) only applies the filter when both are set.
  Add a check there, or use `@ValidateIf` / a custom validator in `ListStoresQueryDto`.
- **Severity:** low.

## Checked and working as intended

These failed on the first run, but the API was right and my expectation was wrong. The tests were changed to match:

- `PATCH /deliveries/:id` on a delivery that is already `delivered` → `400 "Delivery is already delivered"`. This is correct: a finished delivery is locked.
- A non-author editing someone else's review → `404` (not `403`). The API consistently hides resources the caller doesn't own. Other users' addresses and orders also return 404.

## Coverage: behavior verified correct

- **Auth:** register (customer / store_owner), 409 on duplicate username, 400 for the `admin` role on self-register, 400 for unknown fields (`forbidNonWhitelisted`), login by username or email, 401 for a wrong password / missing token / garbage token, no password hash in responses.
- **Me / Users:** profile update, password change followed by login with the new password, admin list filters, 403 for non-admins, 404 for a missing user, 400 for a non-numeric id. **A suspended user can't log in (403).**
- **Categories:** auto slug, child category tree, 409 on duplicate slug, 400 when a category is set as its own parent, **409 when deleting a category that is in use**, 403 for non-admins.
- **Stores:** new stores start `pending` and are hidden from the public (404), an owner can't approve their own store (403), admin approval works, the geo search (`lat/lng/radiusKm`) finds the store, `q` + `categoryId` filters work, location CRUD works, member add / 409 duplicate / promote / remove works, `/me/stores` works.
- **Products:** create with images and required option groups, 400 for a negative price and for `salePrice > price`, sort `price_asc`, price-range filter, image / option-group / option CRUD, 400 when `minSelection > maxSelection`, 404 after delete.
- **Addresses:** the first address becomes the default automatically, switching the default leaves exactly one default, 404 for another user's address.
- **Cart:** add, update, remove; 400 over stock; 400 for quantity 0; 404 for an unknown product.
- **Checkout:** 400 for an empty `items` list, 400 when a required option is missing, 404 for another user's address, 400 for an empty cart, 409 over stock.
  - Whole-cart checkout total = 2 × 45,000 (sale price) + 15,000 delivery fee = **105,000**, and the cart is emptied afterwards.
  - The option price modifier is applied (30,000 + 5,000 = 35,000).
  - Cancelling restores stock. Cancelling twice returns 400, and a customer can't cancel once the order is `delivering`.
- **Store orders:** the full status flow `pending→confirmed→preparing→ready→delivering→completed` works, skipping a status returns 400, and a non-member gets 403.
  After `completed`, the parent order is `completed`, the cash payment is `paid` and the delivery is `delivered`.
- **Payments:** admin refund works, an invalid transition (`refunded→pending`) returns 400, a customer gets 403.
- **Reviews:** requires a completed order (a cancelled order returns 400), reviewing twice returns 409, a rating of 6 returns 400, `averageRating` is correct, admin can delete.
- **Favorites:** `PUT` is idempotent, unknown product returns 404, list and delete work.

## Next steps

- [x] Fix BUG-1 and BUG-2 (collection is fully green).
- [ ] Resolve the port 5432 conflict before running the backend outside Docker.
- [ ] Optional: add `newman run` to CI as a smoke/regression test.
