import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StoreOrdersController } from './store-orders.controller';
import { StoreOrdersService } from './store-orders.service';

@Module({
  imports: [StoresModule],
  controllers: [OrdersController, StoreOrdersController, AdminOrdersController],
  providers: [OrdersService, StoreOrdersService, OrderLifecycleService],
})
export class OrdersModule {}
