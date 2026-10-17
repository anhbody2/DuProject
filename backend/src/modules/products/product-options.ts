import { BadRequestException } from '@nestjs/common';
import type { OptionGroup, Product, ProductOption } from '../../database/models';

/** Size group a new product gets when its owner sends no option groups. */
export const DEFAULT_SIZE_GROUP = {
  name: 'Kích cỡ',
  required: true,
  minSelection: 1,
  maxSelection: 1,
  options: [
    { name: 'S', priceModifier: 0 },
    { name: 'M', priceModifier: 10000 },
  ],
};

const minOf = (g: OptionGroup) => Math.max(g.minSelection, g.required ? 1 : 0);

/** The first available options of each group that needs a selection (size S for the default group). */
export function defaultOptionIds(product: Product): number[] {
  return product.optionGroups!.flatMap((g) =>
    g.options!
      .filter((o) => o.isAvailable)
      .sort((a, b) => a.id - b.id)
      .slice(0, minOf(g))
      .map((o) => o.id),
  );
}

/**
 * Checks a selection against the product's option groups (needs `optionGroups.options`
 * loaded) and returns the chosen options. Throws 400 on a foreign or unavailable
 * option, or a group selected too few or too many times.
 */
export function resolveOptions(product: Product, optionIds: number[]): ProductOption[] {
  const optionIndex = new Map(
    product.optionGroups!.flatMap((g) => g.options!.map((o) => [o.id, o] as const)),
  );
  const options = [...new Set(optionIds)].map((id) => {
    const option = optionIndex.get(id);
    if (!option) throw new BadRequestException(`Option ${id} does not belong to "${product.name}"`);
    if (!option.isAvailable) throw new BadRequestException(`Option "${option.name}" is unavailable`);
    return option;
  });

  for (const group of product.optionGroups!) {
    const selected = options.filter((o) => o.optionGroupId === group.id).length;
    const min = minOf(group);
    if (selected < min || selected > group.maxSelection) {
      throw new BadRequestException(
        `"${product.name}" - "${group.name}" requires ${min}-${group.maxSelection} selection(s)`,
      );
    }
  }
  return options;
}
