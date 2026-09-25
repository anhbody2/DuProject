import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { CartItem } from './cart-item.model';
import { User } from './user.model';

@Table({ tableName: 'carts', underscored: true })
export class Cart extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false, unique: true })
  userId: number;

  @BelongsTo(() => User)
  user?: User;

  @HasMany(() => CartItem)
  items?: CartItem[];
}
