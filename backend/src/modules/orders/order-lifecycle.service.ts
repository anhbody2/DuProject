import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction, literal } from 'sequelize';
import { fromCents, toCents } from '../../common/utils/money';
import {
  Delivery,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  Product,
  StoreOrder,
} from '../../database/models';

/** Progress order of statuses; `cancelled` is terminal and excluded. */
const PROGRESS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed'];

/** Allowed store-order transitions. */
export const STORE_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering'],
  delivering: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * Keeps an order consistent with its store orders: derives the order status,
 * recalculates totals, and cascades to payment + delivery.
 * All methods must run inside the caller's transaction.
 */
@Injectable()
export class OrderLifecycleService {
  constructor(
    @InjectModel(Order) private readonly orders: typeof Order,
    @InjectModel(OrderItem) private readonly orderItems: typeof OrderItem,
    @InjectModel(Product) private readonly products: typeof Product,
  ) {}

  /** Returns reserved stock for every item of a store order. */
  async restoreStock(storeOrderId: number, transaction: Transaction) {
    const items = await this.orderItems.findAll({
      where: { storeOrderId, productId: { [Op.ne]: null } },
      transaction,
    });
    for (const item of items) {
      await this.products.update(
        { stock: literal(`stock + ${Number(item.quantity)}`) },
        { where: { id: item.productId! }, transaction },
      );
    }
    if (items.length) {
      await this.products.update(
        { status: 'active' },
        {
          where: {
            id: items.map((i) => i.productId!),
            status: 'out_of_stock',
            stock: { [Op.gt]: 0 },
          },
          transaction,
        },
      );
    }
  }

  async sync(orderId: number, transaction: Transaction) {
    const order = await this.orders.findByPk(orderId, {
      include: [StoreOrder, Payment, Delivery],
      transaction,
    });
    if (!order) return;

    const active = order.storeOrders!.filter((so) => so.status !== 'cancelled');
    const status: OrderStatus = active.length
      ? PROGRESS[Math.min(...active.map((so) => PROGRESS.indexOf(so.status)))]
      : 'cancelled';

    // Totals only count store orders that are still alive.
    if (active.length) {
      const subtotal = active.reduce((sum, so) => sum + toCents(so.subtotal), 0);
      const deliveryFee = active.reduce((sum, so) => sum + toCents(so.deliveryFee), 0);
      const total = Math.max(0, subtotal + deliveryFee - toCents(order.discount));
      await order.update(
        {
          status,
          subtotal: fromCents(subtotal),
          deliveryFee: fromCents(deliveryFee),
          total: fromCents(total),
        },
        { transaction },
      );
    } else {
      await order.update({ status }, { transaction });
    }

    const now = new Date();

    for (const payment of order.payments!) {
      if (status === 'cancelled') {
        if (payment.status === 'paid') await payment.update({ status: 'refunded' }, { transaction });
        else if (payment.status === 'pending') await payment.update({ status: 'failed' }, { transaction });
      } else if (payment.status === 'pending') {
        const collectCash = status === 'completed' && payment.method === 'cash';
        await payment.update(
          {
            amount: order.total,
            ...(collectCash ? { status: 'paid', paidAt: now } : {}),
          },
          { transaction },
        );
      }
    }

    const delivery = order.delivery;
    if (delivery && delivery.status !== 'delivered' && delivery.status !== 'cancelled') {
      if (status === 'cancelled') {
        await delivery.update({ status: 'cancelled' }, { transaction });
      } else if (status === 'delivering') {
        await delivery.update(
          { status: 'delivering', pickedUpAt: delivery.pickedUpAt ?? now, deliveryFee: order.deliveryFee },
          { transaction },
        );
      } else if (status === 'completed') {
        await delivery.update(
          { status: 'delivered', pickedUpAt: delivery.pickedUpAt ?? now, deliveredAt: now },
          { transaction },
        );
      } else {
        await delivery.update({ deliveryFee: order.deliveryFee }, { transaction });
      }
    }
  }
}
