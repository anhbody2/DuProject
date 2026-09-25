import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Address } from './address.model';
import { Delivery } from './delivery.model';
import { Payment } from './payment.model';
import { StoreOrder } from './store-order.model';
import { User } from './user.model';

/** Ordered by progress; `cancelled` is terminal and sits outside the progression. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Table({ tableName: 'orders', underscored: true })
export class Order extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @ForeignKey(() => Address)
  @Column(DataType.BIGINT)
  deliveryAddressId: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  subtotal: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  deliveryFee: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  discount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  total: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'pending' })
  status: OrderStatus;

  createdAt: Date;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Address)
  deliveryAddress?: Address;

  @HasMany(() => StoreOrder)
  storeOrders?: StoreOrder[];

  @HasMany(() => Payment)
  payments?: Payment[];

  @HasOne(() => Delivery)
  delivery?: Delivery;
}
