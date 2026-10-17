# B04 — Suspended users stay "signed in" in the SPA

| | |
|---|---|
| Severity | Medium |
| Area | Auth (frontend) |
| Status | Fixed — 2026-09-29 |
| Files changed | `frontend/src/redux/api/axiosClient.ts`, `frontend/src/components/ChatWidget/ChatSocketSync.tsx`, `frontend/src/providers.tsx` (comment only) |

## The bug

`AuthMiddleware` reloads the user on every request. When the account is no longer active, it
throws `ForbiddenException('Account is suspended')`, which is a **403**. The axios interceptor only
logged out on **401**, so a suspended user kept their token and header avatar. Every API call then
failed with a toast, and the UI never explained why.

The chat socket had the same gap. The handshake rejects the token with `Account is not active`,
and the client ignored that error.

### Steps to reproduce (before)

1. Log in as a customer in the browser.
2. As admin, `PATCH /api/users/:id` `{ "status": "suspended" }`.
3. Back in the customer tab, open the cart or account page. Requests fail with 403
   "Account is suspended", but the user is still shown as logged in.

## Root cause

The API has two kinds of 403. One is "you may not do this" (roles, store membership). The other is
"your account is blocked" (`Account is <status>`). Only the second means the session is dead, and
the client treated both the same way.

## What changed

**`axiosClient.ts`**

- Added `isSessionLost(status, data)`. It is true for any 401, and for a 403 whose message matches
  `/^Account is (suspended|inactive)\b/`, which is exactly the text `AuthMiddleware` throws.
- The response interceptor now calls `onUnauthorized()` (which dispatches `logout`) when
  `isSessionLost` is true and a token is stored.
- Ordinary permission 403s (such as "You do not have access to this store") still do **not** log out.

```ts
// before
if (axios.isAxiosError(error) && error.response?.status === 401 && store.getState().auth.token) {
  onUnauthorized();
}
// after
if (axios.isAxiosError(error) && store.getState().auth.token && isSessionLost(error.response?.status, error.response?.data)) {
  onUnauthorized();
}
```

**`ChatSocketSync.tsx`**

- Added a `connect_error` listener. When the handshake fails with `Invalid or expired token` or
  `Account is not active` (from `ChatGateway.authenticate`), it shows a toast
  ("Phiên đăng nhập đã hết hoặc tài khoản đã bị khoá") and dispatches `logout()`.

**`providers.tsx`**: the comment on `SessionSync` now says suspended accounts answer 403.

### Why the API was not changed

`CLAUDE.md` says 401 means only a missing or invalid session. The Postman suite also asserts the
existing 403 codes. Keeping the API contract and teaching the client the one 403 that means
"session over" is the smaller, safer change.

## How to test

1. Repeat the reproduction steps. The customer tab should drop to logged-out on the next request
   (for example, the `/me` refresh or opening the cart).
2. As a store staff member, open another store's `/my-store/:id`. The 403 "You do not have access
   to this store" must **not** log you out.
3. Suspend a user, then reload their tab. The chat socket handshake fails, and the app signs them
   out with the toast.
