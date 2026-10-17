# B10 — Search is accent-sensitive ("com tam" does not find "Cơm tấm")

| | |
|---|---|
| Severity | Medium |
| Area | Search (backend) |
| Status | Fixed — 2026-09-29 |
| Files changed | `backend/src/common/utils/search.ts` (new), `backend/database/migrations/20260929000002-enable-unaccent.js` (new), `backend/src/modules/products/products.service.ts`, `backend/src/modules/stores/stores.service.ts`, `backend/src/modules/admin/admin.service.ts` |

## The bug

Every text search used `name ILIKE '%q%'`. ILIKE ignores case but not accents. Most people type
Vietnamese without diacritics on a phone, so "com tam", "pho bo", or "dau hu" returned nothing even
when the menu had "Cơm tấm", "Phở bò", and "Đậu hũ". The storefront's `norm()` helper strips accents,
but only for client-side filtering. The API never did.

A second, smaller issue: `%` and `_` typed by the user were not escaped, so they acted as LIKE
wildcards.

## What changed

**New migration `20260929000002-enable-unaccent.js`**

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;   -- down: DROP EXTENSION IF EXISTS unaccent
```

`unaccent` ships with the official `postgres:16` images and has been a trusted extension since
PG 13, so the app's database user can create it. The backend container runs migrations at start-up
(`npm run start:prod`), so nothing else needs to happen.

**New helper `common/utils/search.ts`**

```ts
export const escapeLike = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);

export function textMatch(column: string, q: string): WhereOptions {
  return where(fn('unaccent', col(column)), { [Op.iLike]: fn('unaccent', `%${escapeLike(q.trim())}%`) });
}
```

The helper generates:

```sql
unaccent("Product"."name") ILIKE unaccent('%com tam%')
```

**Call sites switched from `ILIKE` to `textMatch`**

| Endpoint | Before | After |
|---|---|---|
| `GET /products?q=` | `name ILIKE %q%` | `textMatch('Product.name', q)` (pushed into the existing `and` list) |
| `GET /stores/:id/products?q=` (store console) | `name ILIKE %q%` | `textMatch('Product.name', q)` |
| `GET /stores?q=` | `name ILIKE %q%` | `textMatch('Store.name', q)` |
| `GET /admin/stores?q=` | name or slug `ILIKE` | `textMatch` on `Store.name` or `Store.slug` |
| `GET /admin/products?q=` | `name ILIKE %q%` | `textMatch('Product.name', q)` |

User and email searches (`/users`, `/admin/orders`) were left as they are, because usernames and
emails are ASCII.

## Verification

The generated SQL was checked with Sequelize's query generator, and the matching was run against
PostgreSQL 16:

| Name | `q = "com tam"` | `q = "dau"` | `q = "Cơm Tấm"` |
|---|---|---|---|
| Cơm tấm sườn | ✅ | ❌ | ✅ |
| Đậu hũ chiên | ❌ | ✅ (đ → d) | ❌ |
| Bánh mì | ❌ | ❌ | ❌ |

`q = "50%"` now matches "Giảm 50%" but not "Giảm 505".

## Notes and follow-ups

- `unaccent()` is not IMMUTABLE, so this can't use a normal index. That's fine at the current data
  size. When the catalogue grows, add an immutable wrapper function plus a `pg_trgm` GIN index (the
  planned `search/` module).
- Run `npm run db:migrate` (or restart the backend container) before testing, or queries fail with
  `function unaccent(character varying) does not exist`.
