import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'profiles', underscored: true })
export class Profile extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false, unique: true })
  userId: number;

  @Column(DataType.STRING(100))
  firstName: string | null;

  @Column(DataType.STRING(100))
  lastName: string | null;

  @Column(DataType.STRING(30))
  phone: string | null;

  @Column(DataType.TEXT)
  avatarUrl: string | null;

  @BelongsTo(() => User)
  user?: User;
}
