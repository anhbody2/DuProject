import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Includeable, Op, WhereOptions, literal } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/types/auth-user';
import { fromCents, toCents } from '../../common/utils/money';
import {
  Address,
  Cart,
  CartItem,
  Delivery,
  OptionGroup,
  Order,
  OrderItem,
  OrderItemOption,
  Payment,
  PaymentStatus,
  Product,
  ProductOption,
  Store,
  StoreOrder,
  User,
} from '../../database/models';
import {
  CheckoutItemDto,
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateDeliveryDto,
  UpdatePaymentStatusDto,
} from './dto/order.dto';
import { OrderLifecycleService } from './order-lifecycle.service';

interface PricedLine {
  product: Product;
  quantity: number;
  options: ProductOption[];
  unitPrice: number; // cents
  lineTotal: number; // cents
}

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'failed'],
  failed: ['pending'],
  paid: ['refunded'],
  refunded: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order) private readonly orders: typeof Order,
    @InjectModel(StoreOrder) private readonly storeOrders: typeof StoreOrder,
    @InjectModel(Product) private readonly products: typeof Product,
    @InjectModel(Address) private readonly addresses: typeof Address,
    @InjectModel(Cart) private readonly carts: typeof Cart,
    @InjectModel(CartItem) private readonly cartItems: typeof CartItem,
    @InjectModel(Payment) private readonly payments: typeof Payment,
    @InjectModel(Delivery) private readonly deliveries: typeof Delivery,
    private readonly lifecycle: OrderLifecycleService,
    private readonly sequelize: Sequelize,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- checkout

  async checkout(user: AuthUser, dto: CreateOrderDto) {
    const orderId = await this.sequelize.transaction(async (transaction) => {
      const address = await this.addresses.findOne({
        where: { id: dto.deliveryAddressId, userId: user.id },
        transaction,
      });
      if (!address) throw new NotFoundException('Delivery address not found');

      const cart = await this.carts.findOne({
        where: { userId: user.id },
        include: [CartItem],
        transaction,
      });
      const lines: CheckoutItemDto[] =
        dto.items ??
        (cart?.items ?? []).map((i) => ({ productId: i.productId, quantity: i.quantity }));
      if (!lines.length) throw new BadRequestException('Cart is empty');

      const products = await this.products.findAll({
        where: { id: [...new Set(lines.map((l) => l.productId))] },
        include: [Store, { model: OptionGroup, include: [ProductOption] }],
        transaction,
      });
      const productsById = new Map(products.map((p) => [p.id, p]));
      const priced = lines.map((line) => this.priceLine(line, productsById.get(line.productId)));

      await this.reserveStock(priced, transaction);

      // Split into one store_order per store.
      const byStore = new Map<number, PricedLine[]>();
      for (const line of priced) {
        const list = byStore.get(line.product.storeId) ?? [];
        list.push(line);
        byStore.set(line.product.storeId, list);
      }

      const feePerStore = toCents(this.config.get('DELIVERY_FEE_PER_STORE', 15000));
      const commissionRate = Number(this.config.get('COMMISSION_RATE', 0.1));

      let subtotal = 0;
      let deliveryFee = 0;
      const storeOrders = [...byStore].map(([storeId, storeLines]) => {
        const storeSubtotal = storeLines.reduce((sum, l) => sum + l.lineTotal, 0);
        subtotal += storeSubtotal;
        deliveryFee += feePerStore;
        return {
          storeId,
          subtotal: fromCents(storeSubtotal),
          deliveryFee: fromCents(feePerStore),
          commissionAmount: fromCents(Math.round(storeSubtotal * commissionRate)),
          items: storeLines.map((l) => ({
            productId: l.product.id,
            productName: l.product.name,
            unitPrice: fromCents(l.unitPrice),
            quantity: l.quantity,
            subtotal: fromCents(l.lineTotal),
            options: l.options.map((o) => ({
              optionName: o.name,
              priceModifier: o.priceModifier,
              quantity: 1,
            })),
          })),
        };
      });
      const total = fromCents(subtotal + deliveryFee);

      const order = await this.orders.create(
        {
          userId: user.id,
          deliveryAddressId: address.id,
          subtotal: fromCents(subtotal),
          deliveryFee: fromCents(deliveryFee),
          discount: 0,
          total,
          storeOrders,
          payments: [{ method: dto.paymentMethod, amount: total }],
          delivery: { deliveryAddressId: address.id, deliveryFee: fromCents(deliveryFee) },
        },
        {
          include: [
            {
              association: 'storeOrders',
              include: [{ association: 'items', include: [{ association: 'options' }] }],
            },
            { association: 'payments' },
            { association: 'delivery' },
          ],
          transaction,
        },
      );

      if (cart) {
        await this.cartItems.destroy({
          where: { cartId: cart.id, productId: [...productsById.keys()] },
          transaction,
        });
      }
      return order.id;
    });

    return this.findOne(user, orderId);
  }

  // ---------------------------------------------------------------- customer / admin reads

  /** Customers see their own orders; admins see all. */
  async findAll(user: AuthUser, query: ListOrdersQueryDto) {
    const where: WhereOptions<Order> = {};
    if (user.role !== 'admin') Object.assign(where, { userId: user.id });
    if (query.status) Object.assign(where, { status: query.status });

    const { rows, count } = await this.orders.findAndCountAll({
      where,
      include: [
        {
          model: StoreOrder,
          separate: true,
          include: [{ model: Store, attributes: ['id', 'name', 'slug', 'logoUrl'] }],
        },
        { model: Delivery, attributes: ['id', 'status', 'estimatedAt', 'deliveredAt'] },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  async findOne(user: AuthUser, id: number) {
    const order = await this.orders.findByPk(id, { include: this.detailIncludes() });
    if (!order || (user.role !== 'admin' && order.userId !== user.id)) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findPayments(user: AuthUser, orderId: number) {
    await this.assertOwnOrder(user, orderId);
    return this.payments.findAll({ where: { orderId }, order: [['createdAt', 'ASC']] });
  }

  async findDelivery(user: AuthUser, orderId: number) {
    await this.assertOwnOrder(user, orderId);
    return this.deliveries.findOne({ where: { orderId }, include: [{ model: Address }] });
  }

  /** Customer can cancel until any store starts preparing. */
  async cancel(user: AuthUser, id: number) {
    await this.sequelize.transaction(async (transaction) => {
      const order = await this.orders.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order || (user.role !== 'admin' && order.userId !== user.id)) {
        throw new NotFoundException('Order not found');
      }
      const storeOrders = await this.storeOrders.findAll({ where: { orderId: id }, transaction });
      const cancellable = storeOrders.every((so) => ['pending', 'confirmed', 'cancelled'].includes(so.status));
      if (order.status === 'cancelled' || !cancellable) {
        throw new BadRequestException('Order can no longer be cancelled');
      }
      for (const so of storeOrders.filter((s) => s.status !== 'cancelled')) {
        await this.lifecycle.restoreStock(so.id, transaction);
        await so.update({ status: 'cancelled' }, { transaction });
      }
      await this.lifecycle.sync(id, transaction);
    });
    return this.findOne(user, id);
  }

  // ---------------------------------------------------------------- admin: payments & deliveries

  async updatePaymentStatus(paymentId: number, dto: UpdatePaymentStatusDto) {
    const payment = await this.payments.findByPk(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (!PAYMENT_TRANSITIONS[payment.status].includes(dto.status)) {
      throw new BadRequestException(`Cannot change payment from ${payment.status} to ${dto.status}`);
    }
    return payment.update({
      status: dto.status,
      transactionId: dto.transactionId ?? payment.transactionId,
      paidAt: dto.status === 'paid' ? new Date() : payment.paidAt,
    });
  }

  async updateDelivery(deliveryId: number, dto: UpdateDeliveryDto) {
    const delivery = await this.deliveries.findByPk(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status === 'delivered' || delivery.status === 'cancelled') {
      throw new BadRequestException(`Delivery is already ${delivery.status}`);
    }
    const now = new Date();
    return delivery.update({
      ...(dto.estimatedAt ? { estimatedAt: new Date(dto.estimatedAt) } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.status === 'picked_up' || dto.status === 'delivering'
        ? { pickedUpAt: delivery.pickedUpAt ?? now }
        : {}),
      ...(dto.status === 'delivered' ? { deliveredAt: now, pickedUpAt: delivery.pickedUpAt ?? now } : {}),
    });
  }

  // ---------------------------------------------------------------- helpers

  private priceLine(line: CheckoutItemDto, product?: Product): PricedLine {
    if (!product || product.status !== 'active' || product.store?.status !== 'active') {
      throw new BadRequestException(`Product ${line.productId} is not available`);
    }

    const optionIndex = new Map(
      product.optionGroups!.flatMap((g) => g.options!.map((o) => [o.id, o] as const)),
    );
    const options = [...new Set(line.optionIds ?? [])].map((id) => {
      const option = optionIndex.get(id);
      if (!option) throw new BadRequestException(`Option ${id} does not belong to "${product.name}"`);
      if (!option.isAvailable) throw new BadRequestException(`Option "${option.name}" is unavailable`);
      return option;
    });

    for (const group of product.optionGroups!) {
      const selected = options.filter((o) => o.optionGroupId === group.id).length;
      const min = Math.max(group.minSelection, group.required ? 1 : 0);
      if (selected < min || selected > group.maxSelection) {
        throw new BadRequestException(
          `"${product.name}" - "${group.name}" requires ${min}-${group.maxSelection} selection(s)`,
        );
      }
    }

    const unitPrice =
      toCents(product.salePrice ?? product.price) +
      options.reduce((sum, o) => sum + toCents(o.priceModifier), 0);
    return { product, quantity: line.quantity, options, unitPrice, lineTotal: unitPrice * line.quantity };
  }

  /** Atomic conditional decrement - fails if another order took the stock first. */
  private async reserveStock(lines: PricedLine[], transaction: import('sequelize').Transaction) {
    const qtyByProduct = new Map<number, number>();
    for (const l of lines) qtyByProduct.set(l.product.id, (qtyByProduct.get(l.product.id) ?? 0) + l.quantity);

    for (const [productId, qty] of qtyByProduct) {
      const [affected] = await this.products.update(
        { stock: literal(`stock - ${Number(qty)}`) },
        { where: { id: productId, stock: { [Op.gte]: qty } }, transaction },
      );
      if (!affected) {
        const name = lines.find((l) => l.product.id === productId)!.product.name;
        throw new ConflictException(`Not enough stock for "${name}"`);
      }
    }
    await this.products.update(
      { status: 'out_of_stock' },
      { where: { id: [...qtyByProduct.keys()], stock: 0, status: 'active' }, transaction },
    );
  }

  private async assertOwnOrder(user: AuthUser, orderId: number) {
    const order = await this.orders.findByPk(orderId, { attributes: ['id', 'userId'] });
    if (!order || (user.role !== 'admin' && order.userId !== user.id)) {
      throw new NotFoundException('Order not found');
    }
  }

  private detailIncludes(): Includeable[] {
    return [
      { model: User, attributes: ['id', 'username', 'email'] },
      { model: Address },
      {
        model: StoreOrder,
        separate: true,
        include: [
          { model: Store, attributes: ['id', 'name', 'slug', 'logoUrl', 'phone'] },
          { model: OrderItem, include: [OrderItemOption] },
        ],
      },
      { model: Payment, separate: true, order: [['createdAt', 'ASC']] },
      { model: Delivery },
    ];
  }
}
