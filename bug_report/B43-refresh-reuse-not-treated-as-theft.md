# B43 — A replayed refresh token is rejected, but the session isn't revoked

| | |
|---|---|
| Severity | Low |
| Area | Auth: refresh tokens (backend) |
| Status | Open, found 2026-10-06 |
| Where | `backend/src/modules/auth/token.service.ts` `rotate()` |

## The bug

Rotation makes each refresh token single-use. When an **already-rotated** token comes back (valid
signature, not expired, but its hash no longer matches), `rotate()` just answers 401:

```ts
const [updated] = await this.users.update(
  { refreshTokenHash: sha256(pair.refreshToken) },
  { where: { id: user.id, refreshTokenHash: sha256(refreshToken) } },
);
if (!updated) throw invalid;   // nothing else happens
```

A reused rotated token is the standard sign of theft. Two parties hold the same token, and one of
them already used it. If an attacker copies a refresh token (malware, a shared computer, a leaked
log) and refreshes **first**, the attacker now holds the only valid token. When the real user's
app refreshes, it gets 401 and logs out, and the attacker keeps rotating for up to 30 days. Nothing
records the event, and nothing stops it.

## Suggested fix (refresh-token reuse detection, per OAuth 2.0 Security BCP)

When the signature is valid but the hash doesn't match, treat it as reuse and end the session:

```ts
if (!updated) {
  await this.revokeUser(user.id);           // kills the attacker's token too
  this.logger.warn(`Refresh token reuse for user ${user.id}`);
  throw invalid;
}
```

With per-session rows (B42), revoke the session family instead of every session for the user.
The legitimate user logs in again and the stolen token is dead. The only cost is that a genuine
double-refresh race (two tabs refreshing at the same moment) also signs the user out. Avoid that
race on the client with the single in-flight refresh promise already planned in the doc's follow-up
step 2.
