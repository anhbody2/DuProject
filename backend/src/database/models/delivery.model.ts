import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Address } from './address.model';
import { Order } from './order.model';

export const DELIVERY_STATUSES = [
  'pending',
  'assigned',
  'picked_up',
  'delivering',
  'delivered',
  'cancelled',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

@Table({ tableName: 'deliveries', underscored: true })
export class Delivery extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.BIGINT, allowNull: false, unique: true })
  orderId: number;

  @ForeignKey(() => Address)
  @Column(DataType.BIGINT)
  deliveryAddressId: number | null;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'pending' })
  status: DeliveryStatus;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  deliveryFee: number;

  @Column(DataType.DATE)
  estimatedAt: Date | null;

  @Column(DataType.DATE)
  pickedUpAt: Date | null;

  @Column(DataType.DATE)
  deliveredAt: Date | null;

  @BelongsTo(() => Order)
  order?: Order;

  @BelongsTo(() => Address)
  deliveryAddress?: Address;
}
