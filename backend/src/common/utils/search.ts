import { Op, col, fn, where, type WhereOptions } from 'sequelize';

/** Escapes LIKE wildcards so a search for "50%" or "a_b" matches those characters literally. */
export const escapeLike = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Accent- and case-insensitive "contains" match for Vietnamese text:
 * `unaccent(<column>) ILIKE unaccent('%q%')`, so "com tam", "Cơm Tấm" and "COM TAM"
 * all find "Cơm tấm", and "dau" finds "đậu". Needs the `unaccent` extension
 * (migration 20260929000002-enable-unaccent).
 *
 * `column` is the qualified attribute as Sequelize aliases it, e.g. 'Product.name' or 'Store.slug'.
 */
export function textMatch(column: string, q: string): WhereOptions {
  return where(fn('unaccent', col(column)), { [Op.iLike]: fn('unaccent', `%${escapeLike(q.trim())}%`) });
}
