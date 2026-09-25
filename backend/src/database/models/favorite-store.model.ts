import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Store } from './store.model';
import { User } from './user.model';

@Table({ tableName: 'favorite_stores', underscored: true, updatedAt: false })
export class FavoriteStore extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  userId: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  storeId: number;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Store)
  store?: Store;
}
