# B18 — The API accepts weaker passwords than the SPA, and usernames are case-sensitive

| | |
|---|---|
| Severity | Low |
| Area | Auth (backend) |
| Status | Fixed — 2026-09-29 |
| Files changed | `backend/src/common/decorators/strong-password.decorator.ts` (new), `backend/src/modules/auth/dto/auth.dto.ts`, `backend/src/modules/users/dto/users.dto.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/database/migrations/20260929000003-username-case-insensitive.js` (new) |

## The bug

**1. Two password policies.** The SPA's `PASSWORD_RULES` (`frontend/src/lib/validation.ts`) require
8+ characters **with** an upper-case letter, a lower-case letter, and a digit. The API only checked
`MinLength(8)`, so anyone calling the API directly (Postman, a script, a future mobile app) could
register or reset to `aaaaaaaa`.

**2. Case-sensitive usernames.** `users.username` had a plain UNIQUE constraint, so `admin` and
`Admin` could both exist. That makes impersonation easy ("Admin" messaging users in chat). Login
by username was also case-sensitive, while login by email was not.

## What changed

### Password policy (one decorator, three DTOs)

New `@IsStrongPassword()` in `common/decorators/strong-password.decorator.ts`:

```ts
IsString(); MinLength(8); MaxLength(72);
Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        { message: '<field> must contain an upper-case letter, a lower-case letter and a digit' });
```

| DTO | Field | Before | After |
|---|---|---|---|
| `RegisterDto` | `password` | `IsString, MinLength(8), MaxLength(72)` | `@IsStrongPassword()` |
| `ResetPasswordDto` | `newPassword` | same | `@IsStrongPassword()` |
| `ChangePasswordDto` | `newPassword` | same | `@IsStrongPassword()` |

`LoginDto.password` and `ChangePasswordDto.currentPassword` are **not** checked against the policy,
so accounts created before this change can still sign in.

### Case-insensitive usernames

- **Migration `20260929000003-username-case-insensitive.js`** creates
  `UNIQUE INDEX users_username_lower_key ON users (lower(username))`. It first looks for existing
  case-only duplicates. If it finds any, it aborts with a message that lists them
  (`admin (#1), Admin (#7)`) and changes nothing, so the data is never silently altered. Rename one
  account from each pair, then run it again.
- **`auth.service.ts`** gets a helper `sameUsername(u) = where(lower(username), u.toLowerCase())`,
  used in:
  - `register`: the "Username already taken" pre-check now also catches `Admin` vs `admin`.
  - `login`: signing in as `ADMIN` works for the account `admin`.
  - `freeUsername` (social sign-up): it won't generate a name that differs only by case.
- Stored usernames keep the case the user typed, so display is unchanged.

## Verification

- Sequelize generates `WHERE ("users"."email" = 'a@b.c' OR lower("username") = 'admin')`.
- On PostgreSQL 16, the index rejects `BOB` when `bob` exists, and the duplicate-finder query lists
  `admin (#1), Admin (#2)` as expected.
- Every valid password in the Postman collection (`Passw0rd!`, `NewPassw0rd!`, `Admin@123`,
  `Passw0rd!2`) passes the new rule. The `"123"` case still expects 400.

## How to test

1. `POST /auth/register` with `password: "abcdefgh"` returns 400 "password must contain an
   upper-case letter…".
2. Register `Minh`, then try `minh` and get 409 "Username already taken".
3. `POST /auth/login` with `{ login: "MINH", password: … }` returns 200.
4. `PATCH /me/password` with `newPassword: "password1"` returns 400.
