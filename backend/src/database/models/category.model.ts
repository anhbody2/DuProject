import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Store } from './store.model';
import { StoreCategory } from './store-category.model';

@Table({ tableName: 'categories', underscored: true })
export class Category extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Category)
  @Column(DataType.BIGINT)
  parentId: number | null;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  slug: string;

  @BelongsTo(() => Category, 'parentId')
  parent?: Category;

  @HasMany(() => Category, 'parentId')
  children?: Category[];

  @BelongsToMany(() => Store, () => StoreCategory)
  stores?: Store[];
}
