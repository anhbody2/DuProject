import { Controller, Get, Query } from '@nestjs/common';
import { AutocompleteQueryDto, PlaceQueryDto, ReverseQueryDto } from './dto/geo.dto';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  /** Public: tile key for the map + whether address search is enabled. */
  @Get('config')
  config() {
    return this.geo.config();
  }

  @Get('autocomplete')
  autocomplete(@Query() q: AutocompleteQueryDto) {
    return this.geo.autocomplete(q.text, q.lat, q.lng);
  }

  @Get('place')
  place(@Query() q: PlaceQueryDto) {
    return this.geo.place(q.refId);
  }

  @Get('reverse')
  reverse(@Query() q: ReverseQueryDto) {
    return this.geo.reverse(q.lat, q.lng);
  }
}
