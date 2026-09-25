import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { OrderItemOption } from './order-item-option.model';
import { Product } from './product.model';
import { StoreOrder } from './store-order.model';

@Table({ tableName: 'order_items', underscored: true, updatedAt: false })
export class OrderItem extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => StoreOrder)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeOrderId: number;

  @ForeignKey(() => Product)
  @Column(DataType.BIGINT)
  productId: number | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  productName: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  unitPrice: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  subtotal: number;

  @BelongsTo(() => StoreOrder)
  storeOrder?: StoreOrder;

  @BelongsTo(() => Product)
  product?: Product;

  @HasMany(() => OrderItemOption)
  options?: OrderItemOption[];
}
