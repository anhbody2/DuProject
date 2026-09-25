import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const pageOptions = ({ page, limit }: PaginationQueryDto) => ({
  limit,
  offset: (page - 1) * limit,
});

export function paginate<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationQueryDto,
): Paginated<T> {
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
