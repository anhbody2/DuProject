import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Address,
  Order,
  OrderItem,
  OrderItemOption,
  Profile,
  StoreOrder,
  User,
} from '../../database/models';
import { ALL_MEMBERS, StoreAccessService } from '../stores/store-access.service';
import { ListOrdersQueryDto, UpdateStoreOrderStatusDto } from './dto/order.dto';
import { OrderLifecycleService, STORE_ORDER_TRANSITIONS } from './order-lifecycle.service';

/** The store-side view of orders: each store only sees and handles its own slice. */
@Injectable()
export class StoreOrdersService {
  constructor(
    @InjectModel(StoreOrder) private readonly storeOrders: typeof StoreOrder,
    @InjectModel(Order) private readonly orders: typeof Order,
    private readonly access: StoreAccessService,
    private readonly lifecycle: OrderLifecycleService,
    private readonly sequelize: Sequelize,
  ) {}

  async findForStore(user: AuthUser, storeId: number, query: ListOrdersQueryDto) {
    await this.access.assert(user, storeId, ALL_MEMBERS);
    const where: WhereOptions<StoreOrder> = { storeId };
    if (query.status) Object.assign(where, { status: query.status });

    const { rows, count } = await this.storeOrders.findAndCountAll({
      where,
      include: this.includes(),
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  async findOne(user: AuthUser, id: number) {
    const storeOrder = await this.storeOrders.findByPk(id, { include: this.includes() });
    if (!storeOrder) throw new NotFoundException('Store order not found');
    await this.access.assert(user, storeOrder.storeId, ALL_MEMBERS);
    return storeOrder;
  }

  async updateStatus(user: AuthUser, id: number, dto: UpdateStoreOrderStatusDto) {
    await this.sequelize.transaction(async (transaction) => {
      const storeOrder = await this.storeOrders.findByPk(id, { transaction });
      if (!storeOrder) throw new NotFoundException('Store order not found');
      await this.access.assert(user, storeOrder.storeId, ALL_MEMBERS, transaction);

      // Serialize concurrent changes to the same order, then re-read the fresh status.
      await this.orders.findByPk(storeOrder.orderId, { transaction, lock: transaction.LOCK.UPDATE });
      await storeOrder.reload({ transaction });

      if (!STORE_ORDER_TRANSITIONS[storeOrder.status].includes(dto.status)) {
        throw new BadRequestException(`Cannot change status from ${storeOrder.status} to ${dto.status}`);
      }
      if (dto.status === 'cancelled') await this.lifecycle.restoreStock(storeOrder.id, transaction);
      await storeOrder.update({ status: dto.status }, { transaction });
      await this.lifecycle.sync(storeOrder.orderId, transaction);
    });
    return this.findOne(user, id);
  }

  private includes() {
    return [
      {
        model: Order,
        attributes: ['id', 'status', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'username'], include: [{ model: Profile, attributes: ['firstName', 'lastName', 'phone'] }] },
          { model: Address },
        ],
      },
      { model: OrderItem, include: [OrderItemOption] },
    ];
  }
}
