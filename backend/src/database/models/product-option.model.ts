import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OptionGroup } from './option-group.model';

/** Maps to the `options` table (named ProductOption to avoid clashing with DOM `Option`). */
@Table({ tableName: 'options', underscored: true, timestamps: false })
export class ProductOption extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => OptionGroup)
  @Column({ type: DataType.BIGINT, allowNull: false })
  optionGroupId: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  priceModifier: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isAvailable: boolean;

  @BelongsTo(() => OptionGroup)
  optionGroup?: OptionGroup;
}
