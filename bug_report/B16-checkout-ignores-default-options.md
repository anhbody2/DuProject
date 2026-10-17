# B16 — `POST /orders` with `items` but no `optionIds` fails, while the cart applies defaults

| | |
|---|---|
| Severity | Low |
| Area | Orders API (backend) |
| Status | Fixed — 2026-09-29 |
| Files changed | `backend/src/modules/orders/orders.service.ts`, `backend/src/modules/orders/dto/order.dto.ts` (doc comment), `postman/FoodMarketplace.postman_collection.json` (one request body) |

## The bug

The two write paths for "a dish without explicit options" disagreed:

| Call | Body | Before |
|---|---|---|
| `POST /cart/items` | `{ productId, quantity }` | ✅ 201. `defaultOptionIds()` picks size S |
| `POST /orders` | `{ items: [{ productId, quantity }] }` | ❌ 400 `"Kích cỡ" requires 1-1 selection(s)` |

Every dish gets a required "Kích cỡ" group by default, so any client that used "buy now" with
`items` and no `optionIds` (a mobile app, a script, a future "Đặt lại" feature) failed on almost
every product. The README says `optionIds` is optional.

## Root cause

`OrdersService.priceLine` used `line.optionIds ?? []`. An omitted list became an explicit empty
selection, which fails every required group.

## What changed

```ts
// orders.service.ts, priceLine() - before
const options = resolveOptions(product, line.optionIds ?? []);

// after
// Same rule as POST /cart/items: no optionIds = the first available option of each group
// that needs one (size S). An explicit list, even [], is validated as sent.
const options = resolveOptions(product, line.optionIds ?? defaultOptionIds(product));
```

- `defaultOptionIds` (in `products/product-options.ts`) is the helper the cart already uses, so both
  paths now share one rule.
- **Omitted** `optionIds` means defaults. **Explicit** `optionIds: []` still means "no choice made"
  and fails required groups with 400. Clients keep a way to be strict.
- Whole-cart checkout is unchanged. It always sends each line's saved options as an explicit list.
- The `CheckoutItemDto.optionIds` doc comment now describes the default.

## Postman change

The request **"09 Orders (customer) › Checkout missing required option -> 400"** left out
`optionIds` and expected 400. With the new default, it would have succeeded, placed an extra order,
and shifted stock for later chained requests. Its body now sends an explicit empty selection, which
still tests the "required option missing" rule:

```json
{ "productId": {{product2Id}}, "quantity": 1, "optionIds": [] }
```

## How to test

1. `POST /orders` with `items: [{ productId: <dish with default sizes>, quantity: 1 }]` returns 201.
   The order item has option "S" and the base price.
2. The same request with `"optionIds": []` returns 400 `"Kích cỡ" requires 1-1 selection(s)`.
3. Run the `09 Orders (customer)` folder in Newman. It should stay green.
