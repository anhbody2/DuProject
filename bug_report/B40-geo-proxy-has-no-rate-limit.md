# B40 — The geocoding proxy has no rate limit or cache, so one user can burn the VietMap quota

| | |
|---|---|
| Severity | Medium (cost and availability) |
| Area | Geo module (backend) |
| Status | Open, found 2026-10-02 (a specific case of B07) |
| Where | `backend/src/modules/geo/geo.controller.ts`, `geo.service.ts` |

## The bug

`GET /geo/autocomplete`, `/geo/place` and `/geo/reverse` forward each call to the paid VietMap
API with the server's `VIETMAP_API_KEY`. They require a login, but:

- there is no per-user or per-IP rate limit (no `@nestjs/throttler` anywhere, see B07);
- there is no cache, so the same text or point is billed again every time;
- the frontend debounces typing (300 ms), but the API can be called directly in a loop.

Any signed-in account (sign-up is open) can run a script that exhausts the monthly quota or runs up
the bill. When the quota runs out, VietMap answers with errors, and **every** address form falls
back to "Address lookup is unavailable" for all users.

## Suggested fix

1. Add `@nestjs/throttler` with a tight bucket on `geo/*`, for example 30 requests per minute per
   user, and answer 429 with a Vietnamese message.
2. Cache `place` (by `refId`) and `reverse` (by lat/lng rounded to 5 decimals) for a few hours.
   An in-memory LRU is enough until Redis is added.
3. Optional: log the daily call count per user, so abuse can be spotted.
