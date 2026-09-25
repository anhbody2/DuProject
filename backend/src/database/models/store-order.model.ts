import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Order, OrderStatus } from './order.model';
import { OrderItem } from './order-item.model';
import { Store } from './store.model';

@Table({ tableName: 'store_orders', underscored: true })
export class StoreOrder extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.BIGINT, allowNull: false })
  orderId: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeId: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  subtotal: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  deliveryFee: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  commissionAmount: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'pending' })
  status: OrderStatus;

  @BelongsTo(() => Order)
  order?: Order;

  @BelongsTo(() => Store)
  store?: Store;

  @HasMany(() => OrderItem)
  items?: OrderItem[];
}
