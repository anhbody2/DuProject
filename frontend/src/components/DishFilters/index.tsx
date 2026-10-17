import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Select } from 'antd';
import { useCategoriesQuery, type ProductQuery } from '@/redux/api';
import type { Category } from '@/redux/types';
import { Chip, FilterLabel } from '@/components/ui';
import { FilterBar, SubChips, Tools } from './styles';

export type Sort = NonNullable<ProductQuery['sort']>;
export const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
];
export const SORT_KEYS = SORTS.map((s) => s.value);

export interface DishFilterValue {
  categoryId?: number;
  sort: Sort;
}

export function flattenCategories(nodes: Category[], out = new Map<number, Category>()) {
  for (const n of nodes) { out.set(n.id, n); if (n.children) flattenCategories(n.children, out); }
  return out;
}

/** `/menu?category=5&sort=price_asc&q=pho` for a filter state (defaults are left out). */
export function menuHref({ categoryId, sort }: DishFilterValue, q?: string) {
  const p = new URLSearchParams();
  if (categoryId) p.set('category', String(categoryId));
  if (sort !== 'newest') p.set('sort', sort);
  if (q) p.set('q', q);
  const s = p.toString();
  return s ? `/menu?${s}` : '/menu';
}

interface Props {
  value: DishFilterValue;
  onChange: (patch: Partial<DishFilterValue>) => void;
  /** Pin the category bar to the top while the list scrolls (menu page). */
  sticky?: boolean;
  /** Extra controls placed beside the sort select, e.g. a search box. */
  children?: ReactNode;
}

/**
 * Category + sort filter shared by the menu page and the search panel, so both
 * filter dishes the same way. Top-level categories are chips; the selected one
 * expands into its subcategories.
 */
export default function DishFilters({ value, onChange, sticky, children }: Props) {
  const { categoryId, sort } = value;
  const { data: tree = [] } = useCategoriesQuery();
  const byId = useMemo(() => flattenCategories(tree), [tree]);
  const selected = categoryId ? byId.get(categoryId) : undefined;
  const root = selected?.parentId ? byId.get(selected.parentId) ?? selected : selected;
  const subs = root?.children ?? [];

  // Keep the active chip visible in the horizontally scrolling bar on phones.
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    const chip = el?.querySelector<HTMLElement>('[data-active="true"]');
    if (el && chip && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }
  }, [root?.id]);

  const pick = (id: number | undefined) => onChange({ categoryId: id });

  return (
    <>
      <FilterBar ref={bar} $sticky={sticky}>
        <FilterLabel>LỌC</FilterLabel>
        <Chip data-active={!root} $active={!root} onClick={() => pick(undefined)}>TẤT CẢ</Chip>
        {tree.map((c) => (
          <Chip key={c.id} data-active={root?.id === c.id} $active={root?.id === c.id} onClick={() => pick(c.id)}>{c.name.toUpperCase()}</Chip>
        ))}
      </FilterBar>
      {root && subs.length > 0 && (
        <SubChips>
          {subs.map((c) => <Chip key={c.id} $active={categoryId === c.id} onClick={() => pick(categoryId === c.id ? root.id : c.id)}>{c.name}</Chip>)}
        </SubChips>
      )}
      <Tools $single={!children}>
        {children}
        <Select value={sort} onChange={(v) => onChange({ sort: v })} options={SORTS} aria-label="Sắp xếp" />
      </Tools>
    </>
  );
}
