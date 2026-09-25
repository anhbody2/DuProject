import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { ListOrdersQueryDto, UpdateStoreOrderStatusDto } from './dto/order.dto';
import { StoreOrdersService } from './store-orders.service';

/** Store staff endpoints (membership checked per store in the service). */
@Controller()
export class StoreOrdersController {
  constructor(private readonly storeOrders: StoreOrdersService) {}

  @Get('stores/:storeId/orders')
  findForStore(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.storeOrders.findForStore(user, storeId, query);
  }

  @Get('store-orders/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.storeOrders.findOne(user, id);
  }

  @Patch('store-orders/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreOrderStatusDto,
  ) {
    return this.storeOrders.updateStatus(user, id, dto);
  }
}
