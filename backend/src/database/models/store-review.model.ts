import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Order } from './order.model';
import { Store } from './store.model';
import { User } from './user.model';

@Table({ tableName: 'store_reviews', underscored: true })
export class StoreReview extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeId: number;

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

  @BelongsTo(() => Store)
  store?: Store;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Order)
  order?: Order;
}
