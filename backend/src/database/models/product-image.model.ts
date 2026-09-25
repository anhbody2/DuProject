import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';

@Table({ tableName: 'product_images', underscored: true, updatedAt: false })
export class ProductImage extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.BIGINT, allowNull: false })
  productId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  imageUrl: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sortOrder: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isPrimary: boolean;

  @BelongsTo(() => Product)
  product?: Product;
}
