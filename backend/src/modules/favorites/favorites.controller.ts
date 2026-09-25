import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { FavoritesService } from './favorites.service';

/** PUT is idempotent: favoriting twice is a no-op. */
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get('stores')
  listStores(@CurrentUser() user: AuthUser) {
    return this.favorites.listStores(user.id);
  }

  @Put('stores/:storeId')
  addStore(@CurrentUser() user: AuthUser, @Param('storeId', ParseIntPipe) storeId: number) {
    return this.favorites.addStore(user.id, storeId);
  }

  @Delete('stores/:storeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStore(@CurrentUser() user: AuthUser, @Param('storeId', ParseIntPipe) storeId: number) {
    return this.favorites.removeStore(user.id, storeId);
  }

  @Get('products')
  listProducts(@CurrentUser() user: AuthUser) {
    return this.favorites.listProducts(user.id);
  }

  @Put('products/:productId')
  addProduct(@CurrentUser() user: AuthUser, @Param('productId', ParseIntPipe) productId: number) {
    return this.favorites.addProduct(user.id, productId);
  }

  @Delete('products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProduct(@CurrentUser() user: AuthUser, @Param('productId', ParseIntPipe) productId: number) {
    return this.favorites.removeProduct(user.id, productId);
  }
}
