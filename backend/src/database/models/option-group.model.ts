import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { ProductOption } from './product-option.model';

@Table({ tableName: 'option_groups', underscored: true, timestamps: false })
export class OptionGroup extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.BIGINT, allowNull: false })
  productId: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  minSelection: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  maxSelection: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  required: boolean;

  @BelongsTo(() => Product)
  product?: Product;

  @HasMany(() => ProductOption)
  options?: ProductOption[];
}
