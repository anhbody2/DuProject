import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Category } from './category.model';
import { OptionGroup } from './option-group.model';
import { ProductImage } from './product-image.model';
import { ProductReview } from './product-review.model';
import { Store } from './store.model';
import { validate } from 'class-validator';

export const PRODUCT_STATUSES = ['active', 'inactive', 'out_of_stock'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// paranoid: DELETE sets deleted_at; default queries skip deleted rows.
@Table({ tableName: 'products', underscored: true, paranoid: true })
export class Product extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeId: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.BIGINT, allowNull: false })
  categoryId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  slug: string;

  @Column(DataType.TEXT)
  description: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, validate: { min: 10000 } })
  price: number;

  @Column(DataType.DECIMAL(12, 2))
  salePrice: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  stock: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'active' })
  status: ProductStatus;

  declare deletedAt: Date | null;

  @BelongsTo(() => Store)
  store?: Store;

  @BelongsTo(() => Category)
  category?: Category;

  @HasMany(() => ProductImage)
  images?: ProductImage[];

  @HasMany(() => OptionGroup)
  optionGroups?: OptionGroup[];

  @HasMany(() => ProductReview)
  reviews?: ProductReview[];
}
