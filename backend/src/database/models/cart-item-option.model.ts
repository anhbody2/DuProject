import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { CartItem } from './cart-item.model';
import { ProductOption } from './product-option.model';

@Table({ tableName: 'cart_item_options', underscored: true, timestamps: false })
export class CartItemOption extends Model {
  @ForeignKey(() => CartItem)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  cartItemId: number;

  @ForeignKey(() => ProductOption)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  optionId: number;
}
