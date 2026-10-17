import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { StoreProductsQueryDto } from './dto/product.dto';
import { ProductsService } from './products.service';

/** A store's own catalogue for its dashboard (membership checked per store in the service). */
@Controller('stores/:storeId/products')
export class StoreProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findForStore(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: StoreProductsQueryDto,
  ) {
    return this.products.findForStore(user, storeId, query);
  }
}
