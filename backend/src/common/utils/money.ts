// Money is NUMERIC(12,2). Do arithmetic in integer cents to avoid float drift.
export const toCents = (value: number | string | null | undefined): number =>
  Math.round(Number(value ?? 0) * 100);

export const fromCents = (cents: number): number => cents / 100;
