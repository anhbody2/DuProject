# B41 — Delivery phone numbers are not validated

| | |
|---|---|
| Severity | Low |
| Area | Addresses (frontend + backend) |
| Status | Open, found 2026-10-02 |
| Where | `frontend/src/components/AddressPicker/AddressForm.tsx`; `backend/src/modules/addresses/dto/address.dto.ts` |

## The bug

The new `AddressForm` (used by checkout and the address book) only checks that the phone is
non-empty. The API DTO only checks `IsString`, `IsNotEmpty`, and `MaxLength(30)`. So `"abc"`,
`"0"`, or `"call me"` are saved as the delivery phone. That copy is snapshotted onto the order, and
it's the number the store sees and calls (`StoreDashboardPage/OrdersView`).

A validator already exists and isn't used here: `validators.phone` in `frontend/src/lib/validation.ts`
(`/^(\+84|0)\d{9,10}$/` after removing spaces, dots, and dashes), the same rule as registration.

## Suggested fix

- `AddressForm.save()`: run `validators.phone(who.phone)` and show its message.
- `CreateAddressDto.phone`: add `@Matches(/^(\+84|0)\d{9,10}$/)` after normalising
  (`@Transform` to strip spaces, dots, and dashes), so direct API calls follow the same rule.
- Old addresses with bad phones will fail validation when edited. That's acceptable and prompts a
  fix.
