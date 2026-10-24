import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminOrdersQueryDto,
  AdminProductsQueryDto,
  AdminStoresQueryDto,
  StatsQueryDto,
} from './dto/admin.dto';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Admin dashboard reads (@Roles('admin')). Writes reuse the
 * regular routes: PATCH /users/:id, PATCH /stores/:id/status, PATCH/DELETE
 * /products/:id (admins pass StoreAccessService), PATCH /payments/:id/status ...
 */
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats(@Query() query: StatsQueryDto) {
    return this.admin.stats(query.days);
  }

  /** All stores, any status, with owner and product / order counts. */
  @Get('stores')
  findStores(@Query() query: AdminStoresQueryDto) {
    return this.admin.findStores(query);
  }

  /** All products, any status, including those of non-active stores. */
  @Get('products')
  findProducts(@Query() query: AdminProductsQueryDto) {
    return this.admin.findProducts(query);
  }

  /** All orders with customer, store orders, payments and delivery. */
  @Get('orders')
  findOrders(@Query() query: AdminOrdersQueryDto) {
    return this.admin.findOrders(query);
  }
}
