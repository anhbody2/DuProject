import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;

  /** Chosen option ids. Omitted: the first available option of each required group (size S). */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  optionIds?: number[];

  /**
   * A cart holds dishes from one store. When it already has another store's dishes the
   * request fails with 409 CART_STORE_CONFLICT; send true to empty the cart and add this one.
   */
  @IsOptional()
  @IsBoolean()
  replaceCart?: boolean;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}
