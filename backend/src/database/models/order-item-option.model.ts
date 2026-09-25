import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OrderItem } from './order-item.model';

@Table({ tableName: 'order_item_options', underscored: true, timestamps: false })
export class OrderItemOption extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => OrderItem)
  @Column({ type: DataType.BIGINT, allowNull: false })
  orderItemId: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  optionName: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  priceModifier: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  quantity: number;

  @BelongsTo(() => OrderItem)
  orderItem?: OrderItem;
}
