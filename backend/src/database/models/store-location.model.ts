import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Store } from './store.model';

@Table({ tableName: 'store_locations', underscored: true, updatedAt: false })
export class StoreLocation extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Store)
  @Column({ type: DataType.BIGINT, allowNull: false })
  storeId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  addressLine: string;

  @Column(DataType.STRING(100))
  ward: string | null;

  @Column(DataType.STRING(100))
  district: string | null;

  @Column(DataType.STRING(100))
  city: string | null;

  @Column({ type: DataType.DECIMAL(10, 7), allowNull: false })
  latitude: number;

  @Column({ type: DataType.DECIMAL(10, 7), allowNull: false })
  longitude: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isPrimary: boolean;

  @BelongsTo(() => Store)
  store?: Store;
}
