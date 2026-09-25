import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /** Generated from name when omitted. */
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be kebab-case' })
  @MaxLength(150)
  slug?: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
