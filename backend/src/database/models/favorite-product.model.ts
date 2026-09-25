import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';
import { User } from './user.model';

@Table({ tableName: 'favorite_products', underscored: true, updatedAt: false })
export class FavoriteProduct extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  userId: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  productId: number;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Product)
  product?: Product;
}
