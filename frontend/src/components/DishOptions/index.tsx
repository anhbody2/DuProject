import { useEffect, useMemo, useState } from 'react';
import { fmt } from '@/lib/format';
import type { OptionGroup, ProductDetail } from '@/redux/types';
import { Chip, Muted, Row, Stack } from '@/components/ui';

const minOf = (g: OptionGroup) => Math.max(g.minSelection, g.required ? 1 : 0);

/** Same defaults as the server: the first available option(s) of each group that needs one (size S). */
function defaultSelection(groups: OptionGroup[]): Record<number, number[]> {
  return Object.fromEntries(groups.map((g) => [
    g.id,
    [...(g.options ?? [])].filter((o) => o.isAvailable).sort((a, b) => a.id - b.id).slice(0, minOf(g)).map((o) => o.id),
  ]));
}

/** Option selection for one dish (product page and the store page's dish sheet). */
export function useDishOptions(p: ProductDetail | undefined) {
  const groups = useMemo(() => (p?.optionGroups ?? []).filter((g) => g.options?.length), [p]);
  const [picked, setPicked] = useState<Record<number, number[]>>({});
  useEffect(() => { setPicked(defaultSelection(groups)); }, [groups]);

  const chosenIds = groups.flatMap((g) => picked[g.id] ?? []);
  const extra = groups.flatMap((g) => g.options ?? []).filter((o) => chosenIds.includes(o.id)).reduce((sum, o) => sum + o.priceModifier, 0);
  const missing = groups.find((g) => (picked[g.id]?.length ?? 0) < minOf(g));

  // Single-choice groups (size) swap; multi-choice groups toggle up to maxSelection.
  const pick = (g: OptionGroup, optionId: number) => setPicked((prev) => {
    const cur = prev[g.id] ?? [];
    if (g.maxSelection <= 1) return { ...prev, [g.id]: cur[0] === optionId && minOf(g) === 0 ? [] : [optionId] };
    if (cur.includes(optionId)) return { ...prev, [g.id]: cur.filter((x) => x !== optionId) };
    return cur.length < g.maxSelection ? { ...prev, [g.id]: [...cur, optionId] } : prev;
  });

  return { groups, picked, pick, chosenIds, extra, missing };
}

/** One row of chips per option group. */
export default function DishOptions({ groups, picked, pick }: Pick<ReturnType<typeof useDishOptions>, 'groups' | 'picked' | 'pick'>) {
  return groups.map((g) => (
    <Stack key={g.id} $gap={10}>
      <Row $justify="flex-start" $gap="8px">
        <b style={{ fontSize: 15 }}>{g.name}</b>
        <Muted>{minOf(g) ? 'Bắt buộc' : 'Tuỳ chọn'}{g.maxSelection > 1 && ` · tối đa ${g.maxSelection}`}</Muted>
      </Row>
      <Row $justify="flex-start" $gap="8px" $wrap role={g.maxSelection <= 1 ? 'radiogroup' : 'group'} aria-label={g.name}>
        {g.options!.map((o) => {
          const on = picked[g.id]?.includes(o.id) ?? false;
          return (
            <Chip
              key={o.id}
              $active={on}
              role={g.maxSelection <= 1 ? 'radio' : 'checkbox'}
              aria-checked={on}
              disabled={!o.isAvailable}
              onClick={() => pick(g, o.id)}
              style={o.isAvailable ? undefined : { opacity: 0.4, textDecoration: 'line-through', cursor: 'default' }}
            >
              {o.name}{o.priceModifier > 0 && <span style={{ fontWeight: 600, fontSize: 12 }}>+{fmt(o.priceModifier)}</span>}
            </Chip>
          );
        })}
      </Row>
    </Stack>
  ));
}
