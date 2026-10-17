import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StoreProductsController } from './store-products.controller';

@Module({
  imports: [StoresModule],
  controllers: [ProductsController, StoreProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
