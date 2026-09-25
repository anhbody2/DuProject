import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Category } from './category.model';
import { Store } from './store.model';

@Table({ tableName: 'store_categories', underscored: true, timestamps: false })
export class StoreCategory extends Model {
  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  storeId: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  categoryId: number;
}
