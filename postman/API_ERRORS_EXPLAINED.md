# Explanation of the API Errors Found During Postman Testing

**Date:** 2026-09-24 · **Status:** both fixed and verified (Postman/Newman run: 152 requests, 185/185 assertions passing)

This note explains the errors found in the [Postman debug run](API_DEBUG_NOTES.md): what went wrong, why it matters, and how each one was fixed.
It also covers two results that looked like errors but were correct, and the two setup problems found before testing.

---

## BUG-1: Wrong current password returned `401 Unauthorized`

### What happened
```http
PATCH /api/me/password
Authorization: Bearer <valid token>

{ "currentPassword": "wrong", "newPassword": "NewPassw0rd!" }
```
```json
401 { "message": "Current password is incorrect", "error": "Unauthorized", "statusCode": 401 }
```

### Why it's an error
HTTP status codes have agreed meanings, and clients act on them:

| Code | Meaning | What a client usually does |
|---|---|---|
| **401 Unauthorized** | "I don't know who you are": the token is missing, invalid or expired | Clear the token and **send the user to the login page** |
| **400 Bad Request** | "I know who you are, but the data you sent is wrong" | Show the error message next to the form |

In this request the token is **valid**, so the server does know who the user is. Only a field in the body is wrong, and that is a **400** case.

**Real-world effect:** most frontends have a global HTTP interceptor like this:
```js
if (response.status === 401) { logout(); redirect('/login'); }
```
With the old behavior, a user who mistyped their current password on the "Change password" form would be **logged out** and lose what they had typed, instead of seeing "Current password is incorrect".

### Root cause
[users.service.ts](../backend/src/modules/users/users.service.ts) `changePassword()` threw `UnauthorizedException` (which NestJS maps to 401) for a validation failure.

### Fix
```diff
- throw new UnauthorizedException('Current password is incorrect');
+ // 400, not 401: clients treat 401 as an expired session and log the user out.
+ throw new BadRequestException('Current password is incorrect');
```
The unused `UnauthorizedException` import was removed.

> `POST /auth/login` with a wrong password still returns **401**. That is correct: at login the user has no identity yet.

---

## BUG-2: `lat` without `lng` was silently ignored

### What happened
```http
GET /api/stores?lat=21.02
```
```
200 OK   →  every active store, newest first (no distance filter)
```

### Why it's an error
The client asked for a **location-based** search but sent only half a coordinate. The server didn't report the problem. It **quietly dropped the geo filter** and returned an ordinary list.

The client can't tell anything went wrong: the result looks like "stores near you", but it is really "all stores". A bug in the calling code (for example `lng` lost because of a typo like `lon=`, or an undefined variable) would go unnoticed and show users wrong results.
The general rule: **reject input you can't honor, instead of guessing.**

### Root cause
[stores.service.ts](../backend/src/modules/stores/stores.service.ts) `findAll()` only applied the filter when **both** values were present, and did nothing when just one was:
```ts
if (query.lat !== undefined && query.lng !== undefined) { /* geo filter */ }
else { /* plain list, no error */ }
```
The DTO checks each field on its own (`@IsLatitude`, `@IsLongitude`) but never checks that they come together.

### Fix
The service now checks that the two parameters are either both present or both absent:
```ts
if ((query.lat === undefined) !== (query.lng === undefined)) {
  throw new BadRequestException('lat and lng must be provided together');
}
```

| Query | Before | After |
|---|---|---|
| `?lat=21.02` | 200 (filter ignored) | **400** |
| `?lng=105.84` | 200 (filter ignored) | **400** |
| `?lat=21.02&lng=105.84` | 200 | 200 |
| *(none)* | 200 | 200 |

---

## Two results that looked like errors but were correct

On the first run, two checks failed because the **test's expectation** was wrong. The API was right.

### `PATCH /deliveries/:id` → `400 "Delivery is already delivered"`
The test tried to change the estimated delivery time **after** the order was completed.
Once a delivery is finished it can't be edited, because changing the ETA of something already delivered makes no sense. **This is correct behavior.** The test now expects 400.

### Editing someone else's review → `404` instead of `403`
- `403 Forbidden` = "this exists, but you can't touch it". This **confirms the resource exists**.
- `404 Not Found` = "nothing here for you". This reveals nothing.

The API deliberately returns 404 for resources the caller doesn't own, and does the same for other users' addresses and orders. This stops anyone from probing IDs to discover private data.
**This is correct and consistent.** The test now expects 404.

---

## Setup problems (not code bugs)

### Backend container stopped: `Exited (137)`
Exit code **137 = 128 + 9**, which means the process received **SIGKILL**. Docker reported `OOMKilled=false`, so it didn't run out of memory. It was stopped from outside, for example by `docker stop`/`kill` or a Docker Desktop restart.
The last log lines showed a normal, successful start. **The app did not crash.**
`db` and `frontend` were still running, so the site loaded but every `/api` call failed.
**Fix:** `docker compose up -d backend`. Because of `restart: unless-stopped`, a container that was stopped by hand isn't restarted automatically.

### Two PostgreSQL servers on port 5432
A PostgreSQL service installed on Windows (`postgres.exe`) and the Docker `db` container both listen on port **5432**.
- **In Docker:** no problem. The backend connects to the hostname `db` inside the Docker network.
- **Running locally** (`npm run start:dev` with `DB_HOST=localhost`): the connection may reach the **Windows** Postgres instead of the container. You'd then see errors such as `password authentication failed` or `database "food_marketplace" does not exist`, even though the container is healthy.

**Fix options:** stop the Windows service (`services.msc` → postgresql → Stop), **or** set `DB_PORT=5433` in the root `.env` (Docker publishes the container on 5433) and in `backend/.env`.

---

## Verification

```bash
docker compose up -d --build backend
cd postman
npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json
```
Result after the fixes: **152 requests, 185 assertions, 0 failures.**
