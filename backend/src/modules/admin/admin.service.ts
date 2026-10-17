import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { textMatch } from '../../common/utils/search';
import { pageOptions, paginate } from '../../common/dto/pagination.dto';
import {
  Category,
  Delivery,
  Order,
  Payment,
  Product,
  ProductImage,
  Store,
  StoreOrder,
  User,
} from '../../database/models';
import {
  AdminOrdersQueryDto,
  AdminProductsQueryDto,
  AdminStoresQueryDto,
} from './dto/admin.dto';

type Row = Record<string, string | number | null>;

/** Numbers can come back as strings from aggregates on raw queries; normalise them. */
const num = (v: unknown) => Number(v ?? 0);

/** Turns `[{ key, count }]` into `{ key: count }`. */
const countsBy = (rows: Row[], key: string) =>
  Object.fromEntries(rows.map((r) => [String(r[key]), num(r.count)]));

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Store) private readonly stores: typeof Store,
    @InjectModel(Product) private readonly products: typeof Product,
    @InjectModel(Order) private readonly orders: typeof Order,
    private readonly sequelize: Sequelize,
  ) {}

  // ---------------------------------------------------------------- dashboard

  /**
   * Platform dashboard. One definition of money everywhere (B21):
   * - revenue = GMV of COMPLETED orders: orders.total (food + delivery fee), or the
   *   store_orders.subtotal slice for per-store / per-dish rankings;
   * - pendingRevenue = orders still in progress (not completed, not cancelled);
   * - commission = platform fee on completed store orders.
   * Daily series and top lists use the same "completed" rule as the totals; `orders`
   * counts are orders placed (any status) that day.
   */
  async stats(days: number) {
    const q = (sql: string, replacements: Record<string, unknown> = {}) =>
      this.sequelize.query<Row>(sql, { type: QueryTypes.SELECT, replacements });

    const [totals, daily, ordersByStatus, usersByRole, storesByStatus, productsByStatus, payments, topStores, topProducts] =
      await Promise.all([
        q(`
          SELECT
            (SELECT COUNT(*) FROM users)                                          AS users,
            (SELECT COUNT(*) FROM users WHERE created_at >= now() - interval '30 days') AS new_users,
            (SELECT COUNT(*) FROM stores WHERE deleted_at IS NULL)               AS stores,
            (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL)             AS products,
            (SELECT COUNT(*) FROM orders)                                         AS orders,
            (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed') AS revenue,
            (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('completed', 'cancelled')) AS pending_revenue,
            (SELECT COALESCE(SUM(commission_amount), 0) FROM store_orders WHERE status = 'completed') AS commission
        `),
        // One row per day, zero-filled, oldest first.
        q(
          `
          SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                 COUNT(o.id) AS orders,
                 COALESCE(SUM(o.total) FILTER (WHERE o.status = 'completed'), 0) AS revenue
          FROM generate_series(date_trunc('day', now()) - (:days - 1) * interval '1 day',
                               date_trunc('day', now()), interval '1 day') AS d(day)
          LEFT JOIN orders o ON o.created_at >= d.day AND o.created_at < d.day + interval '1 day'
          GROUP BY d.day
          ORDER BY d.day
        `,
          { days },
        ),
        q(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`),
        q(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`),
        q(`SELECT status, COUNT(*) AS count FROM stores WHERE deleted_at IS NULL GROUP BY status`),
        q(`SELECT status, COUNT(*) AS count FROM products WHERE deleted_at IS NULL GROUP BY status`),
        q(`
          SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
          FROM payments WHERE status <> 'failed'
          GROUP BY method ORDER BY amount DESC
        `),
        q(`
          SELECT s.id, s.name, s.logo_url AS "logoUrl",
                 COUNT(so.id) AS orders, COALESCE(SUM(so.subtotal), 0) AS revenue
          FROM store_orders so JOIN stores s ON s.id = so.store_id
          WHERE so.status = 'completed'
          GROUP BY s.id ORDER BY revenue DESC LIMIT 5
        `),
        q(`
          SELECT oi.product_id AS "productId", oi.product_name AS name, s.name AS "storeName",
                 SUM(oi.quantity) AS quantity, COALESCE(SUM(oi.subtotal), 0) AS revenue
          FROM order_items oi
          JOIN store_orders so ON so.id = oi.store_order_id
          JOIN stores s ON s.id = so.store_id
          WHERE so.status = 'completed'
          GROUP BY oi.product_id, oi.product_name, s.name
          ORDER BY quantity DESC LIMIT 5
        `),
      ]);

    const t = totals[0];
    return {
      totals: {
        users: num(t.users),
        newUsers: num(t.new_users),
        stores: num(t.stores),
        products: num(t.products),
        orders: num(t.orders),
        revenue: num(t.revenue),
        pendingRevenue: num(t.pending_revenue),
        commission: num(t.commission),
      },
      daily: daily.map((r) => ({ date: String(r.date), orders: num(r.orders), revenue: num(r.revenue) })),
      ordersByStatus: countsBy(ordersByStatus, 'status'),
      usersByRole: countsBy(usersByRole, 'role'),
      storesByStatus: countsBy(storesByStatus, 'status'),
      productsByStatus: countsBy(productsByStatus, 'status'),
      payments: payments.map((r) => ({ method: String(r.method), count: num(r.count), amount: num(r.amount) })),
      topStores: topStores.map((r) => ({
        id: num(r.id),
        name: String(r.name),
        logoUrl: r.logoUrl as string | null,
        orders: num(r.orders),
        revenue: num(r.revenue),
      })),
      topProducts: topProducts.map((r) => ({
        productId: r.productId === null ? null : num(r.productId),
        name: String(r.name),
        storeName: String(r.storeName),
        quantity: num(r.quantity),
        revenue: num(r.revenue),
      })),
    };
  }

  // ---------------------------------------------------------------- listings (every status)

  async findStores(query: AdminStoresQueryDto) {
    const where: WhereOptions<Store> = {};
    if (query.status) Object.assign(where, { status: query.status });
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [textMatch('Store.name', query.q), textMatch('Store.slug', query.q)],
      });
    }
    const { rows, count } = await this.stores.findAndCountAll({
      where,
      attributes: {
        include: [
          [Sequelize.literal('(SELECT COUNT(*) FROM products p WHERE p.store_id = "Store"."id" AND p.deleted_at IS NULL)'), 'productCount'],
          [
            Sequelize.literal(
              `(SELECT COUNT(*) FROM store_orders so WHERE so.store_id = "Store"."id" AND so.status <> 'cancelled')`,
            ),
            'orderCount',
          ],
        ],
      },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email'] },
        { model: Category, through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  async findProducts(query: AdminProductsQueryDto) {
    const where: WhereOptions<Product> = {};
    if (query.status) Object.assign(where, { status: query.status });
    if (query.storeId) Object.assign(where, { storeId: query.storeId });
    if (query.categoryId) Object.assign(where, { categoryId: query.categoryId });
    if (query.q) Object.assign(where, { [Op.and]: [textMatch('Product.name', query.q)] });

    const { rows, count } = await this.products.findAndCountAll({
      where,
      include: [
        { model: Store, attributes: ['id', 'name', 'slug', 'logoUrl', 'status'] },
        { model: Category, attributes: ['id', 'name'] },
        { model: ProductImage, separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']] },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }

  async findOrders(query: AdminOrdersQueryDto) {
    const where: WhereOptions<Order> = {};
    if (query.status) Object.assign(where, { status: query.status });
    if (query.q) {
      const id = /^\d+$/.test(query.q) ? Number(query.q) : null;
      Object.assign(where, {
        [Op.or]: [
          ...(id ? [{ id }] : []),
          { '$user.username$': { [Op.iLike]: `%${query.q}%` } },
          { '$user.email$': { [Op.iLike]: `%${query.q}%` } },
        ],
      });
    }

    const { rows, count } = await this.orders.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        {
          model: StoreOrder,
          separate: true,
          // paranoid: false - order history still names stores deleted since.
          include: [{ model: Store, attributes: ['id', 'name', 'slug', 'logoUrl'], paranoid: false }],
        },
        { model: Payment, separate: true, order: [['createdAt', 'ASC']] },
        { model: Delivery },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...pageOptions(query),
    });
    return paginate(rows, count, query);
  }
}
