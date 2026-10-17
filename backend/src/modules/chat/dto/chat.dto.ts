import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const MESSAGE_MAX_LENGTH = 2000;

export class OpenDirectDto {
  @IsInt()
  @Min(1)
  userId: number;
}

export class SendMessageDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_MAX_LENGTH)
  body: string;
}

/** Messages come newest-first in pages; `before` is the oldest message id already loaded. */
export class MessagesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  before?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}

export class SearchUsersQueryDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  q: string;
}
