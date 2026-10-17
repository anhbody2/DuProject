import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AutocompleteQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  text: string;

  /** Bias results towards this point (e.g. the map centre or the user's location). */
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}

export class PlaceQueryDto {
  /** `refId` from an autocomplete suggestion, passed back verbatim. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  refId: string;
}

export class ReverseQueryDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
