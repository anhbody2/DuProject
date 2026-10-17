# B44 — The auth middleware doesn't check the token type; separation relies only on different secrets

| | |
|---|---|
| Severity | Low (needs a misconfiguration to exploit) |
| Area | Auth (backend) |
| Status | Open, found 2026-10-06 |
| Where | `backend/src/common/middlewares/auth.middleware.ts`, `backend/src/modules/chat/chat.gateway.ts` (`authenticate`) |

## The bug

Refresh tokens carry `typ: "refresh"` and are signed with `JWT_REFRESH_SECRET`. Access tokens have
no `typ` and are signed with `JWT_SECRET`. `TokenService.verify` checks `typ === 'refresh'`, but
the access-token side doesn't check anything:

```ts
// auth.middleware.ts and chat.gateway.ts
payload = await this.jwt.verifyAsync<JwtPayload>(token);   // no typ check
```

So the separation depends entirely on the two secrets being different. If an operator sets
`JWT_REFRESH_SECRET` to the same value as `JWT_SECRET` (an easy copy-paste in `.env`), a **30-day
refresh token works as an access token** for every API route and the chat socket. That defeats the
short access-token lifetime the refresh design is built for.

## Suggested fix

Defence in depth, two lines in each place:

```ts
payload = await this.jwt.verifyAsync<JwtPayload & { typ?: string }>(token);
if ((payload as { typ?: string }).typ) throw new UnauthorizedException('Invalid or expired token');
```

Better still, add `typ: 'access'` to access tokens and require it. Optionally refuse to start
(`TokenService` constructor) when `JWT_REFRESH_SECRET === JWT_SECRET`.
