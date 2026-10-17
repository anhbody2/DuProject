import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';

/** At most one pending reset code per user; a new request replaces the old one. */
@Table({ tableName: 'password_resets', underscored: true, updatedAt: false })
export class PasswordReset extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: false, unique: true })
  userId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  codeHash: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  attempts: number;

  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt: Date;

  createdAt: Date;

  @BelongsTo(() => User)
  user?: User;
}
