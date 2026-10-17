import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ORDER_STATUSES, PRODUCT_STATUSES, STORE_STATUSES } from '../../../database/models';
import type { OrderStatus, ProductStatus, StoreStatus } from '../../../database/models';

export class StatsQueryDto {
  /** Length of the daily revenue / orders series. */
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  days: number = 30;
}

export class AdminStoresQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STORE_STATUSES)
  status?: StoreStatus;

  /** Matches store name or slug. */
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  /** Matches product name. */
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  /** Matches customer username / email, or an exact order id. */
  @IsOptional()
  @IsString()
  q?: string;
}
