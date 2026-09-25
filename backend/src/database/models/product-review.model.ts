import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Order } from './order.model';
import { Product } from './product.model';
import { User } from './user.model';

@Table({ tableName: 'product_reviews', underscored: true })
export class ProductReview extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.BIGINT, allowNull: false })
  productId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.BIGINT, allowNull: false })
  orderId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  rating: number;

  @Column(DataType.TEXT)
  comment: string | null;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Order)
  order?: Order;
}
