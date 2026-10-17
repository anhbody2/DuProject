/** SQL subquery selecting a category's id plus all of its descendants, for `x IN (...)` filters. */
export function categoryTreeSql(categoryId: number): string {
  return `(WITH RECURSIVE tree AS (
    SELECT id FROM categories WHERE id = ${Number(categoryId)}
    UNION ALL SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
  ) SELECT id FROM tree)`;
}
