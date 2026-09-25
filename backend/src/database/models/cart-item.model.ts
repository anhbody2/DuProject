import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Cart } from './cart.model';
import { Product } from './product.model';

@Table({ tableName: 'cart_items', underscored: true })
export class CartItem extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.BIGINT, allowNull: false })
  cartId: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.BIGINT, allowNull: false })
  productId: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  quantity: number;

  @BelongsTo(() => Cart)
  cart?: Cart;

  @BelongsTo(() => Product)
  product?: Product;
}
