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
import { Category } from './category.model';
import { Product } from './product.model';
import { StoreCategory } from './store-category.model';
import { StoreLocation } from './store-location.model';
import { StoreMember } from './store-member.model';
import { StoreReview } from './store-review.model';
import { User } from './user.model';

export const STORE_STATUSES = ['pending', 'active', 'inactive', 'suspended'] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

@Table({ tableName: 'stores', underscored: true })
export class Store extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  ownerId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  slug: string;

  @Column(DataType.TEXT)
  description: string | null;

  @Column(DataType.TEXT)
  logoUrl: string | null;

  @Column(DataType.TEXT)
  coverUrl: string | null;

  @Column(DataType.STRING(30))
  phone: string | null;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'pending' })
  status: StoreStatus;

  @BelongsTo(() => User, 'ownerId')
  owner?: User;

  @HasMany(() => StoreLocation)
  locations?: StoreLocation[];

  @HasMany(() => StoreMember)
  members?: StoreMember[];

  @BelongsToMany(() => Category, () => StoreCategory)
  categories?: Category[];

  @HasMany(() => Product)
  products?: Product[];

  @HasMany(() => StoreReview)
  reviews?: StoreReview[];
}
