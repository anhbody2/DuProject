# Bug reports

One file per bug: fixed bugs first, then open bugs found by later scans. IDs match the bug log in the
"ProjectM – Food Marketplace: Review, Bug Log & Expansion Plan" doc.

| ID | Severity | Bug | Report | Fixed |
|---|---|---|---|---|
| B04 | Medium | Suspended users stay "signed in" in the SPA | [B04-suspended-user-not-logged-out.md](B04-suspended-user-not-logged-out.md) | 2026-09-29 |
| B10 | Medium | Search is accent-sensitive ("com tam" ≠ "Cơm tấm") | [B10-search-is-accent-sensitive.md](B10-search-is-accent-sensitive.md) | 2026-09-29 |
| B12 | Medium | Only the first active order gets tracking and cancel | [B12-only-first-active-order-tracked.md](B12-only-first-active-order-tracked.md) | 2026-09-29 |
| B16 | Low | `POST /orders` without `optionIds` ignores default options | [B16-checkout-ignores-default-options.md](B16-checkout-ignores-default-options.md) | 2026-09-29 |
| B18 | Low | API accepts weak passwords; usernames are case-sensitive | [B18-password-rules-and-username-case.md](B18-password-rules-and-username-case.md) | 2026-09-29 |
| B21 | Low | "Revenue" meant two different things on the dashboards | [B21-revenue-means-two-things.md](B21-revenue-means-two-things.md) | 2026-09-29 |
| B27 | Medium | nginx rejected uploads between 3 and 5 MB | [B27-nginx-rejects-uploads-over-3mb.md](B27-nginx-rejects-uploads-over-3mb.md) | 2026-09-28 (nginx) / 2026-09-29 (message) |

## Open bugs found on 2026-10-02

Full status of all 41 bugs (fixed, partly fixed, open): **[SCAN-2026-10-02.md](SCAN-2026-10-02.md)**.

| ID | Severity | Bug | Report |
|---|---|---|---|
| B36 | Medium | An admin's account page lists every customer's orders, with a cancel button | [B36-admin-account-page-shows-all-orders.md](B36-admin-account-page-shows-all-orders.md) |
| B40 | Medium | Geo proxy has no rate limit or cache (paid VietMap quota) | [B40-geo-proxy-has-no-rate-limit.md](B40-geo-proxy-has-no-rate-limit.md) |
| B37 | Low | Finished orders stay in the "active" column until a reload | [B37-finished-orders-stay-in-active-column.md](B37-finished-orders-stay-in-active-column.md) |
| B38 | Low | Reorder reports a store conflict as "sold out" and drops options | [B38-reorder-reports-cart-conflict-as-sold-out.md](B38-reorder-reports-cart-conflict-as-sold-out.md) |
| B39 | Low | Store page and menu stop at 100 dishes | [B39-store-menu-capped-at-100-dishes.md](B39-store-menu-capped-at-100-dishes.md) |
| B41 | Low | Delivery phone numbers aren't validated | [B41-delivery-phone-not-validated.md](B41-delivery-phone-not-validated.md) |

## Open bugs found on 2026-10-06

Full status of all 45 bugs: **[SCAN-2026-10-06.md](SCAN-2026-10-06.md)** (the previous scan,
[SCAN-2026-10-02.md](SCAN-2026-10-02.md), is kept for history).

| ID | Severity | Bug | Report |
|---|---|---|---|
| B42 | Medium | One refresh session per user, so two devices will keep logging each other out | [B42-one-refresh-session-per-user.md](B42-one-refresh-session-per-user.md) |
| B43 | Low | A replayed refresh token doesn't revoke the session (no theft detection) | [B43-refresh-reuse-not-treated-as-theft.md](B43-refresh-reuse-not-treated-as-theft.md) |
| B44 | Low | The auth middleware doesn't check the token type | [B44-auth-middleware-does-not-check-token-type.md](B44-auth-middleware-does-not-check-token-type.md) |
| B45 | Low | `SINGLE_STORE_CART.md` still describes the removed dish sheet | [B45-single-store-cart-doc-describes-removed-dish-sheet.md](B45-single-store-cart-doc-describes-removed-dish-sheet.md) |

## Before you deploy these fixes

1. **Run the migrations.** Two are new: `20260929000002-enable-unaccent.js` (B10) and
   `20260929000003-username-case-insensitive.js` (B18). `docker compose up -d --build backend` runs
   them on start-up. For a local backend, run `npm run db:migrate`.
   - The B18 migration stops with a list of accounts if any usernames differ only by case. Rename
     one of each pair, then run it again.
2. **Rebuild the frontend container** so nginx and the SPA changes are picked up:
   `docker compose up -d --build frontend`.
3. **Run the regression suite:**
   `cd postman && npx newman run FoodMarketplace.postman_collection.json -e local.postman_environment.json`.
   One request body changed for B16 ("Checkout missing required option -> 400" now sends
   `"optionIds": []`).

## Verification done

- `tsc --noEmit` passes for the backend.
- `tsc --noEmit` on the frontend passes for every changed file. At the time of this fix it reported
  3 unrelated errors (`DISTRICTS` is no longer exported from `lib/format.ts`, from in-progress geo
  work in `AddStoreForm`, `CheckoutPage` and `SettingsView`).
- The B10 SQL (`unaccent … ILIKE`) and the B18 unique index were run against PostgreSQL 16.
- The B18 password rule was run through class-validator against sample passwords.
- Newman was **not** run, because the stack isn't reachable from the review environment.

## All files touched

```
backend/database/migrations/20260929000002-enable-unaccent.js            (new)   B10
backend/database/migrations/20260929000003-username-case-insensitive.js  (new)   B18
backend/src/common/utils/search.ts                                       (new)   B10
backend/src/common/decorators/strong-password.decorator.ts               (new)   B18
backend/src/modules/products/products.service.ts                                 B10
backend/src/modules/stores/stores.service.ts                                     B10, B21
backend/src/modules/admin/admin.service.ts                                       B10, B21
backend/src/modules/orders/orders.service.ts                                     B16
backend/src/modules/orders/dto/order.dto.ts                                      B16 (comment)
backend/src/modules/auth/auth.service.ts                                         B18
backend/src/modules/auth/dto/auth.dto.ts                                         B18
backend/src/modules/users/dto/users.dto.ts                                       B18
frontend/src/redux/api/axiosClient.ts                                            B04
frontend/src/components/ChatWidget/ChatSocketSync.tsx                            B04
frontend/src/providers.tsx                                                       B04 (comment)
frontend/src/pages/AccountPage/index.tsx                                         B12
frontend/src/pages/AdminPage/DashboardView.tsx                                   B21
frontend/src/pages/StoreDashboardPage/DashboardView.tsx                          B21
frontend/src/redux/api/baseApi.ts                                                B27
postman/FoodMarketplace.postman_collection.json                                  B16
```
