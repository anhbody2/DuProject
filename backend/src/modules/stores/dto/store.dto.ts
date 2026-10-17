import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsImageUrl } from '../../../common/decorators/is-image-url.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { STORE_STATUSES } from '../../../database/models';
import type { StoreStatus } from '../../../database/models';

export class StoreLocationDto {
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateStoreLocationDto extends PartialType(StoreLocationDto) {}

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /** Generated from name when omitted. */
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be kebab-case' })
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsImageUrl()
  logoUrl?: string;

  @IsOptional()
  @IsImageUrl()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreLocationDto)
  locations?: StoreLocationDto[];
}

export class UpdateStoreDto extends PartialType(
  OmitType(CreateStoreDto, ['categoryIds', 'locations'] as const),
) {}

export class UpdateStoreStatusDto {
  @IsIn(STORE_STATUSES)
  status: StoreStatus;
}

export class SetStoreCategoriesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  categoryIds: number[];
}

export class ListStoresQueryDto extends PaginationQueryDto {
  /** Matches store name. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  /** lat + lng: only stores with a location within radiusKm, nearest first. */
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm: number = 5;
}

export class AddStoreMemberDto {
  @IsInt()
  userId: number;

  @IsIn(['manager', 'staff'])
  role: 'manager' | 'staff';
}

export class UpdateStoreMemberDto {
  @IsIn(['manager', 'staff'])
  role: 'manager' | 'staff';
}
