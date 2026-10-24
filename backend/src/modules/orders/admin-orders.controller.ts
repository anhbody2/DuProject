import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UpdateDeliveryDto, UpdatePaymentStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Roles } from '../../common/decorators/roles.decorator';

/** Admin-only: payment & delivery operations. */
@Roles('admin')
@Controller()
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Patch('payments/:id/status')
  updatePaymentStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentStatusDto) {
    return this.orders.updatePaymentStatus(id, dto);
  }

  @Patch('deliveries/:id')
  updateDelivery(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeliveryDto) {
    return this.orders.updateDelivery(id, dto);
  }
}
