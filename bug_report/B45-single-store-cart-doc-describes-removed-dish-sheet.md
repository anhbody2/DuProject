# B45 — `docs/SINGLE_STORE_CART.md` still describes the removed dish sheet

| | |
|---|---|
| Severity | Low (documentation) |
| Area | Docs |
| Status | Open, found 2026-10-06 |
| Where | `docs/SINGLE_STORE_CART.md` (lines 16, 30, 68, 115–118) |

## The bug

Between 2 Oct and 6 Oct the "add a dish" flow changed:

| | Then (per the doc) | Now (code and `CLAUDE.md`) |
|---|---|---|
| Dish links | `/store/:id?dish=:productId` opens `DishSheet` | `dishHref()` → `/product/:id` |
| Add to cart | in the dish sheet modal | on the product page |
| `pages/StorePage/DishSheet.tsx` | "new" | deleted |
| Old `?dish=` links | — | redirect to `/product/:id` |

`CLAUDE.md` was updated, but `docs/SINGLE_STORE_CART.md` still has the sheet in its numbered flow,
its mermaid diagram, its file table (with a link to the deleted `DishSheet.tsx`), and its P5/P6
notes. Anyone reading the doc (or an AI agent following it) will look for a component that doesn't
exist.

## Suggested fix

Edit the doc: change step 2 and the diagram node to `/product/:id`, remove the `DishSheet.tsx` row
(or mark it "removed 2026-10-0x, replaced by the product page"), and update the P5 note (login now
returns to `/product/:id`, and the options still reset).
