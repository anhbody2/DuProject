import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'addresses', underscored: true })
export class Address extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false })
  userId: number;

  @Column(DataType.STRING(50))
  label: string | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  recipientName: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  phone: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  addressLine: string;

  @Column(DataType.STRING(100))
  ward: string | null;

  @Column(DataType.STRING(100))
  district: string | null;

  @Column(DataType.STRING(100))
  city: string | null;

  @Column(DataType.DECIMAL(10, 7))
  latitude: number | null;

  @Column(DataType.DECIMAL(10, 7))
  longitude: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isDefault: boolean;

  @BelongsTo(() => User)
  user?: User;
}
