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
import { Address, type AddressSnapshot } from './address.model';
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
/** Terminal statuses: an order in one of these is order history, not in progress. */
export const FINISHED_ORDER_STATUSES: OrderStatus[] = ['completed', 'cancelled'];
/** Matches the VARCHAR(500) of orders.note. */
export const ORDER_NOTE_MAX_LENGTH = 500;

@Table({ tableName: 'orders', underscored: true })
export class Order extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  /** The saved address picked at checkout; NULL once the customer deletes it. */
  @ForeignKey(() => Address)
  @Column(DataType.BIGINT)
  deliveryAddressId: number | null;

  /** Where to deliver, copied at checkout so later edits or deletes don't move the order. */
  @Column(DataType.JSONB)
  deliveryAddress: AddressSnapshot | null;

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

  /** The customer's note for the store / driver, typed at checkout. */
  @Column(DataType.STRING(ORDER_NOTE_MAX_LENGTH))
  note: string | null;

  createdAt: Date;

  @BelongsTo(() => User)
  user?: User;

  @HasMany(() => StoreOrder)
  storeOrders?: StoreOrder[];

  @HasMany(() => Payment)
  payments?: Payment[];

  @HasOne(() => Delivery)
  delivery?: Delivery;
}
