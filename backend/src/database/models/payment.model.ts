import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Order } from './order.model';

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

@Table({ tableName: 'payments', underscored: true, updatedAt: false })
export class Payment extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.BIGINT, allowNull: false })
  orderId: number;

  @Column({ type: DataType.STRING(30), allowNull: false })
  method: PaymentMethod;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'pending' })
  status: PaymentStatus;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount: number;

  @Column(DataType.STRING(255))
  transactionId: string | null;

  @Column(DataType.DATE)
  paidAt: Date | null;

  @BelongsTo(() => Order)
  order?: Order;
}
